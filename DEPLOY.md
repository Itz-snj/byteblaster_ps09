# CodeCollab AI - Deployment Guide

## Deployment to Vercel with Pusher

This app uses **Pusher** for real-time WebSocket communication (free tier available).

---

## Step 1: Create Pusher Account

1. Go to https://pusher.com and create a free account
2. Create a new Channels app
3. Get your credentials:
   - `app_id`
   - `key` (public key)
   - `secret`
   - `cluster` (e.g., `us2`)

---

## Step 2: Deploy to Vercel

### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button.svg)](https://vercel.com/new/clone?repository-url=https://github.com/Itz-snj/byteblaster_ps09)

### Option B: CLI Deploy
```bash
npm i -g vercel
vercel
```

---

## Step 3: Configure Environment Variables

In Vercel Dashboard, go to **Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_PUSHER_KEY` | Your Pusher key (from Step 1) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Your Pusher cluster (e.g., `us2`) |
| `PUSHER_APP_ID` | Your Pusher app_id |
| `PUSHER_SECRET` | Your Pusher secret |

---

## Step 4: Using the App

1. Open your Vercel deployment URL
2. Click the ⚙️ Settings button in the header
3. Enter your Google AI Studio API key (get free at https://aistudio.google.com/app/apikey)
4. Create a room and start collaborating!

---

## Local Development

1. Copy `.env.example` to `.env.local`
2. Add your Pusher credentials
3. Run `pnpm dev`

---

## Troubleshooting

### Real-time not working
- Verify Pusher credentials are correct in Vercel
- Check browser console for connection errors
- Ensure `NEXT_PUBLIC_PUSHER_KEY` starts with letters (not numbers)

### API Key Issues
- Add your Google AI Studio key in Settings
- Free tier has rate limits

### Build Errors
- Ensure all environment variables are set
- Rebuild after adding new env vars