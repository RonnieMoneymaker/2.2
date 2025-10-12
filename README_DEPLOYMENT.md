# 🚀 Ronnie CRM - Vercel Deployment Guide

## Snelle Deployment in 5 stappen:

### 1️⃣ Backend naar Railway deployen

```bash
# In de root directory
cd "C:\Users\ronni\Desktop\CRM RONNIE de laatste"

# Maak een Git repo (indien nog niet gedaan)
git init
git add .
git commit -m "Initial commit - Ronnie CRM"

# Push naar GitHub
git remote add origin https://github.com/JOUW_USERNAME/ronnie-crm.git
git push -u origin main
```

Dan op Railway.app:
1. Ga naar https://railway.app
2. Klik "New Project" → "Deploy from GitHub repo"
3. Selecteer je repo
4. Railway detecteert automatisch Node.js
5. Voeg environment variable toe: `PORT=5000`
6. Deploy! Je krijgt een URL zoals: `https://ronnie-crm-production.up.railway.app`

### 2️⃣ Update Frontend voor Production

Update `client\.env.production` met je Railway URL:
```
REACT_APP_API_URL=https://ronnie-crm-production.up.railway.app
```

### 3️⃣ Build de Frontend

```bash
cd client
npm run build
```

### 4️⃣ Deploy Frontend naar Vercel

```bash
# Installeer Vercel CLI (eenmalig)
npm install -g vercel

# Deploy vanuit de CLIENT directory
cd client
vercel --prod
```

Vercel zal vragen:
- Set up project? → **Yes**
- Which scope? → Kies je account
- Link to existing project? → **No**
- Project name? → **ronnie-crm**
- Directory? → **./build**
- Override settings? → **No**

### 5️⃣ Update vercel.json (root directory)

Het bestand is al klaar! Update alleen de backend URL in `vercel.json`:

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://ronnie-crm-production.up.railway.app/api/$1"
    }
  ]
}
```

## ✅ Klaar!

Je Ronnie CRM draait nu op:
- **Frontend**: https://ronnie-crm.vercel.app
- **Backend**: https://ronnie-crm-production.up.railway.app

## 🔧 Alternatief: Eenvoudiger met Vercel CLI vanuit root

```bash
cd "C:\Users\ronni\Desktop\CRM RONNIE de laatste\client"
npm run build
vercel --prod
```

Dan wijst Vercel naar de `build` directory!

## 📱 Quick Commands

**Lokaal testen:**
```bash
npm start              # Frontend: http://localhost:3000
node server.js         # Backend: http://localhost:5000
```

**Production build:**
```bash
cd client
npm run build
```

**Deploy:**
```bash
cd client
vercel --prod
```

