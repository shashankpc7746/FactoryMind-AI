# FactoryMind AI - Quick Start Guide

## 🎯 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Python 3.9 or higher installed
- [ ] Node.js 16 or higher installed
- [ ] OpenAI API key ready
- [ ] Terminal/Command Prompt access

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Configure OpenAI API Key

1. Copy the environment template:

   ```bash
   copy .env.example .env
   ```

2. Open `.env` in a text editor and add your API key:

   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. Save the file

### Step 2: Install Backend Dependencies

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt
```

**Expected time:** 2-3 minutes

### Step 3: Install Frontend Dependencies

```bash
# Install Node packages
npm install
```

**Expected time:** 1-2 minutes

### Step 4: Start the Application

**Terminal 1 - Backend:**

```bash
cd backend
python main.py
```

✅ Backend running at: http://localhost:8000

**Terminal 2 - Frontend:**

```bash
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

## 🧪 Test the Application

### Test 1: Upload a Document

1. Open http://localhost:5173
2. Go to "Document Manager"
3. Upload any PDF file
4. Wait for "Document indexed successfully"

### Test 2: Ask a Question

1. Go to "Chat Assistant"
2. Type a question about your uploaded document
3. Receive AI-generated answer with citations

### Test 3: Generate a Report

1. Create a sample CSV file with data (or use your own)
2. Go to "Report Generator"
3. Upload the CSV file
4. View the auto-generated report

---

## 📋 Sample CSV for Testing

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

Upload this file in the Report Generator to see AI-generated insights!

---

## 🎨 UI Overview

### Navigation

- **Chat Assistant** 💬 - Ask questions about documents
- **Document Manager** 📄 - Upload and manage PDFs
- **Report Generator** 📊 - Analyze data and generate reports
- **History** 📜 - View past interactions

### Chat Assistant Features

- Text input for questions
- File upload button (PDF or CSV)
- AI responses with source citations
- Suggested prompts

### Document Manager Features

- Drag & drop PDF upload
- Document list with status
- Delete documents
- Shows file size and upload date

### Report Generator Features

- CSV/Excel file upload
- Auto-generated reports with:
  - Executive summary
  - Key metrics with trends
  - Observations
  - Recommendations
- PDF download

---

## 🔍 API Documentation

Once backend is running, visit:

- **Interactive API Docs:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc

---

## ❓ Common Issues

### Issue: "Module not found" error

**Solution:**

```bash
pip install -r requirements.txt --upgrade
```

### Issue: "OpenAI API key not found"

**Solution:** Check that `.env` file exists and contains:

```
OPENAI_API_KEY=sk-...
```

### Issue: Frontend can't connect to backend

**Solution:**

1. Ensure backend is running on port 8000
2. Check `.env.local` (create from `.env.local.example`)
3. Verify no firewall blocking

### Issue: FAISS installation fails on Windows

**Solution:**

```bash
pip install faiss-cpu --no-cache-dir
```

### Issue: Port already in use

**Backend (8000):**

```bash
# Find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Frontend (5173):**

```bash
# Find and kill process using port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 🎯 Next Steps

1. ✅ Upload your company's SOP documents
2. ✅ Test Q&A with real operational questions
3. ✅ Generate reports from your production data
4. ✅ Explore the API documentation
5. ✅ Customize for your specific needs

---

## 📚 Additional Resources

- **Full README:** See `SETUP_README.md` for detailed documentation
- **API Reference:** http://localhost:8000/docs
- **Environment Config:** Check `.env.example` for all options

---

## 💬 Tips for Best Results

### Document Q&A:

- Upload domain-specific documents (SOPs, manuals, policies)
- Ask specific questions for better results
- Reference document sections in your questions

### Report Generation:

- Use structured CSV/Excel files
- Include numeric columns for analytics
- Clear column headers help AI understand data better

---

## 🚀 You're All Set!

Your FactoryMind AI system is ready. Start uploading documents and generating insights!

**Need help?** Check `SETUP_README.md` for detailed troubleshooting.

---

Made with ❤️ for Factory Operations
