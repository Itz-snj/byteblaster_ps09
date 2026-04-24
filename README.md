# CodeCollab AI

A real-time collaborative code review platform with AI-powered static analysis, inline documentation generation, and collaborative editing.

## Features

- **Real-Time Collaboration** - Multiple users can join a room and see each other's cursors and edits live via Pusher
- **BYOK (Bring Your Own Key)** - Users provide their own Google AI Studio API key (stored locally)
- **AI Code Analysis** - Automatic detection of security vulnerabilities, anti-patterns, and code quality issues
- **Inline Suggestions** - Click-to-apply AI-generated fixes
- **Documentation Generation** - Auto-generate README from code
- **GitHub Import** - Load code directly from raw GitHub URLs
- **Export Reports** - Generate Markdown reports with AI findings

## Tech Stack

- **Next.js 16** - React framework
- **Pusher** - Real-time WebSocket communication (works on Vercel)
- **Monaco Editor** - Code editor (VS Code engine)
- **Google Gemini 2.0 Flash** - AI-powered code analysis

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run the App (Local Development)

```bash
pnpm build && pnpm start
```

Open http://localhost:3000

### 3. Configure API Key (In-App)

1. Click the ⚙️ **Settings** button in the header
2. Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Paste it and click "Save Key"

The API key is stored in your browser's localStorage - no server configuration needed!

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button.svg)](https://vercel.com/new/clone?repository-url=https://github.com/Itz-snj/byteblaster_ps09)

### Configure Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_PUSHER_KEY` | `2feddeabf6a836f7595e` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap2` |
| `PUSHER_APP_ID` | `2146175` |
| `PUSHER_SECRET` | `b8686e2d7c17e44d0221` |

After adding variables, **redeploy** the app.

## Usage Guide

### Creating a Room

1. Click "Create Room" to generate a unique room ID
2. Share the room ID with teammates
3. They can click "Join Room" and enter the ID

### Importing Code

- **Paste directly** - Copy code and paste into the sidebar
- **GitHub import** - Enter a raw GitHub file URL
- Language is auto-detected

### Running AI Analysis

1. Load code in the editor
2. Click the "Analysis" tab in the sidebar
3. Click "Run AI Analysis"
4. Results appear in the Suggestions panel

### Reviewing Suggestions

- **Critical** (red) - Security vulnerabilities, hardcoded secrets
- **Warning** (yellow) - Anti-patterns, performance issues
- **Info** (blue) - Code style improvements

Click "Accept" to apply the fix or "Dismiss" to ignore.

### Exporting Reports

1. Click the "Export" button in the header
2. Choose Markdown format
3. Copy or download the report

## Troubleshooting

### "No API key provided"

- Click ⚙️ Settings in the header
- Add your Google AI Studio API key
- The key is stored locally in your browser

### Real-time not working

- Verify Pusher credentials are set in Vercel
- Check browser console for connection errors
- Redeploy after adding environment variables

### API quota exceeded

- Free tier has rate limits
- Check [Google AI Studio](https://aistudio.google.com/app) for usage

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_PUSHER_KEY` | Yes | Pusher public key |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Yes | Pusher cluster (e.g., `ap2`) |
| `PUSHER_APP_ID` | Yes | Pusher app ID |
| `PUSHER_SECRET` | Yes | Pusher secret |
| `GEMINI_API_KEY` | No | Server-side key (users can provide their own) |

## Project Structure

```
NEXT/
├── app/                    # Next.js pages and API routes
│   ├── api/
│   │   ├── analyze/       # AI code analysis
│   │   ├── fix/           # AI fix generation
│   │   └── pusher/        # Pusher event trigger
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── CodeCollabApp.tsx  # Main app component
│   ├── CodeEditor.tsx     # Monaco editor
│   ├── Header.tsx         # Header with room controls
│   ├── Sidebar.tsx        # Sidebar with import/analysis
│   └── SettingsModal.tsx  # API key settings
├── hooks/
│   ├── useSocket.ts       # Pusher real-time hooks
│   └── useApiKey.ts       # API key localStorage hook
├── lib/
│   └── ai-service.ts      # AI service client
├── .env.example           # Environment variables template
├── DEPLOY.md              # Deployment guide
└── README.md              # This file
```

## License

MIT