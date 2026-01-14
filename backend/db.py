"""
Vector Database Handler
Manages FAISS vector store operations for document embeddings.
"""

import os
import pickle
from typing import List, Dict, Tuple
from pathlib import Path
import logging

from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VectorDBHandler:
    """Handles FAISS vector database operations."""
    
    def __init__(self, vector_store_path: str = "./vector_store"):
        """
        Initialize vector database handler.
        
        Args:
            vector_store_path: Path to store FAISS index
        """
        self.vector_store_path = Path(vector_store_path)
        self.vector_store_path.mkdir(parents=True, exist_ok=True)
        
        self.embeddings = OpenAIEmbeddings()
        self.vector_store = None
        self.metadata_file = self.vector_store_path / "metadata.pkl"
        
        # Try to load existing vector store
        self._load_vector_store()
    
    def _load_vector_store(self):
        """Load existing FAISS vector store if available."""
        index_path = self.vector_store_path / "index.faiss"
        
        if index_path.exists():
            try:
                self.vector_store = FAISS.load_local(
                    str(self.vector_store_path),
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info("Loaded existing vector store")
            except Exception as e:
                logger.warning(f"Could not load existing vector store: {e}")
                self.vector_store = None
    
    def add_documents(self, documents: List[Document]):
        """
        Add documents to vector store.
        
        Args:
            documents: List of LangChain Document objects with page_content and metadata
        """
        try:
            if self.vector_store is None:
                # Create new vector store
                self.vector_store = FAISS.from_documents(documents, self.embeddings)
                logger.info(f"Created new vector store with {len(documents)} documents")
            else:
                # Add to existing vector store
                self.vector_store.add_documents(documents)
                logger.info(f"Added {len(documents)} documents to existing vector store")
            
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
