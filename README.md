# 🏭 FactoryMind AI v2.0 - Intelligent Operations Assistant

> **Transform your internal operations with AI-powered document intelligence, automated data analytics, and secure Google Authentication.**

FactoryMind AI is a comprehensive full-stack application that helps organizations manage their internal documentation and generate insightful reports from operational data. Built with cutting-edge AI technology, it combines RAG (Retrieval-Augmented Generation) for intelligent document Q&A with conversation memory, automated report generation from CSV/Excel data, and Firebase-powered Google Sign-In for secure access control.

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi) ![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

---

## ✨ Key Features

### 🔐 Authentication & Security

- **Google Sign-In** — One-click authentication via Firebase
- **Auth Guard** — Protected dashboard, only authenticated users can access
- **Persistent Sessions** — Stay signed in across page refreshes
- **Graceful Fallback** — App works without auth when Firebase is not configured
- **Profile Photo Integration** — Google profile photo displayed in sidebar and header

### 🤖 RAG-Based Knowledge Assistant

- **Smart Document Processing** — Upload SOPs, manuals, policies, and other PDFs
- **Intelligent Search** — Ask questions in natural language and get precise answers
- **Conversation Memory** — Follow-up questions understood in context ("but which model?")
- **Smart Query Routing** — Greetings, meta-questions, and document queries handled intelligently
- **Source Citations** — Every answer includes references to source documents
- **Vector Database** — Fast and efficient document retrieval using FAISS
- **Proper Document Deletion** — Deleting a doc removes it from both disk and vector index
- **Multi-Document Awareness** — Cross-document questions answered correctly

### 📊 Automated Report Generator

- **Data Analysis** — Upload CSV/Excel files for instant insights
- **AI-Powered Insights** — Automatically generates executive summaries
- **Visual Analytics** — Interactive charts: bar distributions, line trends, pie breakdowns, and correlation heatmaps
- **Anomaly Detection** — Identifies outliers and patterns using statistical methods
- **Professional Reports** — Export beautifully formatted PDF reports
- **Key Metrics Dashboard** — Visual representation of trends and KPIs
- **Actionable Recommendations** — Get data-driven suggestions for improvement

### 🎨 Modern User Interface

- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Themes** — Choose your preferred viewing mode (auto-saved)
- **Intuitive Navigation** — Clean sidebar with easy access to all features
- **Real-time Indexing Status** — Live progress tracking from upload → indexed → ready
- **Chat Session Persistence** — Chat history survives page refreshes
- **Markdown Rendering** — LLM responses display with proper bold, bullets, and formatting
- **File Management** — Drag-and-drop interface for document uploads
- **Keyboard Shortcuts** — `Ctrl+K` to focus search bar
- **Smart Profile Settings** — Auto-saving preferences, Google account integration
- **Activity History** — View and search through all document and report activity

---

## 🎯 Who Is This For?

- **Operations Managers** — Quick access to SOPs and operational procedures
- **Quality Assurance Teams** — Instant reference to quality control documents
- **Data Analysts** — Automated report generation from production data
- **Safety Officers** — Fast retrieval of safety guidelines and protocols
- **Management Teams** — Executive summaries and data-driven insights

---

## 🏗️ Technology Stack

### Backend

- **FastAPI** — High-performance Python web framework
- **LangChain** — For RAG pipeline and document processing
- **FAISS** — Facebook's vector database for similarity search
- **ONNX Runtime** — Lightweight embeddings inference (~50MB RAM vs ~250MB with PyTorch)
- **HuggingFace** — Model hosting and tokenizers
- **Groq API** — Lightning-fast LLM inference (LLaMA 3.1 70B)
- **Pandas & NumPy** — Data analysis and manipulation
- **ReportLab** — PDF report generation

### Frontend

- **React 18** — Modern UI library
- **TypeScript** — Type-safe JavaScript
- **Vite** — Lightning-fast build tool
- **Tailwind CSS** — Utility-first CSS framework
- **Shadcn/UI** — Beautiful, accessible components
- **Lucide React** — Consistent icon library
- **Firebase Auth** — Google Sign-In with persistent sessions
- **Recharts** — Interactive data visualizations

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

- ✅ **Python 3.10 or higher** — [Download Python](https://www.python.org/downloads/)
- ✅ **Node.js 18 or higher** — [Download Node.js](https://nodejs.org/)
- ✅ **Git** — [Download Git](https://git-scm.com/downloads)
- ✅ **Groq API Key** (free) — [Get API key](https://console.groq.com/)
- ✅ **HuggingFace API Key** (free) — [Get API key](https://huggingface.co/settings/tokens)
- ✅ **Firebase Project** (free) — [Create project](https://console.firebase.google.com/) — see [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed guide

### 📥 Step 1: Clone the Repository

```bash
git clone https://github.com/shashankpc7746/FactoryMind-AI.git
cd FactoryMind-AI
```

### 🐍 Step 2: Backend Setup

#### Create Virtual Environment

```bash
# Create a virtual environment
python -m venv fact-ai

# Activate it
# Windows:
fact-ai\Scripts\activate
# macOS/Linux:
source fact-ai/bin/activate
```

#### Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

> **Note:** The project uses ONNX Runtime instead of PyTorch for text embeddings. This keeps the memory footprint under 300MB — critical for free-tier hosting (512MB RAM).

#### Configure Environment Variables

```bash
# Copy the example environment file
# Windows:
copy .env.example .env
# macOS/Linux:
cp .env.example .env
```

Open `.env` and add your API keys:

```env
# Required API Keys
GROQ_API_KEY=your_groq_api_key_here
HF_API_KEY=your_huggingface_api_key_here

# Firebase Authentication (see FIREBASE_SETUP.md)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> 💡 **Tip:** For detailed Firebase setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

#### Start the Backend Server

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

✅ **Backend running at:** `http://localhost:8000`
📖 **API Docs at:** `http://localhost:8000/docs`

### 🎨 Step 3: Frontend Setup

Open a **new terminal** (keep the backend running):

```bash
# Install frontend dependencies (from project root)
npm install

# Start the development server
npm run dev
```

✅ **Frontend running at:** `http://localhost:3000`

### 🎉 Step 4: Explore!

Open `http://localhost:3000` in your browser.

- If Firebase is configured → you'll see the **Login page** (sign in with Google)
- If Firebase is NOT configured → you'll go directly to the **Dashboard**

**Quick tests:**

1. **Upload a Document** 📄 → Document Manager → Upload a PDF → Wait for indexing
2. **Ask a Question** 💬 → Chat Assistant → Ask about the document content
3. **Generate a Report** 📊 → Report Generator → Upload a CSV → Get AI insights + charts

---

## 📚 Usage Guide

### Document Management

1. Click **"Document Manager"** in the sidebar
2. Drag and drop PDF files, or click **"Select Files"**
3. Supported formats: PDF (up to 10MB)
4. Real-time status: uploading → processing → indexed ✅
5. Documents are now searchable via the Chat Assistant

### Chat Assistant

1. Navigate to **"Chat Assistant"**
2. Type your question and press **Enter**
3. View AI-generated answers with source citations
4. Follow-up questions work naturally with conversation memory
5. Use suggested prompts: "Ask about procedures", "Generate report", "Analyze data"
6. Attach PDFs or CSVs directly via the **paperclip icon**

### Report Generation

1. Go to **"Report Generator"**
2. Upload a CSV or Excel file with operational data
3. AI analyzes and generates: executive summary, key metrics, interactive charts, recommendations
4. Download as a professional PDF report

### Settings & Profile

- **Account Card** — View your Google account info (name, email, photo)
- **Profile Settings** — Edit role and department (saved to localStorage)
- **Appearance** — Dark/Light theme, Compact Mode, High Contrast (auto-saved)
- **Notifications** — Toggle document indexing, report generation, and system update alerts
- **Danger Zone** — Reset all data (documents, reports, vectors, chat history)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus the search bar |

---

## 🧪 Sample Data for Testing

Create a file named `sample_production_data.csv`:

```csv
Date,Shift,Production_Units,Downtime_Hours,Quality_Pass_Rate,Defects
2026-01-01,Morning,1234,0.5,98.5,18
2026-01-01,Evening,1180,1.2,97.8,26
2026-01-02,Morning,1290,0.3,99.1,11
2026-01-02,Evening,1205,0.8,98.2,21
2026-01-03,Morning,1250,0.6,98.7,16
2026-01-03,Evening,1190,1.5,97.5,29
```

Upload this in Report Generator to see AI-powered analysis with interactive charts!

---

## 🔌 API Documentation

### Interactive Docs

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Core Endpoints

```http
GET  /health                       # System status

POST /upload/document              # Upload and index a PDF
GET  /indexing-status/{filename}   # Poll indexing progress
GET  /documents                    # List all documents
DELETE /documents/{filename}       # Delete document + vector chunks

POST /chat/query                   # RAG query with conversation memory
POST /report/generate              # Upload CSV and generate report
GET  /reports                      # List all reports
GET  /reports/{id}                 # Get report details
GET  /reports/{id}/download        # Download PDF
DELETE /reports/{id}               # Delete report
DELETE /clear-all-data             # Reset everything
```

---

## 🌐 Deployment (Render.com)

Render offers free hosting with automatic deployments from GitHub.

1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → New → Blueprint
3. Connect your repo — Render detects `render.yaml` automatically
4. Add environment variables for both backend and frontend services
5. Add Firebase authorized domain: `your-app.onrender.com` (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))

### Live URLs

- **Backend:** `https://factorymind-ai-backend.onrender.com`
- **Frontend:** `https://factorymind-ai.onrender.com`

> **Note:** Free tier backend may sleep after 15 minutes of inactivity. First request wakes it up.

---

## 🛠️ Project Structure

```
FactoryMind-AI/
├── backend/                       # Python FastAPI backend
│   ├── main.py                   # API routes & application entry
│   ├── rag_engine.py             # RAG pipeline (query routing, memory, context)
│   ├── report_engine.py          # Report generation & PDF export
│   ├── llm_client.py             # LLM API client (Groq/LLaMA)
│   ├── db.py                     # FAISS vector database with deletion support
│   └── requirements.txt          # Python dependencies
│
├── src/                           # React TypeScript frontend
│   ├── App.tsx                   # Root component with auth guard
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles & design tokens
│   ├── config/
│   │   └── firebase.ts           # Firebase initialization (conditional)
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication state management
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   ├── components/
│   │   ├── Login.tsx             # Google Sign-In page
│   │   ├── ChatAssistant.tsx     # Chat with conversation memory
│   │   ├── DocumentManager.tsx   # Document upload & management
│   │   ├── ReportGenerator.tsx   # Report generation with charts
│   │   ├── History.tsx           # Activity history & search
│   │   ├── Settings.tsx          # Profile, appearance, notifications
│   │   ├── Header.tsx            # Top bar with search (Ctrl+K)
│   │   ├── Sidebar.tsx           # Navigation with sign-out
│   │   └── ui/                   # Shadcn/UI component library
│   ├── services/
│   │   ├── api.ts                # Backend API client
│   │   └── events.ts             # Notification event emitter
│   └── images/
│       └── FactoryMind-AI.png    # App logo
│
├── .env.example                   # Environment variables template
├── FIREBASE_SETUP.md              # Step-by-step Firebase guide
├── render.yaml                    # Render deployment config
├── vite.config.ts                 # Vite build configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Node.js dependencies
├── LICENSE                        # MIT License
└── README.md                      # This file
```

---

## 🐛 Troubleshooting

### ❌ Blank page after adding Firebase config

**Cause:** Vite doesn't hot-reload `.env` changes.
**Fix:** Restart the dev server: stop it, then run `npm run dev` again.

### ❌ "Module not found" (Python)

```bash
pip install -r backend/requirements.txt --upgrade
```

### ❌ "API Key not found"

1. Check `.env` exists in project root (not `.env.example`)
2. Verify API keys are set
3. Restart the backend

### ❌ Google Sign-In popup closes immediately

1. Check browser console for Firebase errors
2. Verify `VITE_FIREBASE_AUTH_DOMAIN` is correct
3. Ensure Google Sign-In is enabled in Firebase Console

### ❌ "auth/unauthorized-domain"

Add your deployment domain to Firebase Console → Authentication → Settings → Authorized domains.

### ❌ Frontend can't connect to backend

1. Verify backend is running: `http://localhost:8000/health`
2. Check `ALLOWED_ORIGINS` in `.env` includes your frontend URL
3. Check browser console for CORS errors

### ❌ Port already in use

```bash
# Windows — find and kill the process:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "Add amazing feature"`
4. **Push** to your fork: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 🚀 What's New in v2.0

### ✅ Shipped

- 🔐 **Google Authentication** — Firebase Sign-In with persistent sessions
- 🛡️ **Auth Guard** — Login page protects the dashboard
- 👤 **Profile Settings** — Google account card, auto-saving preferences
- ⌨️ **Keyboard Shortcuts** — `Ctrl+K` for search focus
- 🔄 **History Page** — Refresh, search, stats bar, improved empty states
- 🚪 **Sidebar Sign-out** — Visible sign-out button when auth is enabled
- 🖼️ **Brand Consistency** — FactoryMind AI logo on login & loading screens

### ✅ Shipped in v1.0

- 📊 Interactive charts in reports (bar, line, pie, heatmap)
- 💬 Conversation memory for follow-up questions
- 🧠 Smart query routing (greetings, meta-questions)
- 📡 Real-time document indexing status
- 💾 Chat session persistence
- 🗑️ Proper document deletion from FAISS index
- ⚡ ONNX Runtime optimization (runs on 512MB RAM)

### 🔮 Coming Soon

- 🌍 Multi-language support
- 🔗 Slack/Teams integration
- 📧 Scheduled reports & email notifications
- 🎨 Customizable report templates
- 👥 Multi-user workspaces with role-based access

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) — Beautiful, accessible UI components
- [Firebase](https://firebase.google.com/) — Authentication infrastructure
- [Groq](https://groq.com/) — Ultra-fast LLM inference
- [LangChain](https://langchain.com/) — RAG pipeline framework
- [FAISS](https://github.com/facebookresearch/faiss) — Vector similarity search

---

<div align="center">

**Built with ❤️ by Shashank**

[🌐 Live Demo](https://factorymind-ai.onrender.com) • [🐛 Report Bug](https://github.com/shashankpc7746/FactoryMind-AI/issues) • [✨ Request Feature](https://github.com/shashankpc7746/FactoryMind-AI/issues)

</div>
