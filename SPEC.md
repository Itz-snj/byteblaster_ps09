# CodeCollab AI - Technical Specification

## 1. Project Overview

**Project Name:** CodeCollab AI  
**Type:** Real-time Collaborative Code Review Platform  
**Core Functionality:** Multi-user live code review sessions with AI-powered static analysis, inline documentation generation, and collaborative editing  
**Target Users:** Development teams conducting live code reviews

---

## 2. UI/UX Specification

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER (60px) - Logo | Room ID | Connected Users | Export Button        │
├────────────────────┬────────────────────────────────────────────────┤
│                    │                                                 │
│   SIDEBAR (280px)  │           MAIN CANVAS                          │
│                    │         (Monaco Editor)                       │
│   - File Import    │                                                 │
│   - AI Analysis   │                                                 │
│   - Suggestions   │                                                 │
│   - README Gen   │                                                 │
│                    │                                                 │
├────────────────────┴────────────────────────────────────────────────┤
│ STATUS BAR (32px) - Sync Status | Latency | Language | Users Online    │
└─────────────────────────────────────────────────────────────────┴────────────────┘
```

### Responsive Breakpoints
- **Desktop:** ≥1280px - Full layout with sidebar
- **Tablet:** 768px-1279px - Collapsible sidebar
- **Mobile:** <768px - Bottom sheet panels

### Visual Design

**Color Palette:**
```css
--bg-primary: #0a0a0f;          /* Deep space black */
--bg-secondary: #12121a;        /* Card backgrounds */
--bg-tertiary: #1a1a24;          /* Elevated surfaces */
--bg-editor: #0d0d12;            /* Editor background */

--accent-primary: #6366f1;      /* Indigo - primary actions */
--accent-secondary: #22d3ee;    /* Cyan - AI indicators */
--accent-success: #10b981;      /* Emerald - success states */
--accent-warning: #f59e0b;      /* Amber - warnings */
--accent-error: #ef4444;        /* Red - errors/critical */
--accent-info: #3b82f6;         /* Blue - info */

--text-primary: #f4f4f5;        /* Primary text */
--text-secondary: #a1a1aa;     /* Secondary text */
--text-muted: #52525b;          /* Muted/disabled */

--border-default: #27272a;       /* Default borders */
--border-active: #3f3f46;      /* Active borders */

