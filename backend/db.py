"""
Vector Database Handler
Manages FAISS vector store operations for document embeddings.
"""

import os
import pickle
from typing import List, Dict, Tuple
from pathlib import Path
import logging
import time
import numpy as np

from langchain_community.vectorstores import FAISS
from langchain.schema import Document
from langchain_community.embeddings import HuggingFaceEmbeddings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
        Delete documents from a specific source.
        Note: FAISS doesn't support deletion natively, so this requires rebuilding.
        
        Args:
            source_name: Name of source file to remove
        """
        if self.vector_store is None:
            return
        
        try:
            # Get all documents
            # Note: This is a workaround since FAISS doesn't support direct deletion
            # In production, consider using a vector DB with native deletion support
            logger.warning("Document deletion requires vector store rebuild (FAISS limitation)")
            # For now, we'll keep the implementation simple
            # A full implementation would require:
            # 1. Extract all docs from vector store
            # 2. Filter out docs with matching source
            # 3. Rebuild vector store
            
        except Exception as e:
            logger.error(f"Error deleting documents: {str(e)}")
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
