# 🚀 Render Deployment Guide

Complete guide for deploying FactoryMind AI on Render.com

---

## 📋 Prerequisites

- GitHub account
- Render account (sign up at [render.com](https://render.com))
- Groq API Key
- HuggingFace API Key

---

## 🎯 Deployment Steps

### 1. Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Prepare for Render deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/FactoryMind-AI.git
git branch -M main
git push -u origin main
```

### 2. Connect to Render

#### Option A: Using Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**

#### Option B: Manual Setup

**Backend Service:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `factorymind-backend`
   - **Region:** Oregon (or your preference)
   - **Branch:** `main`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free (or Starter for production)

**Frontend Static Site:**
1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Configure:
   - **Name:** `factorymind-frontend`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

### 3. Configure Backend Environment Variables

In Render Backend Service settings → **Environment**:

```env
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
PYTHON_VERSION=3.10.0
ALLOWED_ORIGINS=https://factorymind-frontend.onrender.com
```

### 4. Add Persistent Disk (Important!)

In Backend Service settings → **Disks**:

1. Click **"Add Disk"**
2. Configure:
   - **Name:** `factorymind-data`
   - **Mount Path:** `/opt/render/project/src`
   - **Size:** 1 GB (free tier) or more
3. Save

This ensures your uploaded documents and vector store persist between deployments.

### 5. Configure Frontend Environment

In Frontend Static Site settings → **Environment**:

```env
VITE_API_URL=https://factorymind-backend.onrender.com
```

**Note:** Update this with your actual backend URL after deployment.

### 6. Deploy!

1. Both services will auto-deploy on push to `main`
2. Monitor logs in Render dashboard
3. Backend: Check `/health` endpoint
4. Frontend: Visit your site URL

---

## 🔧 Post-Deployment Configuration

### Update CORS Origins

After frontend deploys, update backend environment variable:

```env
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

### Custom Domains (Optional)

1. Go to service settings → **Custom Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update `ALLOWED_ORIGINS` and `VITE_API_URL` accordingly

---

## 📊 Free Tier Limitations

**Backend (Free Web Service):**
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Spins down after 15 minutes of inactivity
- ✅ Spins up automatically on request (cold start ~30-60 seconds)
- ✅ 1 GB persistent disk included
- ⚠️ 750 hours/month limit (shared across services)

**Frontend (Static Site):**
- ✅ Unlimited bandwidth
- ✅ Global CDN
- ✅ Always online
- ✅ Free SSL

**Upgrading:**
- **Starter Plan ($7/month):** Always-on, more resources
- **Pro Plan ($15/month):** Better performance, autoscaling

---

## 🔄 Continuous Deployment

Auto-deploys on every push to `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render automatically:
1. Detects changes
2. Runs build
3. Deploys new version
4. Zero downtime deployment

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check Logs:**
```
Render Dashboard → Backend Service → Logs
```

**Common Issues:**
- Missing environment variables → Add in settings
- Dependencies failed → Check `requirements.txt`
- Port binding → Ensure using `$PORT` variable

### Frontend Shows API Errors

1. Verify backend is running: `https://your-backend.onrender.com/health`
2. Check `VITE_API_URL` in frontend environment
3. Verify CORS: Check `ALLOWED_ORIGINS` in backend
4. Check browser console for CORS errors

### Disk Space Issues

**Check Usage:**
```bash
# SSH into backend (in Render shell)
du -sh /opt/render/project/src/*
```

**Cleanup:**
- Delete old documents: Clear via API or Settings
- Increase disk size in Render dashboard

### Cold Starts (Free Tier)

Backend spins down after 15 minutes of inactivity.

**Solutions:**
1. Keep alive with cron job (ping `/health` every 14 minutes)
2. Upgrade to Starter plan ($7/month for always-on)
3. Accept 30-60 second cold start delay

**Keep-Alive Service (Optional):**
Use [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com):
- Ping `https://your-backend.onrender.com/health`
- Every 14 minutes

---

## 🔒 Security Best Practices

### Production Checklist:

- [ ] Rotate API keys regularly
- [ ] Restrict CORS to specific domain
- [ ] Enable Render's DDoS protection
- [ ] Monitor logs for suspicious activity
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Regular security updates

### Environment Variables:

Never commit these to git:
```env
GROQ_API_KEY
HUGGINGFACE_API_KEY
```

Always set in Render dashboard only.

---

## 📈 Monitoring

**Render provides:**
- Real-time logs
- Metrics (CPU, Memory, Requests)
- Deployment history
- Health checks

**External Monitoring (Optional):**
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay
- [UptimeRobot](https://uptimerobot.com) - Uptime monitoring

---

## 💰 Cost Estimates

**Free Tier:**
- Backend + Frontend: $0/month
- 1 GB disk: $0/month
- Limitations: Spin down, shared resources

**Production (Recommended):**
- Backend Starter: $7/month (always-on)
- Frontend: $0/month
- 10 GB disk: ~$1/month
- **Total: ~$8/month**

**Enterprise:**
- Backend Pro: $15/month
- Custom resources as needed

---

## 🎉 Success!

Your application is now live at:
- **Frontend:** `https://factorymind-frontend.onrender.com`
- **Backend:** `https://factorymind-backend.onrender.com`
- **API Docs:** `https://factorymind-backend.onrender.com/docs`

---

## 📞 Support

**Render Issues:**
- [Render Docs](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status](https://status.render.com)

**Application Issues:**
- Check application logs
- Review this troubleshooting guide
- Verify environment variables

---

**Happy Deploying! 🚀**
