"""
RAG Engine
Handles PDF document ingestion, chunking, embedding, and retrieval.
"""

import os
from pathlib import Path
from typing import List, Dict
import logging

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain.schema import Document

from db import VectorDBHandler
from llm_client import LLMClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGEngine:
    """RAG (Retrieval-Augmented Generation) engine for document Q&A."""
    
    def __init__(
        self, 
        docs_path: str = "./data/docs",
        vector_store_path: str = "./vector_store",
        hf_api_key: str = None
    ):
        """
        Initialize RAG engine.
        
        Args:
            docs_path: Path to store uploaded documents
            vector_store_path: Path to vector database
            hf_api_key: HuggingFace API key for embeddings
        """
        self.docs_path = Path(docs_path)
        self.docs_path.mkdir(parents=True, exist_ok=True)
        
        self.vector_db = VectorDBHandler(vector_store_path, hf_api_key=hf_api_key)
        self.llm_client = LLMClient()
        
        # Text splitter configuration
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def ingest_document(self, file_path: str, filename: str) -> Dict:
        """
        Process and index a PDF document.
        
        Args:
            file_path: Path to uploaded PDF file
            filename: Original filename
            
        Returns:
            Dict with status and metadata
        """
        try:
            logger.info(f"Ingesting document: {filename}")
            
            # Load PDF
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            
            if not pages:
                raise ValueError("PDF appears to be empty or unreadable")
            
            # Split into chunks
            chunks = self.text_splitter.split_documents(pages)
            
            # Add metadata
            for chunk in chunks:
                chunk.metadata.update({
                    'source': filename,
                    'doc_type': 'PDF'
                })
            
            # Add to vector database
            self.vector_db.add_documents(chunks)
            
            logger.info(f"Successfully indexed {len(chunks)} chunks from {filename}")
            
            return {
                "status": "success",
                "filename": filename,
                "chunks": len(chunks),
                "pages": len(pages)
            }
        
        except Exception as e:
            logger.error(f"Error ingesting document {filename}: {str(e)}")
            raise
    
    def query_documents(self, question: str, k: int = 4) -> Dict:
        """
        Query indexed documents and generate answer.
        
        Args:
            question: User's question
            k: Number of relevant chunks to retrieve
            
        Returns:
            Dict with answer, citations, and retrieved context
        """
        try:
            logger.info(f"Querying documents: {question}")
            
            # Check if vector store has documents
            doc_count = self.vector_db.get_document_count()
            if doc_count == 0:
                return {
                    "answer": "No documents have been uploaded yet. Please upload some documents first to enable Q&A.",
                    "citations": [],
                    "chunks_retrieved": 0
                }
            
            # Retrieve relevant chunks
            chunks, sources = self.vector_db.get_relevant_documents(question, k=k)
            
            if not chunks:
                return {
                    "answer": "I couldn't find relevant information in the uploaded documents to answer your question.",
                    "citations": [],
                    "chunks_retrieved": 0
                }
            
            # Generate answer using LLM
            result = self.llm_client.generate_rag_response(
                question=question,
                context_chunks=chunks,
                source_names=sources
            )
            
            result['chunks_retrieved'] = len(chunks)
            
            logger.info(f"Generated answer with {len(result['citations'])} citations")
            return result
        
        except Exception as e:
            logger.error(f"Error querying documents: {str(e)}")
            raise
    
    def list_documents(self) -> List[Dict]:
        """
        List all uploaded documents.
        
        Returns:
            List of document metadata
        """
        try:
            documents = []
            
            for file_path in self.docs_path.glob("*.pdf"):
                stat = file_path.stat()
                documents.append({
                    "filename": file_path.name,
                    "size": self._format_size(stat.st_size),
                    "upload_date": stat.st_mtime,
                    "path": str(file_path)
                })
            
            return documents
        
        except Exception as e:
            logger.error(f"Error listing documents: {str(e)}")
            return []
    
    def delete_document(self, filename: str) -> Dict:
        """
        Delete a document.
        
        Args:
            filename: Name of file to delete
            
        Returns:
            Status dict
        """
        try:
            file_path = self.docs_path / filename
            
            if not file_path.exists():
                raise FileNotFoundError(f"Document {filename} not found")
            
            # Delete file
            file_path.unlink()
            
            # Note: Vector DB deletion is complex with FAISS
            # For production, use a vector DB with native deletion support
            logger.warning(f"Deleted file {filename}, but vector store entries remain (FAISS limitation)")
            
            return {
                "status": "success",
                "message": f"Document {filename} deleted"
            }
        
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            raise
    
    def clear_all_documents(self):
        """Clear all documents and vector store - used by Dangerous Zone."""
        try:
            # Delete all PDFs
            for pdf_file in self.docs_path.glob("*.pdf"):
                pdf_file.unlink()
            
            # Clear vector store
            self.vector_db.clear_vector_store()
            
            logger.info("All documents and vector store cleared successfully")
        except Exception as e:
            logger.error(f"Error clearing all documents: {str(e)}")
            raise
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    def get_stats(self) -> Dict:
        """Get RAG system statistics."""
        return {
            "total_documents": len(list(self.docs_path.glob("*.pdf"))),
            "total_chunks": self.vector_db.get_document_count(),
            "vector_store_path": str(self.vector_db.vector_store_path)
        }