--glow-indigo: rgba(99, 102, 241, 0.4);
--glow-cyan: rgba(34, 211, 238, 0.3);
```

**Typography:**
- **Font Family:** `"JetBrains Mono"` for code, `"Outfit"` for UI text
- **Headings:** Outfit - 700 weight
  - H1: 32px / 1.2
  - H2: 24px / 1.3
  - H3: 18px / 1.4
- **Body:** Outfit - 400 weight, 14px / 1.6
- **Code:** JetBrains Mono - 400 weight, 13px / 1.5

**Spacing System:**
- Base unit: 4px
- XS: 4px | SM: 8px | MD: 16px | LG: 24px | XL: 32px | 2XL: 48px

**Visual Effects:**
- Card shadows: `0 4px 24px rgba(0, 0, 0, 0.4)`
- Glow effects: `0 0 20px var(--glow-indigo)`
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Backdrop blur: 12px for overlays

### Components

**1. Header Bar**
- Logo with glow animation on hover
- Room ID with copy button
- User avatars with colored rings (online status)
- Export dropdown (Markdown/PDF)
- States: default, dropdown-open

**2. Sidebar Panel**
- Collapsible sections with smooth animation
- File import dropzone with dashed border
- AI Analysis accordion
- Suggestions list with severity badges
- README generator section
- States: collapsed, expanded, loading

**3. Monaco Editor Canvas**
- Custom dark theme matching palette
- Line decorations for AI findings
- Ghost cursors with user colors
- Inline suggestion widgets
- States: loading, ready, sync-error

**4. User Presence Indicators**
- Floating avatar pills
- Colored cursor labels
- Selection highlights
- States: idle, typing, selecting

**5. Suggestion Cards**
- Severity badge (critical/warning/info)
- Code preview with line numbers
- Accept/Dismiss buttons
- Apply fix loading state
- States: pending, accepted, dismissed, applying

**6. Status Bar**
- Sync indicator with pulse animation
- Latency display
- Language detector badge
- Online user count
- States: connected, reconnecting, offline

---

## 3. Functionality Specification

### Core Features

#### A. Real-Time Collaboration Engine
- Socket.io WebSocket connection
- Room-based sessions with unique IDs
- Cursor position broadcasting (throttled 50ms)
- Selection sync across clients
- Conflict-free using operational transforms concept

#### B. Multi-Stage Agentic AI Review
- **Stage 1:** Language detection
- **Stage 2:** Static analysis (severity, line, issue, fix format)
- **Stage 3:** Security vulnerability scanning
- **Stage 4:** Anti-pattern detection
- **Stage 5:** Inline documentation generation
- Uses OpenAI-compatible API (configurable endpoint)

#### C. Interactive Code Canvas
- Monaco Editor integration
- Custom decorators for AI findings
- Click-to-apply fixes via LLM
- Syntax highlighting for 20+ languages
- Line numbers and minimap

#### D. GitHub Source Integration
- Raw file URL import
- Automatic language detection
- URL validation
- CORS-safe proxy option

#### E. Live Presence System
- User avatar display
- Real-time cursor positions
- Selection highlighting
- Typing indicators
- Join/leave notifications

#### F. Atomic Suggestion Engine
- Suggestion state machine: pending → accepted/dismissed
- Diff-match-patch for applying fixes
- Undo support
- Batch operations

#### G. PR Intelligence Export
- Markdown report generation
- Combined AI + team comments
- Copy to clipboard
- Download as .md file

### User Interactions & Flows

**1. Join/Create Room**
- Click "Create Room" → Generate unique room ID
- Share room ID → Others join via URL param
- WebSocket handshake → Sync current state

**2. Import Code**
- Paste code OR import from GitHub URL
- Language auto-detection
- Display in editor

**3. Run AI Analysis**
- Click "Analyze" button
- Send code to LLM API
- Receive structured JSON response
- Apply decorations to editor
- Populate sidebar with findings

**4. Handle Suggestions**
- View suggestion in sidebar or inline
- Click "Apply Fix" → LLM generates fix
- Preview diff → Confirm → Apply
- OR Click "Dismiss"

**5. Export Report**
- Click "Export" → Select format
- Generate combined report
- Download/Copy

### Data Handling

**Room State:**
```typescript
interface RoomState {
  roomId: string;
  code: string;
  language: string;
  users: User[];
  suggestions: Suggestion[];
  readme: string;
}
```

**Suggestion Model:**
```typescript
interface Suggestion {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  line: number;
  issue: string;
  fix?: string;
  status: 'pending' | 'accepted' | 'dismissed';
}
```

### Edge Cases
- WebSocket disconnection → Auto-reconnect with backoff
- LLM API failure → Retry with exponential backoff, show error
- Concurrent edits → Last-write-wins with presence notification
- Large files → Chunk analysis, progress indicator
- Invalid GitHub URL → Show validation error

---

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme with indigo/cyan accents renders correctly
- [ ] Sidebar collapses smoothly on toggle
- [ ] Monaco Editor loads with custom theme
- [ ] Ghost cursors visible with user colors
- [ ] Suggestion cards show severity badges
- [ ] Status bar shows sync status with animation
- [ ] Responsive layout works at all breakpoints

### Functional Checkpoints
- [ ] Room creation generates unique ID
- [ ] WebSocket connects with sub-50ms latency display
- [ ] Code pasting updates editor
- [ ] GitHub raw URL import works
- [ ] AI analysis returns structured findings
- [ ] Click on suggestion highlights code
- [ ] Accept suggestion applies fix to code
- [ ] Export generates valid Markdown
- [ ] Multiple users see each other's cursors

### Technical Checkpoints
- [ ] No console errors on load
- [ ] Socket.io reconnects on disconnect
- [ ] LLM API calls complete within 10s
- [ ] Build completes without errors
- [ ] No memory leaks on long sessions