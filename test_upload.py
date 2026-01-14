#!/usr/bin/env python
"""Test document upload endpoint"""

import requests
import time
from pathlib import Path

# Wait for server to be ready
print("Waiting for server to be ready...")
time.sleep(2)

# Create a simple test PDF (using reportlab)
print("\nCreating test PDF...")
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    
    pdf_path = Path("test_document.pdf")
    c = canvas.Canvas(str(pdf_path), pagesize=letter)
    c.drawString(100, 750, "Test Document for Upload")
    c.drawString(100, 730, "This is a test PDF file")
    c.drawString(100, 710, "For testing the document upload feature")
    c.save()
    print(f"Created test PDF: {pdf_path}")
except ImportError:
    print("reportlab not available, using dummy file")
    pdf_path = Path("test_document.pdf")
    pdf_path.write_text("This is a fake PDF content for testing")

# Upload the document
print("\nUploading document...")
try:
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        response = requests.post("http://localhost:8000/upload/document", files=files)
    
    print(f"Upload response status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    if response.status_code == 200:
        print("\n✓ Upload successful!")
    else:
        print("\n✗ Upload failed!")
        
except Exception as e:
    print(f"\nError during upload: {e}")
    import traceback
    traceback.print_exc()

# Get list of documents
print("\nFetching document list...")
try:
    response = requests.get("http://localhost:8000/documents")
    print(f"Status: {response.status_code}")
    docs = response.json()
    print(f"Documents: {docs}")
except Exception as e:
    print(f"Error: {e}")

# Cleanup
if pdf_path.exists():
    pdf_path.unlink()
    print(f"\nCleaned up {pdf_path}")
