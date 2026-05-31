# MailBlast Pro — Backend Setup Guide

## What You Need First
- Node.js installed (download from nodejs.org)
- A Google account
- 10 minutes

---

## Step 1 — Install Node.js
Go to https://nodejs.org and download the LTS version.

---

## Step 2 — Set Up This Project

Open your terminal and run:

```bash
cd mailblast-backend
npm install express nodemailer googleapis dotenv cors multer csv-parser
```

---

## Step 3 — Get Your Gmail API Keys

1. Go to https://console.cloud.google.com
2. Create a new project (call it "MailBlast")
3. Go to APIs & Services → Enable APIs
4. Search and enable "Gmail API"
5. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
6. Set application type to "Web Application"
7. Add redirect URI: http://localhost:3001/auth/callback
8. Copy your CLIENT_ID and CLIENT_SECRET

---

## Step 4 — Configure Your .env File

```bash
cp .env.example .env
```

Open .env and paste your keys:
```
GMAIL_CLIENT_ID=paste_your_client_id
GMAIL_CLIENT_SECRET=paste_your_client_secret
GMAIL_REDIRECT_URI=http://localhost:3001/auth/callback
```

---

## Step 5 — Start the Server

```bash
node server.js
```

You should see:
> Server running on port 3001 ✅

---

## Step 6 — Connect the Frontend

In your frontend app (mailblast-pro.jsx), all buttons now talk to:
```
http://localhost:3001/api/
```

---

## API Endpoints Quick Reference

| Action | Method | URL |
|---|---|---|
| Create campaign | POST | /api/campaigns |
| Start campaign | POST | /api/campaigns/:id/start |
| Pause campaign | POST | /api/campaigns/:id/pause |
| Get stats | GET | /api/campaigns/:id/stats |
| Add Gmail account | POST | /api/accounts |
| Toggle account on/off | PATCH | /api/accounts/:id/toggle |
| Add leads (paste) | POST | /api/leads/:campaignId |
| Import CSV | POST | /api/leads/:campaignId/import |

---

## Deploy to the Cloud (Run 24/7)

### Option A — Railway (Recommended, Free)
1. Go to https://railway.app
2. Connect your GitHub
3. Upload this folder
4. Add your .env variables in the dashboard
5. Deploy — done. It runs forever.

### Option B — Render (Also Free)
1. Go to https://render.com
2. New → Web Service
3. Connect repo, set start command: node server.js
4. Add environment variables
5. Deploy

---

## File Structure
```
mailblast-backend/
├── server.js              ← Main entry point
├── .env                   ← Your secret keys (never share this)
├── services/
│   ├── emailService.js    ← Gmail sending logic
│   ├── campaignEngine.js  ← Auto-rotation & scheduling
│   └── db.js              ← Data storage
├── routes/
│   ├── campaigns.js       ← Campaign endpoints
│   ├── accounts.js        ← Gmail account endpoints
│   └── leads.js           ← Leads & CSV import
└── data/
    └── db.json            ← Your data (auto-created)
```
