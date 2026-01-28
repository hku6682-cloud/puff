# PUFF Deployment Guide - Vercel & Railway

## Prerequisites
- GitHub account (https://github.com)
- Vercel account (https://vercel.com)
- Railway account (https://railway.app)
- Git installed on your machine

---

## STEP 1: Install Git

1. Download Git from https://git-scm.com/download/win
2. Run the installer and follow the default settings
3. Restart your terminal/PowerShell
4. Verify: Run `git --version` in terminal

---

## STEP 2: Initialize Git & Push to GitHub

### In PowerShell/Terminal:

```powershell
cd "C:\Users\lenovo\Desktop\all projects\puff"

# Initialize git
git init
git config user.name "Your Name"
git config user.email "your.email@gmail.com"

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - PUFF social platform"
```

### Create GitHub Repository:

1. Go to https://github.com/new
2. Create a repository named `puff` (do NOT initialize with README)
3. Copy the repository URL (https://github.com/YOUR_USERNAME/puff.git)

### Push Code to GitHub:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/puff.git
git branch -M main
git push -u origin main
```

---

## STEP 3: Deploy Backend to Railway

### 1. Go to https://railway.app and sign up

### 2. Create New Project:
- Click "New Project"
- Select "Deploy from GitHub repo"
- Click "Configure GitHub App"
- Authorize Railway to access your GitHub repositories
- Select your `puff` repository

### 3. Configure Backend Service:
- Click "Add Service"
- Select "GitHub Repo"
- Choose your `puff` repo
- Set the following in Root Directory: `backend`

### 4. Add Environment Variables:
In Railway dashboard, go to Variables and add:
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### 5. Deploy:
- Railway will auto-detect Node.js
- Check deployment status in the "Build Logs"
- Once deployed, note your Railway URL (looks like: `https://puff-production.up.railway.app`)
- This URL will be your `VITE_API_URL` for frontend

---

## STEP 4: Deploy Frontend to Vercel

### 1. Go to https://vercel.com and sign up

### 2. Import GitHub Project:
- Click "Add New..." → "Project"
- Click "Import Git Repository"
- Select your `puff` repository
- Click "Import"

### 3. Configure Frontend:
- **Root Directory**: `frontend`
- **Framework**: React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. Add Environment Variables:
Before deploying, add:
```
VITE_API_URL=https://your-railway-url/api/v1
```

Replace `your-railway-url` with the actual Railway URL from Step 3.5

### 5. Deploy:
- Click "Deploy"
- Wait for deployment to complete
- Your site will be at: `https://your-project.vercel.app`

---

## STEP 5: Update Backend for CORS

After you have your Vercel URL, update backend `.env`:

In Railway Dashboard → Variables, update:
```
FRONTEND_URL=https://your-vercel-url.vercel.app
```

---

## Summary of URLs

After deployment, you'll have:

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://your-project.vercel.app |
| **Backend (Railway)** | https://your-railway-url.up.railway.app |
| **Backend API** | https://your-railway-url.up.railway.app/api/v1 |

---

## Testing Production Deployment

1. Visit your Vercel URL
2. Try signing up with a test account
3. Check Network tab (F12) to verify API calls are going to Railway backend
4. Check Railway logs to see API requests being processed

---

## Troubleshooting

### Frontend deploys but shows 404
- Make sure Root Directory is set to `frontend`
- Verify `dist` folder exists in build

### Backend API calls fail
- Check CORS settings in Railway environment
- Verify `FRONTEND_URL` matches your Vercel domain exactly
- Check Railway logs for errors

### "Cannot find module" errors
- Make sure `npm install` runs on both platforms
- Check that all dependencies are in package.json

---

## Next Steps

1. Install Git
2. Push code to GitHub
3. Connect both services to Vercel and Railway
4. Test the live deployment

Good luck! 🚀
