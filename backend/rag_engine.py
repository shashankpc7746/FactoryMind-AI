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
    
    # Casual greetings that shouldn't hit the RAG pipeline
    _GREETING_PATTERNS = {
        'hi', 'hello', 'hey', 'hii', 'hiii', 'yo', 'sup',
        'good morning', 'good afternoon', 'good evening',
        'thanks', 'thank you', 'ok', 'okay', 'bye', 'goodbye',
    }

    # Keywords that signal a meta-question about the system/documents themselves
    _META_KEYWORDS = [
        'how many document', 'how many files', 'how many pdf',
        'list of document', 'list all document', 'which document',
        'what document', 'what files', 'documents did i',
        'files did i', 'documents have i', 'documents i uploaded',
        'shared with you', 'uploaded so far',
    ]

    def _is_greeting(self, text: str) -> bool:
        """Check if the text is a casual greeting or social message."""
        cleaned = text.strip().lower().rstrip('!?.,:;')
        return cleaned in self._GREETING_PATTERNS

    def _is_meta_question(self, text: str) -> bool:
        """Check if the question is about the system state (document count, etc.)."""
        lower = text.lower()
        return any(kw in lower for kw in self._META_KEYWORDS)

    def _handle_meta_question(self, question: str) -> Dict:
        """Answer questions about document inventory from system state."""
        docs = self.list_documents()
        doc_names = [d['filename'] for d in docs]
        count = len(doc_names)

        if count == 0:
            answer = "No documents have been uploaded yet. Please upload some documents first."
        elif count == 1:
            answer = f"You have uploaded **1 document**: {doc_names[0]}"
        else:
            doc_list = "\n".join(f"- {name}" for name in doc_names)
            answer = f"You have uploaded **{count} documents**:\n{doc_list}"

        return {
            "answer": answer,
            "citations": doc_names,
            "chunks_retrieved": 0
        }

    def query_documents(self, question: str, k: int = 6, history: list = None) -> Dict:
        """
        Query indexed documents and generate answer.
        
        Args:
            question: User's question
            k: Number of relevant chunks to retrieve (default 6 for multi-doc coverage)
            history: Optional list of prior conversation turns [{"role": ..., "content": ...}]
            
        Returns:
            Dict with answer, citations, and retrieved context
        """
        try:
            logger.info(f"Querying documents: {question}")

            # --- Smart routing: greetings ---
            if self._is_greeting(question):
                doc_count = len(self.list_documents())
                if doc_count > 0:
                    return {
                        "answer": f"Hey there! 👋 I have **{doc_count} document{'s' if doc_count != 1 else ''}** loaded. Feel free to ask me anything about them!",
                        "citations": [],
                        "chunks_retrieved": 0
                    }
                return {
                    "answer": "Hey there! 👋 I'm ready to help. Upload a PDF document and I can answer questions about it.",
                    "citations": [],
                    "chunks_retrieved": 0
                }

            # --- Smart routing: meta-questions about documents ---
            if self._is_meta_question(question):
                return self._handle_meta_question(question)

            # Check if vector store has documents
            doc_count = self.vector_db.get_document_count()
            if doc_count == 0:
                return {
                    "answer": "No documents have been uploaded yet. Please upload some documents first to enable Q&A.",
                    "citations": [],
                    "chunks_retrieved": 0
                }
            
            # Contextualize vague follow-up questions using conversation history
            search_query = question
            if history and len(history) >= 2:
                search_query = self._contextualize_query(question, history)
                if search_query != question:
                    logger.info(f"Contextualized query: '{question}' -> '{search_query}'")
            
            # Retrieve relevant chunks using the contextualized query
            chunks, sources = self.vector_db.get_relevant_documents(search_query, k=k)
            
            if not chunks:
                return {
                    "answer": "I couldn't find relevant information in the uploaded documents to answer your question.",
                    "citations": [],
                    "chunks_retrieved": 0
                }
            
            # Build document inventory so the LLM knows about ALL uploaded docs
            all_docs = [d['filename'] for d in self.list_documents()]

            # Generate answer using LLM (pass original question + history for natural response)
            result = self.llm_client.generate_rag_response(
                question=question,
                context_chunks=chunks,
                source_names=sources,
                history=history,
                all_documents=all_docs
            )
            
            result['chunks_retrieved'] = len(chunks)
            
            logger.info(f"Generated answer with {len(result['citations'])} citations")
            return result
        
        except Exception as e:
            logger.error(f"Error querying documents: {str(e)}")
            raise
    
    def _contextualize_query(self, question: str, history: list) -> str:
        """
        Rewrite a vague follow-up question into a standalone search query
        using recent conversation history.
        
        Examples:
            "but which model?" + context about speech → "Which speech model is used by SwarAI?"
            "tell me more" + context about CrewAI → "Tell me more about how CrewAI is used in SwarAI"
        """
        try:
            # Take last 4 turns max to keep the prompt small
            recent = history[-4:]
            history_text = "\n".join(
                f"{'User' if t['role'] == 'user' else 'Assistant'}: {t['content'][:200]}"
                for t in recent
            )
            
            rewrite_prompt = (
                "Given the conversation history below, rewrite the latest user question "
                "into a fully self-contained search query. Do NOT answer the question — "
                "just rewrite it so it makes sense without the conversation history.\n\n"
                f"Conversation:\n{history_text}\n\n"
                f"Latest question: {question}\n\n"
                "Rewritten standalone query:"
            )
            
            rewritten = self.llm_client.generate_response(
                prompt=rewrite_prompt,
                system_message="You are a query rewriter. Output only the rewritten query, nothing else.",
                temperature=0.0,
                max_tokens=100
            ).strip().strip('"').strip("'")
            
            # Sanity check — if the LLM returned garbage, use original
            if len(rewritten) < 3 or len(rewritten) > 300:
                return question
            
            return rewritten
            
        except Exception as e:
            logger.warning(f"Query contextualization failed, using original: {e}")
            return question
    
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
        Delete a document and its chunks from the vector store.
        
        Args:
            filename: Name of file to delete
            
        Returns:
            Status dict
        """
        try:
            file_path = self.docs_path / filename
            
            if not file_path.exists():
                raise FileNotFoundError(f"Document {filename} not found")
            
            # Delete file from disk
            file_path.unlink()
            
            # Remove chunks from the vector store (rebuilds FAISS index)
            self.vector_db.delete_by_source(filename)
            
            logger.info(f"Deleted document {filename} and its vector store entries")
            
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
