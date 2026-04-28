"""
Vector Database Handler
Manages FAISS vector store operations for document embeddings.

Uses ONNX Runtime for lightweight embeddings (~50MB RAM) instead of
full PyTorch + sentence-transformers (~250MB RAM) — critical for
512MB RAM environments like Render free tier.
"""

import os
import gc
import pickle
from typing import List, Dict, Tuple
from pathlib import Path
import logging
import time
import numpy as np
from huggingface_hub import snapshot_download

from langchain.schema import Document
from langchain.embeddings.base import Embeddings

# Lazy imports - loaded on first use to avoid DLL issues at startup
FAISS = None

def _ensure_faiss_loaded():
    """Lazy load FAISS."""
    global FAISS
    if FAISS is None:
        from langchain_community.vectorstores import FAISS as _FAISS
        FAISS = _FAISS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ONNXMiniLMEmbeddings(Embeddings):
    """
    Lightweight embeddings using ONNX Runtime instead of PyTorch.

    Loads the all-MiniLM-L6-v2 model via ONNX (~30MB model file)
    instead of PyTorch (~91MB weights + ~150MB PyTorch runtime).
    
    Saves ~150-200MB RAM compared to HuggingFaceEmbeddings — the
    difference between crashing and running on Render's 512MB free tier.
    """

    def __init__(self, model_path: str):
        """
        Initialize ONNX embeddings.
        
        Args:
            model_path: Path to the downloaded model directory containing
                        the ONNX model file and tokenizer files.
        """
        import onnxruntime as ort

        # Suppress "None of PyTorch, TensorFlow >= 2.0, or Flax have been found"
        # warning — we only need the tokenizer, not a deep-learning backend.
        os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "1"
        from transformers import AutoTokenizer

        # Limit ONNX Runtime to 2 threads to conserve memory
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = 2
        sess_options.inter_op_num_threads = 2
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        onnx_path = os.path.join(model_path, "model.onnx")
        if not os.path.exists(onnx_path):
            # Fallback: check for onnx subfolder
            onnx_subdir = os.path.join(model_path, "onnx")
            if os.path.isdir(onnx_subdir):
                onnx_path = os.path.join(onnx_subdir, "model.onnx")

        if not os.path.exists(onnx_path):
            raise FileNotFoundError(
                f"ONNX model not found at {onnx_path}. "
                "Make sure the model was downloaded with the ONNX variant."
            )

        self._session = ort.InferenceSession(onnx_path, sess_options, providers=["CPUExecutionProvider"])
        self._tokenizer = AutoTokenizer.from_pretrained(model_path)

        logger.info("ONNX MiniLM embeddings loaded successfully")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _mean_pooling(self, model_output: np.ndarray, attention_mask: np.ndarray) -> np.ndarray:
        """Apply mean pooling to token embeddings (same as sentence-transformers)."""
        # model_output shape: (batch, seq_len, hidden_dim)
        mask_expanded = np.expand_dims(attention_mask, axis=-1).astype(np.float32)
        sum_embeddings = np.sum(model_output * mask_expanded, axis=1)
        sum_mask = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
        return sum_embeddings / sum_mask

    def _normalize(self, embeddings: np.ndarray) -> np.ndarray:
        """L2-normalize embeddings."""
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms = np.clip(norms, a_min=1e-9, a_max=None)
        return embeddings / norms

    def _embed(self, texts: List[str]) -> List[List[float]]:
        """Run ONNX inference and return normalized embeddings."""
        encoded = self._tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors="np",
        )

        input_ids = encoded["input_ids"].astype(np.int64)
        attention_mask = encoded["attention_mask"].astype(np.int64)

        # Some ONNX exports expect token_type_ids
        feeds = {"input_ids": input_ids, "attention_mask": attention_mask}
        input_names = [inp.name for inp in self._session.get_inputs()]
        if "token_type_ids" in input_names:
            feeds["token_type_ids"] = np.zeros_like(input_ids)

        outputs = self._session.run(None, feeds)
        # outputs[0] is the last_hidden_state (batch, seq_len, hidden)
        token_embeddings = outputs[0]

        pooled = self._mean_pooling(token_embeddings, encoded["attention_mask"].astype(np.float32))
        normalized = self._normalize(pooled)
        return normalized.tolist()

    # ------------------------------------------------------------------
    # LangChain Embeddings interface
    # ------------------------------------------------------------------

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents (chunks). Processes in small batches to save memory."""
        all_embeddings: List[List[float]] = []
        batch_size = 16  # Small batches to limit peak memory
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            all_embeddings.extend(self._embed(batch))
            # Free intermediate memory between batches
            if i + batch_size < len(texts):
                gc.collect()
        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query string."""
        return self._embed([text])[0]


