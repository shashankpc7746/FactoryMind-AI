# FactoryMind AI — Internal Operations Intelligence Assistant

A full-stack AI-powered web application for internal operations management, featuring RAG-based document Q&A and automated report generation from operational data.

![FactoryMind AI](https://img.shields.io/badge/AI-Powered-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green) ![React](https://img.shields.io/badge/React-Frontend-cyan)

---

## 🎯 Features

### **1. RAG-Based Knowledge Assistant**

- Upload internal documents (PDFs: SOPs, manuals, policies)
- Intelligent document chunking and embedding
- Vector database storage using FAISS
- Natural language Q&A with citations
- Context-aware responses powered by LLM

### **2. Automated Operations Report Generator**

- Upload CSV/Excel operational data
- Automatic data analysis and statistics
- Anomaly detection using IQR method
- AI-generated professional reports with:
  - Executive summary
  - Key metrics and trends
  - Data-driven observations
  - Actionable recommendations
- PDF export functionality

---

## 🏗️ Architecture

```
FactoryMind-AI/
│
├── frontend/                     # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/           # UI components
│   │   │   ├── ChatAssistant.tsx # RAG Q&A interface
│   │   │   ├── DocumentManager.tsx # Document management
│   │   │   ├── ReportGenerator.tsx # Report generation
│   │   │   └── ui/               # Reusable UI components
│   │   ├── services/
│   │   │   └── api.ts            # Backend API client
│   │   └── ...
│   └── package.json
│
├── backend/                      # Python + FastAPI
│   ├── main.py                   # FastAPI server & endpoints
│   ├── rag_engine.py             # PDF processing & RAG
│   ├── report_engine.py          # Data analytics & reports
│   ├── llm_client.py             # OpenAI API wrapper
│   └── db.py                     # FAISS vector database
│
├── data/                         # Data storage
│   ├── docs/                     # Uploaded PDFs
│   └── csv/                      # Uploaded data files
│
├── vector_store/                 # FAISS embeddings
│
├── requirements.txt              # Python dependencies
├── .env.example                  # Backend config template
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+**
- **Node.js 16+**
- **OpenAI API Key** (or compatible LLM API)

### 1. Clone Repository

```bash
cd "C:\Users\Shashank Gupta\Vs-code\Factory Mind AI"
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment

```bash
# Copy environment template
copy .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_openai_api_key_here
```

#### Run Backend Server

```bash
cd backend
python main.py
```

Server will start at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

#### Install Dependencies

```bash
npm install
```

#### Configure Frontend Environment

```bash
# Copy environment template
copy .env.local.example .env.local

# Edit .env.local if backend URL differs
# VITE_API_URL=http://localhost:8000
```

#### Run Frontend

```bash
npm run dev
```

Frontend will start at: `http://localhost:5173`

---

## 📡 API Endpoints

### Document Management

- `POST /upload/document` - Upload and index PDF document
- `GET /documents` - List all uploaded documents
- `DELETE /documents/{filename}` - Delete a document

### RAG Query

- `POST /chat/query` - Query documents with natural language
  ```json
  {
    "question": "What are the safety procedures?"
  }
  ```

### Report Generation

- `POST /upload/data` - Upload CSV/Excel file (without generating report)
- `POST /report/generate` - Upload data file and generate report
- `GET /reports` - List all generated reports
- `GET /reports/{report_id}` - Get specific report
- `GET /reports/{report_id}/download` - Download report as PDF

### System

- `GET /` - Health check
- `GET /health` - Detailed system status
- `GET /history` - Get documents and reports history

---

## 💡 Usage Guide

### Uploading Documents

1. Navigate to **Document Manager**
2. Drag & drop PDF files or click "Select Files"
3. Wait for indexing to complete
4. Documents are now searchable via Chat Assistant

### Asking Questions

1. Go to **Chat Assistant**
2. Type your question about uploaded documents
3. Receive AI-generated answers with source citations
4. Click on citations to see source documents

### Generating Reports

1. Navigate to **Report Generator**
2. Upload CSV or Excel file with operational data
3. AI automatically:
   - Analyzes data statistics
   - Detects anomalies
   - Generates insights
   - Creates structured report
4. View full report or download as PDF

---

## 🔧 Configuration

### Backend Configuration (.env)

```env
# OpenAI API
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo

# Server
HOST=0.0.0.0
PORT=8000

# Data Paths
DOCS_PATH=./data/docs
CSV_PATH=./data/csv
VECTOR_STORE_PATH=./vector_store

# CORS
ALLOWED_ORIGINS=*  # Adjust for production

# RAG Settings
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=4
```

### Frontend Configuration (.env.local)

```env
VITE_API_URL=http://localhost:8000
```

---

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Lucide React** - Icons

### Backend

- **FastAPI** - Web framework
- **Python 3.9+** - Programming language
- **LangChain** - RAG orchestration
- **OpenAI API** - LLM integration
- **FAISS** - Vector database
- **Pandas** - Data analysis
- **PyPDF** - PDF processing
- **ReportLab** - PDF generation

---

## 📊 Data Flow

### RAG Query Flow

```
User Question → FastAPI → RAG Engine → Vector DB (FAISS)
                                     ↓
                            Retrieve Relevant Chunks
                                     ↓
                            LLM (OpenAI) ← Context + Question
                                     ↓
                            Answer + Citations → User
```

### Report Generation Flow

```
CSV/Excel Upload → FastAPI → Report Engine → Pandas Analysis
                                           ↓
                                   Statistics + Anomalies
                                           ↓
                                   LLM (OpenAI) → Structured Report
                                           ↓
                                   PDF Export (Optional) → User
```

---

## 🚧 Development

### Running in Development Mode

**Backend:**

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**

```bash
npm run dev
```

### Building for Production

**Frontend:**

```bash
npm run build
npm run preview  # Preview production build
```

**Backend:**

```bash
# Use a production ASGI server
pip install gunicorn
gunicorn backend.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "No OpenAI API key found"**

- Ensure `.env` file exists in project root
- Verify `OPENAI_API_KEY` is set correctly
- Check environment is activated

**Error: "Module not found"**

```bash
pip install -r requirements.txt --upgrade
```

**FAISS Issues on Windows:**

```bash
pip install faiss-cpu --no-cache
```

### Frontend Issues

**API Connection Errors:**

- Verify backend is running on `http://localhost:8000`
- Check `.env.local` has correct `VITE_API_URL`
- Ensure CORS is configured correctly in backend

**Build Errors:**

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔒 Security Considerations

### For Production Deployment:

1. **API Keys:** Never commit `.env` files
2. **CORS:** Restrict `ALLOWED_ORIGINS` to specific domains
3. **Authentication:** Add user authentication/authorization
4. **HTTPS:** Use SSL/TLS certificates
5. **Rate Limiting:** Implement API rate limits
6. **Input Validation:** Enhance file upload validation
7. **Data Privacy:** Ensure compliance with data regulations

---

## 📈 Performance Tips

1. **Vector Database:** For large document sets, consider Pinecone or Weaviate
2. **Caching:** Implement Redis for query caching
3. **Async Processing:** Use Celery for background tasks
4. **Batch Processing:** Process multiple documents in parallel
5. **CDN:** Serve frontend static files via CDN

---

## 🤝 Contributing

This is a production-style demo project. To extend:

1. Add user authentication
2. Implement multi-tenancy
3. Add more data formats (Word, PowerPoint, etc.)
4. Enhance analytics with visualization
5. Add real-time collaboration features

---

## 📝 License

This project is for demonstration purposes.

---

## 🙋 Support

For issues or questions:

1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Examine server logs for errors

---

## 🎉 Acknowledgments

Built with:

- OpenAI GPT Models
- LangChain Framework
- FastAPI Framework
- React Ecosystem

---

**Happy Manufacturing! 🏭✨**
