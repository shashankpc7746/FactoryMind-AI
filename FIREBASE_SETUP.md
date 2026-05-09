# 🔥 Firebase Setup Guide — FactoryMind AI

Complete step-by-step guide to configure Firebase Authentication with Google Sign-In.

> [!NOTE]
> Everything in this guide is **100% free**. Firebase's free Spark plan includes unlimited authentication users.

---

## Step 1: Create a Firebase Project

1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Click **"Create a project"** (or "Add project")
3. Enter project name: `factorymind-ai` (or any name you prefer)
4. **Disable** Google Analytics (not needed) → Click **"Create project"**
5. Wait for the project to be created → Click **"Continue"**

---

## Step 2: Enable Google Sign-In

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"** (if first time)
3. Go to the **"Sign-in method"** tab
4. Click on **"Google"** from the providers list
5. Toggle the **"Enable"** switch to ON
6. Set a **Project support email** (select your Google account email)
7. Click **"Save"**

> [!TIP]
> You can also enable Email/Password provider later if you want to support non-Google sign-ins.

---

## Step 3: Register Your Web App

1. Go to **Project Settings** (gear icon ⚙️ in the top-left sidebar)
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** (`</>`) to add a web app
4. Enter app nickname: `FactoryMind AI Web`
5. ❌ Do NOT check "Firebase Hosting" (we use Render)
6. Click **"Register app"**
7. You'll see the Firebase config object — **copy these values**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",            // ← copy this
  authDomain: "factorymind-ai.firebaseapp.com",  // ← copy this
  projectId: "factorymind-ai",    // ← copy this
  storageBucket: "factorymind-ai.appspot.com",    // ← copy this
  messagingSenderId: "123456789", // ← copy this
  appId: "1:123456789:web:abc"    // ← copy this
};
```

8. Click **"Continue to console"**

---

## Step 4: Add Config to Your `.env` File

Open your `.env` file in the project root and add the Firebase values:

```env
# Firebase Authentication
VITE_FIREBASE_API_KEY=AIzaSy...your_actual_key...
VITE_FIREBASE_AUTH_DOMAIN=factorymind-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=factorymind-ai
VITE_FIREBASE_STORAGE_BUCKET=factorymind-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> [!IMPORTANT]
> The `VITE_` prefix is required! Vite only exposes env vars starting with `VITE_` to the frontend.

---

## Step 5: Add Authorized Domains (for Deployment)

If you're deploying to Render (or any custom domain):

1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"** and add:
   - `factorymind-ai.onrender.com` (your Render frontend URL)
   - `localhost` (should already be there)
4. Click **"Add"**

> [!WARNING]
> If you skip this step, Google Sign-In will fail on your deployed site with a `auth/unauthorized-domain` error.

---

## Step 6: Add Config to Render (Production)

For your deployed version on Render:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your **Frontend Static Site** service
3. Go to **Environment** tab
4. Add these environment variables (same values from Step 4):

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `factorymind-ai.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `factorymind-ai` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `factorymind-ai.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abcdef` |

5. Click **"Save Changes"** → Render will auto-redeploy

---

## Step 7: Test Locally

```bash
# 1. Start the backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 2. In a new terminal, start the frontend
npm run dev
```

Open `http://localhost:3000` — you should see the **Login page** with "Continue with Google".

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] Firebase Console shows your project with Google Sign-In enabled
- [ ] `.env` file has all 6 `VITE_FIREBASE_*` variables
- [ ] `http://localhost:3000` shows the Login page (not blank)
- [ ] Clicking "Continue with Google" opens a Google popup
- [ ] After signing in, you see the dashboard with your Google name + photo
- [ ] Signing out returns you to the Login page
- [ ] On Render, add all env vars + authorized domain

---

## 🔧 Troubleshooting

### "auth/unauthorized-domain" error
→ Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### Blank page after adding config
→ Restart the dev server (`npm run dev`) — Vite doesn't hot-reload `.env` changes

### Google popup closes immediately  
→ Check browser console for errors. Likely missing `authDomain` or incorrect `apiKey`

### "auth/configuration-not-found"
→ Make sure Google Sign-In is enabled in Firebase Console → Authentication → Sign-in method