class VectorDBHandler:
    """Handles FAISS vector database operations."""
    
    def __init__(self, vector_store_path: str = "./vector_store", hf_api_key: str = None):
        """
        Initialize vector database handler.
        
        Args:
            vector_store_path: Path to store FAISS index
            hf_api_key: HuggingFace API key (not used - kept for compatibility)
        """
        self.vector_store_path = Path(vector_store_path)
        self.vector_store_path.mkdir(parents=True, exist_ok=True)
        
        # LAZY LOADING: Don't load model at startup to avoid timeout
        # Model will be loaded on first use (first document upload)
        self.embeddings = None
        self._embeddings_loaded = False
        
        self.vector_store = None
        self.metadata_file = self.vector_store_path / "metadata.pkl"
        
        logger.info("VectorDBHandler initialized (model will load on first use)")
    
    def _ensure_embeddings_loaded(self):
        """Lazy load embeddings model on first use."""
        if self._embeddings_loaded:
            return
        
        _ensure_faiss_loaded()
        logger.info("Loading ONNX embeddings model (first use)...")
        try:
            model_id = "sentence-transformers/all-MiniLM-L6-v2"

            # Download the ONNX variant of the model — much lighter than PyTorch.
            # We need: tokenizer files + the ONNX model file.
            local_model_path = snapshot_download(
                repo_id=model_id,
                cache_dir="./hf_cache",
                allow_patterns=[
                    "config.json",
                    "tokenizer.json",
                    "tokenizer_config.json",
                    "special_tokens_map.json",
                    "vocab.txt",
                    "onnx/model.onnx",       # ONNX model (~30MB)
                ],
                ignore_patterns=[
                    "pytorch_model.bin",      # Skip PyTorch weights (~91MB)
                    "model.safetensors",
                    "*.h5",
                    "*.ot",
                    "*.msgpack",
                    "rust_model.ot",
                    "tf_model.h5",
                    "flax_model.msgpack",
                    "openvino/*",
                ],
            )

            self.embeddings = ONNXMiniLMEmbeddings(model_path=local_model_path)
            self._embeddings_loaded = True
            logger.info("Successfully loaded ONNX embeddings model")
            
            # Now try to load existing vector store if it exists
            self._load_vector_store()

            # Free download artifacts from memory
            gc.collect()
        except Exception as e:
            logger.error(f"Error loading embeddings model: {e}")
            raise
    
    def _load_vector_store(self):
        """Load existing FAISS vector store if available."""
        index_path = self.vector_store_path / "index.faiss"
        
        if index_path.exists():
            try:
                logger.info("Loading existing vector store...")
                self.vector_store = FAISS.load_local(
                    str(self.vector_store_path),
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info("Successfully loaded existing vector store")
            except Exception as e:
                logger.error(f"Error loading vector store: {e}", exc_info=True)
                self.vector_store = None
        else:
            logger.info("No existing vector store found, will create new one on first document")
    
    def add_documents(self, documents: List[Document]):
        """
        Add documents to vector store.
        
        Args:
            documents: List of LangChain Document objects with page_content and metadata
        """
        try:
            # Ensure embeddings model is loaded (lazy loading)
            self._ensure_embeddings_loaded()
            
            # Filter out empty documents
            valid_documents = [
                doc for doc in documents 
                if doc.page_content and doc.page_content.strip()
            ]
            
            if not valid_documents:
                raise ValueError("No valid text content found in documents. The PDF may be scanned images or have encoding issues.")
            
            logger.info(f"Processing {len(valid_documents)} valid documents (filtered from {len(documents)} total)")
            
            if self.vector_store is None:
                # Create new vector store
                self.vector_store = FAISS.from_documents(valid_documents, self.embeddings)
                logger.info(f"Created new vector store with {len(valid_documents)} documents")
            else:
                # Add to existing vector store
                self.vector_store.add_documents(valid_documents)
                logger.info(f"Added {len(valid_documents)} documents to existing vector store")
            
            # Save the updated vector store
            self._save_vector_store()

            # Explicit GC to free embedding intermediates
            gc.collect()
            
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            raise
    
    def _save_vector_store(self):
        """Persist vector store to disk."""
        try:
            self.vector_store.save_local(str(self.vector_store_path))
            logger.info("Vector store saved successfully")
        except Exception as e:
            logger.error(f"Error saving vector store: {str(e)}")
            raise
    
    def similarity_search(
        self, 
        query: str, 
        k: int = 4
    ) -> List[Tuple[str, Dict, float]]:
        """
        Search for similar documents.
        
        Args:
            query: Search query
            k: Number of results to return
            
        Returns:
            List of tuples (content, metadata, score)
        """
        # Ensure embeddings model is loaded (needed for query embedding)
        self._ensure_embeddings_loaded()
        
        if self.vector_store is None:
            logger.warning("Vector store is empty")
            return []
        
        try:
            # Perform similarity search with scores
            results = self.vector_store.similarity_search_with_score(query, k=k)
            
            # Format results
            formatted_results = [
                (doc.page_content, doc.metadata, score)
                for doc, score in results
            ]
            
            logger.info(f"Found {len(formatted_results)} relevant documents")
            return formatted_results
        
        except Exception as e:
            logger.error(f"Error performing similarity search: {str(e)}")
            raise
    
    def get_relevant_documents(
        self, 
        query: str, 
        k: int = 4
    ) -> Tuple[List[str], List[str]]:
        """
        Get relevant document chunks and their sources.
        
        Args:
            query: Search query
            k: Number of results
            
        Returns:
            Tuple of (chunks, source_names)
        """
        results = self.similarity_search(query, k=k)
        
        chunks = []
        sources = []
        
        for content, metadata, score in results:
            chunks.append(content)
            source_name = metadata.get('source', 'Unknown')
            # Extract just the filename
            source_name = Path(source_name).name
            sources.append(source_name)
        
        return chunks, sources
    
    def delete_by_source(self, source_name: str):
        """
        Delete documents from a specific source by rebuilding the FAISS index.
        
        FAISS doesn't support native deletion, so we:
        1. Extract all stored documents from the docstore
        2. Filter out those whose 'source' metadata matches source_name
        3. Rebuild the vector store from the remaining documents
        
        Args:
            source_name: Name of source file to remove
        """
        _ensure_faiss_loaded()
        self._ensure_embeddings_loaded()

        if self.vector_store is None:
            return

        try:
            # Extract all documents from the docstore
            docstore = self.vector_store.docstore
            all_ids = list(self.vector_store.index_to_docstore_id.values())
            
            remaining_docs = []
            removed_count = 0
            
            for doc_id in all_ids:
                doc = docstore.search(doc_id)
                if doc and hasattr(doc, 'metadata'):
                    doc_source = doc.metadata.get('source', '')
                    # Match by exact filename or by path ending
                    if doc_source == source_name or Path(doc_source).name == source_name:
                        removed_count += 1
                        continue
                remaining_docs.append(doc)
            
            logger.info(f"Removing {removed_count} chunks for '{source_name}', keeping {len(remaining_docs)}")
            
            if not remaining_docs:
                # All documents removed — clear the store entirely
                self.clear_database()
                logger.info("All chunks removed, vector store cleared")
                return
            
            # Rebuild vector store from remaining documents
            self.vector_store = FAISS.from_documents(remaining_docs, self.embeddings)
            self._save_vector_store()
            
            logger.info(f"Vector store rebuilt: {self.vector_store.index.ntotal} chunks remaining")
            gc.collect()
            
        except Exception as e:
            logger.error(f"Error deleting documents for '{source_name}': {str(e)}")
            raise
    
    def get_document_count(self) -> int:
        """Get total number of documents in vector store."""
        if self.vector_store is None:
            return 0
        
        try:
            # FAISS stores this in the index
            return self.vector_store.index.ntotal
        except:
            return 0
    
    def clear_database(self):
        """Clear entire vector database."""
        try:
            self.vector_store = None
            
            # Remove files
            index_file = self.vector_store_path / "index.faiss"
            pkl_file = self.vector_store_path / "index.pkl"
            
            if index_file.exists():
                index_file.unlink()
            if pkl_file.exists():
                pkl_file.unlink()
            
            logger.info("Vector database cleared")
        
        except Exception as e:
            logger.error(f"Error clearing database: {str(e)}")
            raise
    
    def clear_vector_store(self):
        """Alias for clear_database - clears entire vector store."""
        self.clear_database()
