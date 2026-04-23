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

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Run Locally

```bash
npm run dev
```

Then open http://localhost:3000

### AI Setup (Gemini API)

The code analysis uses Google Gemini API. Get a free API key:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

Set the environment variable:

```bash
export GEMINI_API_KEY=your-api-key-here
```

Or add to `.env.local`:

```
GEMINI_API_KEY=your-api-key-here
```

## Usage

1. Open http://localhost:3000
2. Click "Create Room" to start a new session
3. Share the room ID with teammates
4. Paste code or import from GitHub
5. Click "Run AI Analysis" to analyze code
6. Review suggestions and apply fixes
7. Export reports

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key (required for AI features) |
| `PORT` | Server port (default: 3000) |

## Project Structure

```
app/              - Next.js pages and API routes
components/       - React components
hooks/            - Custom React hooks
lib/              - Utility libraries
server/           - Socket.io server
```