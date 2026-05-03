# 🏭 FactoryMind AI v1.0 - Intelligent Operations Assistant

> **Transform your internal operations with AI-powered document intelligence and automated data analytics.**

FactoryMind AI is a comprehensive full-stack application that helps organizations manage their internal documentation and generate insightful reports from operational data. Built with cutting-edge AI technology, it combines RAG (Retrieval-Augmented Generation) for intelligent document Q&A with conversation memory, and automated report generation from CSV/Excel data.

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi) ![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

---

## ✨ Key Features

### 🤖 RAG-Based Knowledge Assistant

- **Smart Document Processing** - Upload SOPs, manuals, policies, and other PDFs
- **Intelligent Search** - Ask questions in natural language and get precise answers
- **Conversation Memory** - Follow-up questions understood in context ("but which model?")
- **Smart Query Routing** - Greetings, meta-questions, and document queries handled intelligently
- **Source Citations** - Every answer includes references to source documents
- **Vector Database** - Fast and efficient document retrieval using FAISS
- **Proper Document Deletion** - Deleting a doc removes it from both disk and vector index
- **Multi-Document Awareness** - Cross-document questions answered correctly

### 📊 Automated Report Generator

- **Data Analysis** - Upload CSV/Excel files for instant insights
- **AI-Powered Insights** - Automatically generates executive summaries
- **Visual Analytics** - Interactive charts: bar distributions, line trends, pie breakdowns, and correlation heatmaps
- **Anomaly Detection** - Identifies outliers and patterns using statistical methods
- **Professional Reports** - Export beautifully formatted PDF reports
- **Key Metrics Dashboard** - Visual representation of trends and KPIs
- **Actionable Recommendations** - Get data-driven suggestions for improvement

### 🎨 Modern User Interface

- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Themes** - Choose your preferred viewing mode
- **Intuitive Navigation** - Clean sidebar with easy access to all features
- **Real-time Indexing Status** - Live progress tracking from upload → indexed → ready
- **Chat Session Persistence** - Chat history survives page refreshes
- **Markdown Rendering** - LLM responses display with proper bold, bullets, and formatting
- **File Management** - Drag-and-drop interface for document uploads

---

## 🎯 Who Is This For?

- **Operations Managers** - Quick access to SOPs and operational procedures
- **Quality Assurance Teams** - Instant reference to quality control documents
- **Data Analysts** - Automated report generation from production data
- **Safety Officers** - Fast retrieval of safety guidelines and protocols
- **Management Teams** - Executive summaries and data-driven insights

---

## 🏗️ Technology Stack

### Backend

- **FastAPI** - High-performance Python web framework
- **LangChain** - For RAG pipeline and document processing
- **FAISS** - Facebook's vector database for similarity search
- **ONNX Runtime** - Lightweight embeddings inference (~50MB RAM vs ~250MB with PyTorch)
- **HuggingFace** - Model hosting and tokenizers
- **Groq API** - Lightning-fast LLM inference
- **Pandas & NumPy** - Data analysis and manipulation
- **ReportLab** - PDF report generation

### Frontend

- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Beautiful, accessible components
- **Lucide React** - Consistent icon library

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

- ✅ **Python 3.10 or higher** - [Download Python](https://www.python.org/downloads/)
- ✅ **Node.js 18 or higher** - [Download Node.js](https://nodejs.org/)
- ✅ **Git** - [Download Git](https://git-scm.com/downloads)
- ✅ **Groq API Key** - [Get free API key](https://console.groq.com/)
- ✅ **HuggingFace API Key** - [Get free API key](https://huggingface.co/settings/tokens)

### 📥 Step 1: Clone the Repository

First, let's get the code onto your machine:

```bash
# Clone the repository
git clone https://github.com/shashankpc7746/FactoryMind-AI.git

# Navigate into the project directory
cd FactoryMind-AI
```

### 🐍 Step 2: Backend Setup

#### Create Virtual Environment

It's a best practice to use a virtual environment to keep your dependencies isolated:

```bash
# Create a virtual environment named 'fact-ai'
python -m venv fact-ai

# Activate the virtual environment
# On Windows:
fact-ai\Scripts\activate

# On macOS/Linux:
source fact-ai/bin/activate
```

You should see `(fact-ai)` appear in your terminal prompt, indicating the virtual environment is active.

#### Install Backend Dependencies

```bash
# Navigate to the project root and install
pip install -r backend/requirements.txt
```

This will install FastAPI, LangChain, FAISS, ONNX Runtime, and all other dependencies. It may take 2-3 minutes.

> **Note:** The project uses ONNX Runtime instead of PyTorch for text embeddings. This keeps the memory footprint under 300MB — critical for free-tier hosting (512MB RAM).

#### Configure Environment Variables

```bash
# Copy the example environment file
copy .env.example .env

# On macOS/Linux:
cp .env.example .env
```

Now open the `.env` file in your favorite text editor and add your API keys:

```env
# Required API Keys
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Optional: Configure CORS (add your frontend URL)
ALLOWED_ORIGINS=http://localhost:5173

# Optional: Customize upload limits
MAX_FILE_SIZE=10485760  # 10MB default
```

💡 **Pro Tip:** Never commit your `.env` file to version control. It's already in `.gitignore`.

#### Start the Backend Server

```bash
# Navigate to the backend directory
cd backend

# Start the FastAPI server
python main.py
```

You should see output like:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

✅ **Backend is now running at:** `http://localhost:8000`

📖 **API Documentation available at:** `http://localhost:8000/docs`

### 🎨 Step 3: Frontend Setup

Open a **new terminal window** (keep the backend running in the first one).

#### Install Frontend Dependencies

```bash
# Make sure you're in the project root directory
npm install
```

This will install React, TypeScript, Vite, Tailwind CSS, and all UI components. Takes about 1-2 minutes.

#### Configure Frontend Environment (Optional)

By default, the frontend connects to `http://localhost:8000`. If your backend runs on a different URL, create a `.env.local` file:

```env
VITE_API_URL=http://localhost:8000
```

#### Start the Development Server

```bash
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Frontend is now running at:** `http://localhost:5173`

### 🎉 Step 4: Explore the Application!

Open your browser and navigate to `http://localhost:5173`. You'll see the FactoryMind AI dashboard!

**Try these quick tests:**

1. **Upload a Document** 📄

   - Go to "Document Manager"
   - Upload a PDF (manual, SOP, policy document)
   - Wait for "Document indexed successfully"

2. **Ask a Question** 💬

   - Go to "Chat Assistant"
   - Type: "What are the safety procedures?"
   - Get AI-powered answers with source citations

3. **Generate a Report** 📊
   - Go to "Report Generator"
   - Upload a CSV file with operational data
   - Watch AI analyze and generate insights
   - Download the professional PDF report

---

## 📚 Usage Guide

### Document Management

#### Uploading Documents

1. Click on **"Document Manager"** in the sidebar
2. Drag and drop PDF files, or click **"Select Files"**
3. Supported formats: PDF (up to 10MB by default)
4. Wait for the upload and indexing process to complete
5. Your documents are now searchable!

#### Managing Documents

- **View All Documents** - See a list of uploaded files with metadata
- **Delete Documents** - Remove documents you no longer need
- **File Information** - Check file size, upload date, and status

### Chat Assistant

#### Asking Questions

1. Navigate to **"Chat Assistant"**
2. Type your question in the input box
3. Press **Enter** to send (or click the send button)
4. View AI-generated answers with citations
5. Click on citations to see which documents were referenced

#### Quick Actions

Use suggested prompts for common queries:

- "Ask about procedures"
- "Generate report"
- "Analyze data"

#### Uploading Files for Context

Click the **paperclip icon** to attach PDFs or CSVs directly in the chat for immediate analysis.

### Report Generation

#### Creating Reports

1. Go to **"Report Generator"**
2. Click **"Upload Data File"**
3. Select a CSV or Excel file with your operational data
4. Wait for AI to analyze the data
5. Review the generated report with:
   - Executive summary
   - Key metrics and trends
   - **Interactive visual charts** (bar, line, pie, correlation heatmap)
   - Statistical observations
   - Data-driven recommendations

#### Downloading Reports

- Click **"Download PDF"** to save the report
- Reports are professionally formatted and ready to share
- All reports are saved in your history

#### Report History

- View up to 10 recent reports
- Delete old reports you no longer need
- Re-download reports anytime

---

## 🧪 Sample Data for Testing

### Sample CSV Structure

Create a file named `sample_production_data.csv` to test the report generator:

```csv
Date,Shift,Production_Units,Downtime_Hours,Quality_Pass_Rate,Defects
2026-01-01,Morning,1234,0.5,98.5,18
2026-01-01,Evening,1180,1.2,97.8,26
2026-01-02,Morning,1290,0.3,99.1,11
2026-01-02,Evening,1205,0.8,98.2,21
2026-01-03,Morning,1250,0.6,98.7,16
2026-01-03,Evening,1190,1.5,97.5,29
2026-01-04,Morning,1275,0.4,99.2,10
2026-01-04,Evening,1195,1.1,97.9,25
```

This will generate a report analyzing production trends, quality metrics, and downtime patterns!

---

## 🔌 API Documentation

### Interactive API Docs

Once your backend is running, explore the full API documentation:

- **Swagger UI:** `http://localhost:8000/docs` - Interactive testing interface
- **ReDoc:** `http://localhost:8000/redoc` - Clean, searchable documentation

### Core Endpoints

#### Health Check

```http
GET /health
```

Returns system status, document count, and report statistics.

#### Document Management

```http
POST /upload/document              # Upload and index a PDF (background processing)
GET  /indexing-status/{filename}   # Poll indexing progress
GET  /documents                    # List all documents
DELETE /documents/{filename}       # Delete document + its vector chunks
```

#### RAG Query (with Conversation Memory)

```http
POST /chat/query
Content-Type: application/json

{
  "question": "What are the quality control procedures?",
  "history": [
    { "role": "user", "content": "What is this document about?" },
    { "role": "assistant", "content": "This document covers..." }
  ]
}
```

Returns AI-generated answer with source citations. The optional `history` field enables follow-up question understanding.

#### Report Generation

```http
POST /report/generate              # Upload CSV and generate report
GET  /reports                      # List all reports
GET  /reports/{report_id}          # Get specific report details
GET  /reports/{report_id}/download # Download report PDF
DELETE /reports/{report_id}        # Delete a report
```

---

## 🌐 Deployment Guide

### Deploy to Render.com (Recommended)

Render offers free hosting with automatic deployments from GitHub!

#### Prerequisites

- GitHub account
- Render account ([sign up free](https://render.com))
- Your API keys ready

#### Quick Deploy (Using Blueprint)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Render**

   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically

3. **Configure Environment Variables**

   In your **Backend Web Service** settings:

   ```env
   GROQ_API_KEY=your_groq_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   PYTHON_VERSION=3.10.0
   ```

4. **Add Persistent Storage**

   - Go to Backend service → **"Disks"**
   - Add a disk with mount path: `/opt/render/project/src`
   - This ensures your documents persist between deployments

5. **Update Frontend Environment**

   In your **Static Site** settings:

   ```env
   VITE_API_URL=https://your-backend.onrender.com
   ```

6. **Deploy!** 🚀
   - Both services auto-deploy when you push to GitHub
   - Free tier includes 750 hours/month
   - Backend may sleep after 15 minutes of inactivity (wakes on request)

#### 💡 Memory Optimization for Free Tier

The backend uses **ONNX Runtime** instead of PyTorch for text embeddings, keeping peak RAM under ~300MB — well within Render's 512MB free-tier limit. No special configuration is needed; the optimization is built into the codebase.

#### Live URLs

- **Backend:** `https://factorymind-ai-backend.onrender.com`
- **Frontend:** `https://factorymind-ai.onrender.com`


---

## 🛠️ Development

### Project Structure

```
FactoryMind-AI/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Main application & API routes
│   ├── rag_engine.py          # RAG pipeline (query routing, memory, contextualization)
│   ├── report_engine.py       # Report generation logic
│   ├── llm_client.py          # LLM API client (Groq/LLaMA)
│   ├── db.py                  # FAISS vector database (with deletion support)
│   └── requirements.txt       # Python dependencies
│
├── src/                       # React TypeScript frontend
│   ├── components/            # UI components
│   │   ├── ChatAssistant.tsx  # Chat interface (session persistence, markdown)
│   │   ├── DocumentManager.tsx# Document management (indexing status polling)
│   │   ├── ReportGenerator.tsx# Report generation
│   │   ├── History.tsx        # History view
│   │   ├── Settings.tsx       # Settings panel
│   │   └── ui/                # Reusable UI components (shadcn/ui)
│   ├── services/
│   │   ├── api.ts             # API client (with conversation history support)
│   │   └── events.ts          # Event emitter for notifications
│   ├── styles/
│   │   └── globals.css        # Global styles
│   └── main.tsx               # App entry point
│
├── .env.example               # Environment variables template
├── package.json               # Node.js dependencies
├── render.yaml                # Render deployment config
└── README.md                  # This file
```

### Building for Production

```bash
# Build frontend
npm run build

# Output will be in 'build/' directory
# Serve with any static file server
```

### Running Tests

```bash
# Check backend health
curl http://localhost:8000/health

# Test the API interactively
# Visit http://localhost:8000/docs for Swagger UI
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### ❌ "Module not found" Error (Python)

**Problem:** Missing Python dependencies

**Solution:**

```bash
pip install -r requirements.txt --upgrade
```

#### ❌ "API Key not found" Error

**Problem:** Environment variables not configured

**Solution:**

1. Check that `.env` file exists in project root
2. Verify it contains your API keys
3. Restart the backend server

#### ❌ Frontend Can't Connect to Backend

**Problem:** CORS or connection issues

**Solution:**

1. Verify backend is running: `http://localhost:8000/health`
2. Check `.env` has correct `ALLOWED_ORIGINS`
3. Verify `.env.local` has correct `VITE_API_URL`
4. Check browser console for CORS errors

#### ❌ FAISS Installation Fails (Windows)

**Problem:** Binary wheel compatibility

**Solution:**

```bash
pip install faiss-cpu --no-cache-dir
```

#### ❌ Port Already in Use

**Problem:** Port 8000 or 5173 is occupied

**Solution:**

For backend (port 8000):

```bash
# Find the process
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

For frontend (port 5173):

```bash
# Find the process
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <PID> /F
```

#### ❌ Upload Fails - File Too Large

**Problem:** File exceeds size limit

**Solution:** Update `MAX_FILE_SIZE` in `.env`:

```env
MAX_FILE_SIZE=20971520  # 20MB
```

#### ❌ Slow Response Times

**Possible causes:**

- First query after idle time (vector store loading)
- Large documents being processed
- Groq API rate limits

**Solutions:**

- Wait for initial load to complete
- Split large PDFs into smaller chunks
- Check Groq API usage limits

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### UI Components

This project uses components from [shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible UI components built with Radix UI and Tailwind CSS (MIT License).

### Images

Sample images from [Unsplash](https://unsplash.com) used under their [free license](https://unsplash.com/license).

### Technologies

- **FastAPI** - Modern Python web framework
- **LangChain** - Building applications with LLMs
- **FAISS** - Facebook AI Similarity Search
- **ONNX Runtime** - Lightweight ML inference
- **Groq** - Ultra-fast LLM inference
- **HuggingFace** - NLP models and tokenizers
- **React & TypeScript** - Modern web development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next-generation frontend tooling

---

## 📞 Support

### Need Help?

- 🐛 Found a bug? [Open an issue](https://github.com/shashankpc7746/FactoryMind-AI/issues)
- 💬 Have questions? Start a [discussion](https://github.com/shashankpc7746/FactoryMind-AI/discussions)
- 📧 Contact: [shashankgupta7746@gmail.com]


## 🚀 What's Next?

### ✅ Shipped in v1.0

- ✅ ~~Advanced analytics dashboard~~ — Interactive charts in reports
- ✅ ~~Conversation memory~~ — Follow-up questions work naturally
- ✅ ~~Smart query routing~~ — Greetings, meta-questions handled intelligently
- ✅ ~~Real-time indexing status~~ — Track document processing live
- ✅ ~~Session persistence~~ — Chat survives page refreshes
- ✅ ~~Proper document deletion~~ — FAISS index rebuilt on delete
- ✅ ~~ONNX Runtime optimization~~ — Runs on 512MB RAM free tier

### 🔮 Coming Soon

- 🔐 User authentication and role-based access
- 🌍 Multi-language support
- 🔗 Integration with popular tools (Slack, Teams, etc.)
- 📧 Email notifications and scheduled reports
- 🎨 Customizable report templates

---

## ⭐ Star This Repository

If you find FactoryMind AI helpful, please give it a star! It helps others discover the project and motivates us to keep improving it.

---

<div align="center">

**Built with ❤️ by the Shashank**

[🌐 Live Demo](https://factorymind-ai.onrender.com) • [🐛 Report Bug](https://github.com/shashankpc7746/FactoryMind-AI/issues) • [✨ Request Feature](https://github.com/shashankpc7746/FactoryMind-AI/issues)

</div>
