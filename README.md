# CodeCollab AI

A real-time collaborative code review platform with AI-powered static analysis, inline documentation generation, and collaborative editing.

## Features

- **Real-Time Collaboration** - Multiple users can join a room and see each other's cursors and edits live
- **AI Code Analysis** - Automatic detection of security vulnerabilities, anti-patterns, and code quality issues
- **Inline Suggestions** - Click-to-apply AI-generated fixes
- **Documentation Generation** - Auto-generate README from code
- **GitHub Import** - Load code directly from raw GitHub URLs
- **Export Reports** - Generate Markdown reports with AI findings

## Tech Stack

- **Next.js** - React framework
- **Socket.io** - Real-time WebSocket communication
- **Monaco Editor** - Code editor (VS Code engine)
- **Gemini API** - AI-powered code analysis

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Get Gemini API Key (Required for AI Features)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### 3. Configure Environment

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your-actual-api-key-here
```

Or set it temporarily in your terminal:

```bash
export GEMINI_API_KEY=your-actual-api-key-here
```

### 4. Run the App

```bash
npm run dev
```

### 5. Open Browser

Navigate to http://localhost:3000

## Usage Guide

### Creating a Room

1. Click "Create Room" to generate a unique room ID
2. Share the room URL with teammates
3. Anyone with the link can join

### Importing Code

- **Paste directly** - Copy code and paste into the sidebar
- **GitHub import** - Enter a raw GitHub file URL
- The language is auto-detected

### Running AI Analysis

1. Make sure code is loaded in the editor
2. Click the "Analysis" tab in the sidebar
3. Click "Run AI Analysis"
4. Wait for results (check console for progress)

### Reviewing Suggestions

- **Critical** (red) - Security vulnerabilities, hardcoded secrets
- **Warning** (yellow) - Anti-patterns, performance issues
- **Info** (blue) - Code style improvements

Click on a suggestion to highlight the relevant code. Click "Accept" to apply the fix or "Dismiss" to ignore.

### Exporting Reports

1. Click the "Export" button in the header
2. Choose format (Markdown/PDF)
3. Copy or download the report

## Troubleshooting

### "GEMINI_API_KEY not configured"

Make sure your API key is set in `.env.local` or as an environment variable:

```bash
# Verify it's set
echo $GEMINI_API_KEY

# If not, set it
export GEMINI_API_KEY=your-key-here
```

### API quota exceeded

- Free tier has rate limits
- Check [Google AI Studio](https://aistudio.google.com/app) for usage

### Socket connection issues

- Make sure port 3000 is available
- Restart the server: `npm run dev`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Get from [AI Studio](https://aistudio.google.com/app/apikey) |
| `PORT` | No | Server port (default: 3000) |

## API Endpoints

- `POST /api/analyze` - Analyze code and return suggestions
- `POST /api/fix` - Generate code fix for a specific issue

## Project Structure

```
NEXT/
├── app/              # Next.js pages and API routes
│   ├── api/         # Server-side API endpoints
│   ├── page.tsx     # Main page
│   └── globals.css   # Global styles
├── components/      # React components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
│   └── ai-service.ts
├── server/          # Socket.io server
├── README.md        # This file
└── .env.local      # Environment variables (create this)
```

## License

MIT