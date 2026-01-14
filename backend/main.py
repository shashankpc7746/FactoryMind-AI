"""
FactoryMind AI - Main FastAPI Server
Internal Operations Intelligence Assistant Backend
"""

import os
import shutil
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(Path(__file__).parent.parent / '.env')

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from rag_engine import RAGEngine
from report_engine import ReportEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="FactoryMind AI API",
    description="Internal Operations Intelligence Assistant",
    version="1.0.0"
)

# CORS configuration - adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
rag_engine = RAGEngine(
    docs_path="./data/docs",
    vector_store_path="./vector_store"
)

report_engine = ReportEngine(
    data_path="./data/csv"
)

# Pydantic models
class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    citations: List[str]
    chunks_retrieved: int

class UploadResponse(BaseModel):
    status: str
    filename: str
    message: str
    details: Optional[dict] = None

class ReportResponse(BaseModel):
    id: str
    title: str
    date: str
    summary: str
    metrics: List[dict]
    observations: List[str]
    recommendations: List[str]


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "FactoryMind AI API",
        "status": "operational",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    try:
        stats = rag_engine.get_stats()
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "rag_stats": stats,
            "reports_count": len(report_engine.get_all_reports())
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )


# ============================================================================
# DOCUMENT UPLOAD & MANAGEMENT
# ============================================================================

@app.post("/upload/document", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and index a PDF document.
    
    Args:
        file: PDF file to upload
        
    Returns:
        Upload status and metadata
    """
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF files are supported"
            )
        
        # Save uploaded file
        file_path = Path(rag_engine.docs_path) / file.filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Saved document: {file.filename}")
        
        # Ingest and index document
        result = rag_engine.ingest_document(str(file_path), file.filename)
        
        return UploadResponse(
            status="success",
            filename=file.filename,
            message=f"Document uploaded and indexed successfully",
            details={
                "chunks": result['chunks'],
                "pages": result['pages']
            }
        )
    
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents")
async def list_documents():
    """
    List all uploaded documents.
    
    Returns:
        List of document metadata
    """
    try:
        documents = rag_engine.list_documents()
        return {
            "status": "success",
            "count": len(documents),
            "documents": documents
        }
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{filename}")
async def delete_document(filename: str):
    """
    Delete a document.
    
    Args:
        filename: Name of document to delete
        
    Returns:
        Deletion status
    """
    try:
        result = rag_engine.delete_document(filename)
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Document {filename} not found")
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# RAG QUERY
# ============================================================================

@app.post("/chat/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """
    Query indexed documents using RAG.
    
    Args:
        request: Query with question field
        
    Returns:
        Answer with citations
    """
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        logger.info(f"Processing query: {request.question}")
        
        result = rag_engine.query_documents(request.question)
        
        return QueryResponse(
            answer=result['answer'],
            citations=result['citations'],
            chunks_retrieved=result['chunks_retrieved']
        )
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DATA UPLOAD & REPORT GENERATION
# ============================================================================

@app.post("/upload/data", response_model=UploadResponse)
async def upload_data_file(file: UploadFile = File(...)):
    """
    Upload CSV or Excel data file (without generating report).
    
    Args:
        file: CSV or Excel file
        
    Returns:
        Upload status
    """
    try:
        # Validate file type
        if not (file.filename.endswith('.csv') or 
                file.filename.endswith('.xlsx') or 
                file.filename.endswith('.xls')):
            raise HTTPException(
                status_code=400,
                detail="Only CSV and Excel files are supported"
            )
        
        # Save uploaded file
        file_path = Path(report_engine.data_path) / file.filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Saved data file: {file.filename}")
        
        return UploadResponse(
            status="success",
            filename=file.filename,
            message="Data file uploaded successfully"
        )
    
    except Exception as e:
        logger.error(f"Error uploading data file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/report/generate", response_model=ReportResponse)
async def generate_report(file: UploadFile = File(...)):
    """
    Upload data file and generate operational report.
    
    Args:
        file: CSV or Excel file
        
    Returns:
        Generated report
    """
    try:
        # Validate file type
        if not (file.filename.endswith('.csv') or 
                file.filename.endswith('.xlsx') or 
                file.filename.endswith('.xls')):
            raise HTTPException(
                status_code=400,
                detail="Only CSV and Excel files are supported"
            )
        
        # Save uploaded file
        file_path = Path(report_engine.data_path) / file.filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Generating report for: {file.filename}")
        
        # Generate report
        report = report_engine.generate_report(str(file_path), file.filename)
        
        return ReportResponse(**report)
    
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports")
async def list_reports():
    """
    Get all generated reports.
    
    Returns:
        List of report summaries
    """
    try:
        reports = report_engine.get_all_reports()
        return {
            "status": "success",
            "count": len(reports),
            "reports": reports
        }
    except Exception as e:
        logger.error(f"Error listing reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/{report_id}")
async def get_report(report_id: str):
    """
    Get specific report by ID.
    
    Args:
        report_id: Report identifier
        
    Returns:
        Full report details
    """
    try:
        report = report_engine.get_report_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/{report_id}/download")
async def download_report_pdf(report_id: str):
    """
    Download report as PDF.
    
    Args:
        report_id: Report identifier
        
    Returns:
        PDF file
    """
    try:
        # Generate PDF
        pdf_path = report_engine.export_report_to_pdf(
            report_id=report_id,
            output_path="./data/csv"
        )
        
        if not Path(pdf_path).exists():
            raise HTTPException(status_code=500, detail="Failed to generate PDF")
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"report_{report_id}.pdf"
        )
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error downloading report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HISTORY
# ============================================================================

@app.get("/history")
async def get_history():
    """
    Get chat history and reports.
    
    Returns:
        Combined history of chats and reports
    """
    try:
        documents = rag_engine.list_documents()
        reports = report_engine.get_all_reports()
        
        return {
            "status": "success",
            "documents": {
                "count": len(documents),
                "items": documents
            },
            "reports": {
                "count": len(reports),
                "items": reports
            }
        }
    except Exception as e:
        logger.error(f"Error retrieving history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Ensure directories exist
    Path("./data/docs").mkdir(parents=True, exist_ok=True)
    Path("./data/csv").mkdir(parents=True, exist_ok=True)
    Path("./vector_store").mkdir(parents=True, exist_ok=True)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
