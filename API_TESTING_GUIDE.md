# API Testing Guide for FactoryMind AI

This guide shows how to test the backend API using various tools.

## Prerequisites

- Backend server running on `http://localhost:8000`
- Sample files for testing (provided in project root)

---

## Testing with Browser

### Health Check

Simply open in browser:

```
http://localhost:8000/
http://localhost:8000/health
```

### Interactive API Documentation

```
http://localhost:8000/docs
```

This provides a full interactive UI to test all endpoints!

---

## Testing with PowerShell

### 1. Health Check

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET | Select-Object -Expand Content | ConvertFrom-Json
```

### 2. Upload Document (PDF)

```powershell
$filePath = "path\to\your\document.pdf"
$uri = "http://localhost:8000/upload/document"

$form = @{
    file = Get-Item -Path $filePath
}

Invoke-WebRequest -Uri $uri -Method POST -Form $form
```

### 3. Query Documents

```powershell
$body = @{
    question = "What are the safety procedures?"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "http://localhost:8000/chat/query" -Method POST -Body $body -Headers $headers | Select-Object -Expand Content | ConvertFrom-Json
```

### 4. List Documents

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/documents" -Method GET | Select-Object -Expand Content | ConvertFrom-Json
```

### 5. Generate Report

```powershell
$filePath = "sample_production_data.csv"
$uri = "http://localhost:8000/report/generate"

$form = @{
    file = Get-Item -Path $filePath
}

$response = Invoke-WebRequest -Uri $uri -Method POST -Form $form
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### 6. List Reports

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/reports" -Method GET | Select-Object -Expand Content | ConvertFrom-Json
```

### 7. Download Report PDF

```powershell
$reportId = "20260114_123456"  # Replace with actual report ID
$outputPath = "downloaded_report.pdf"

Invoke-WebRequest -Uri "http://localhost:8000/reports/$reportId/download" -Method GET -OutFile $outputPath
Write-Host "Report downloaded to $outputPath"
```

---

## Testing with cURL (if installed)

### 1. Health Check

```bash
curl http://localhost:8000/health
```

### 2. Upload Document

```bash
curl -X POST "http://localhost:8000/upload/document" \
  -F "file=@sample_document.pdf"
```

### 3. Query Documents

```bash
curl -X POST "http://localhost:8000/chat/query" \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"What are the safety procedures?\"}"
```

### 4. Generate Report

```bash
curl -X POST "http://localhost:8000/report/generate" \
  -F "file=@sample_production_data.csv"
```

### 5. List Reports

```bash
curl http://localhost:8000/reports
```

---

## Expected Response Examples

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-01-14T10:30:00",
  "rag_stats": {
    "total_documents": 3,
    "total_chunks": 145,
    "vector_store_path": "./vector_store"
  },
  "reports_count": 2
}
```

### Query Response

```json
{
  "answer": "Based on the safety manual, the key procedures are...",
  "citations": ["Safety_Manual_2026.pdf", "SOP-Safety-001.pdf"],
  "chunks_retrieved": 4
}
```

### Report Generation Response

```json
{
  "id": "20260114_103045",
  "title": "Operations Report - sample_production_data",
  "date": "2026-01-14T10:30:45",
  "summary": "Analysis reveals strong production performance...",
  "metrics": [
    {
      "label": "Total Records",
      "value": "20",
      "trend": "up"
    }
  ],
  "observations": [
    "Morning shifts show 5% higher efficiency",
    "Quality metrics exceed 97% consistently"
  ],
  "recommendations": [
    "Investigate downtime patterns",
    "Optimize evening shift scheduling"
  ]
}
```

---

## Testing Scenarios

### Scenario 1: Complete RAG Workflow

```powershell
# 1. Upload a document
$form = @{ file = Get-Item "company_policy.pdf" }
Invoke-WebRequest -Uri "http://localhost:8000/upload/document" -Method POST -Form $form

# 2. Wait a moment for indexing
Start-Sleep -Seconds 2

# 3. Ask a question
$body = @{ question = "What is the vacation policy?" } | ConvertTo-Json
$headers = @{ "Content-Type" = "application/json" }
Invoke-WebRequest -Uri "http://localhost:8000/chat/query" -Method POST -Body $body -Headers $headers
```

### Scenario 2: Report Generation Workflow

```powershell
# 1. Upload data file and generate report
$form = @{ file = Get-Item "sample_production_data.csv" }
$response = Invoke-WebRequest -Uri "http://localhost:8000/report/generate" -Method POST -Form $form
$report = $response.Content | ConvertFrom-Json

# 2. Download the report as PDF
$reportId = $report.id
Invoke-WebRequest -Uri "http://localhost:8000/reports/$reportId/download" -Method GET -OutFile "report.pdf"
```

---

## Error Handling Examples

### Missing API Key Error

```json
{
  "detail": "OpenAI client not initialized. Please set OPENAI_API_KEY."
}
```

**Solution:** Add OPENAI_API_KEY to .env file

### Invalid File Type Error

```json
{
  "detail": "Only PDF files are supported"
}
```

**Solution:** Upload a PDF file for document upload

### Document Not Found Error

```json
{
  "detail": "Document safety_manual.pdf not found"
}
```

**Solution:** Check filename and try listing documents first

---

## Performance Testing

### Measure Response Time

```powershell
$startTime = Get-Date

$body = @{ question = "What are quality standards?" } | ConvertTo-Json
$headers = @{ "Content-Type" = "application/json" }
Invoke-WebRequest -Uri "http://localhost:8000/chat/query" -Method POST -Body $body -Headers $headers

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "Query took $duration seconds"
```

---

## Monitoring & Debugging

### Check Server Logs

The backend server outputs detailed logs. Watch for:

- `INFO` - Normal operations
- `WARNING` - Non-critical issues
- `ERROR` - Problems that need attention

### Common Log Messages

```
INFO: Ingesting document: company_policy.pdf
INFO: Successfully indexed 45 chunks from company_policy.pdf
INFO: Querying documents: What is the vacation policy?
INFO: Generated answer with 2 citations
INFO: Report generated successfully: 20260114_103045
```

---

## Best Practices

1. **Always check health endpoint first** to ensure backend is running
2. **Start with small files** for initial testing
3. **Review API docs** at /docs for parameter details
4. **Check response status codes**:
   - 200: Success
   - 400: Bad request (check your input)
   - 404: Not found
   - 500: Server error (check logs)
5. **Use interactive docs** at /docs for quick testing

---

## Automation Example

Create a test script `test-api.ps1`:

```powershell
# Test all main endpoints

Write-Host "Testing FactoryMind AI API..." -ForegroundColor Cyan

# 1. Health check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8000/health" | ConvertFrom-Json
    Write-Host "✅ Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not responding" -ForegroundColor Red
    exit 1
}

# 2. Upload test document
Write-Host "`n2. Testing document upload..." -ForegroundColor Yellow
# Add your test here

# 3. Query test
Write-Host "`n3. Testing RAG query..." -ForegroundColor Yellow
# Add your test here

# 4. Report generation test
Write-Host "`n4. Testing report generation..." -ForegroundColor Yellow
# Add your test here

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

---

## Need Help?

- Review backend logs for detailed error messages
- Check the interactive API docs at `/docs`
- Verify your `.env` configuration
- Ensure all dependencies are installed

---

Happy Testing! 🧪✨
