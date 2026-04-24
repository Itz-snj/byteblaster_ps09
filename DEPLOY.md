# CodeCollab AI - Deployment Guide

## Two-Part Deployment

This app requires two deployments:
1. **Vercel** - For the Next.js frontend and API routes
2. **Railway** - For the WebSocket server

---

## Step 1: Deploy WebSocket Server to Railway

### Option A: One-Click Deploy
Click the button below to deploy directly to Railway:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.app/new/template?repository=https://github.com/Itz-snj/byteblaster_ps09)

### Option B: Manual Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Init project
railway init

# Deploy
railway up
```

After deployment, copy your Railway URL (e.g., `https://your-app.railway.app`)

---

## Step 2: Deploy to Vercel

### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button.svg)](https://vercel.com/new/clone?repository-url=https://github.com/Itz-snj/byteblaster_ps09)

### Option B: CLI Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## Step 3: Configure Environment Variables

### In Vercel Dashboard:
Go to **Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SOCKET_URL` | Your Railway URL (e.g., `https://your-app.railway.app`) |

---

## Step 4: Using the App

1. Open your Vercel deployment URL
2. Click the ⚙️ Settings button in the header
3. Enter your Google AI Studio API key (get free at https://aistudio.google.com/app/apikey)
4. Create a room and start collaborating!

---

## Troubleshooting

### WebSocket Connection Issues
- Make sure `NEXT_PUBLIC_SOCKET_URL` is set correctly in Vercel
- Check Railway logs: `railway logs`

### API Key Issues
- Ensure API key is saved in Settings
- The free tier of Gemini has rate limits

### Socket.io Not Working
- Verify WebSocket server is running on Railway
- Check for CORS issues in browser console