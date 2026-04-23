'use client';

import { useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { User, Suggestion } from '../hooks/useSocket';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  onCursorChange: (line: number, column: number) => void;
  onSelectionChange: (selection: { startLine: number; startColumn: number; endLine: number; endColumn: number }) => void;
  users: User[];
  suggestions: Suggestion[];
  onSuggestionClick?: (suggestion: Suggestion) => void;
}

const customTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c084fc' },
    { token: 'string', foreground: '34d399' },
    { token: 'number', foreground: 'fbbf24' },
    { token: 'function', foreground: '22d3ee' },
    { token: 'variable', foreground: 'f472b6' },
    { token: 'type', foreground: '60a5fa' },
  ],
  colors: {
    'editor.background': '#0d0d12',
    'editor.foreground': '#f4f4f5',
    'editor.lineHighlightBackground': '#1a1a24',
    'editor.selectionBackground': '#3f3f46',
    'editor.inactiveSelectionBackground': '#27272a',
    'editorLineNumber.foreground': '#52525b',
    'editorLineNumber.activeForeground': '#a1a1aa',
    'editorCursor.foreground': '#22d3ee',
    'editor.selectionHighlightBackground': '#6366f130',
    'editorIndentGuide.background': '#27272a',
    'editorIndentGuide.activeBackground': '#3f3f46',
    'editorBracketMatch.background': '#6366f130',
    'editorBracketMatch.border': '#6366f1',
  },
};

const severityDecorations = {
  critical: { className: 'critical-gutter', glyph: '🔥', color: '#ef4444' },
  warning: { className: 'warning-gutter', glyph: '⚠️', color: '#f59e0b' },
  info: { className: 'info-gutter', glyph: '💡', color: '#3b82f6' },
};

export default function CodeEditor({
  code,
  language,
  onChange,
  onCursorChange,
  onSelectionChange,
  users,
  suggestions,
  onSuggestionClick,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const cursorWidgetsRef = useRef<HTMLElement | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('codecollab', customTheme);
    monaco.editor.setTheme('codecollab');

    editor.onDidChangeCursorPosition((e) => {
      onCursorChange(e.position.lineNumber, e.position.column);
    });

    editor.onDidChangeCursorSelection((e) => {
      onSelectionChange({
        startLine: e.selection.startLineNumber,
        startColumn: e.selection.startColumn,
        endLine: e.selection.endLineNumber,
        endColumn: e.selection.endColumn,
      });
    });

    window.dispatchEvent(new CustomEvent('editor-ready', { detail: editor }));
  };

  const updateDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const newDecorations: monaco.editor.IModelDeltaDecoration[] = suggestions
      .filter(s => s.status === 'pending')
      .map(suggestion => {
        const config = severityDecorations[suggestion.severity];
        return {
          range: new monaco.Range(suggestion.line, 1, suggestion.line, 1),
          options: {
            isWholeLine: true,
            className: `severity-${suggestion.severity}`,
            glyphMarginClassName: `severity-glyph-${suggestion.severity}`,
            glyphMarginHoverMessage: { value: `**${suggestion.severity.toUpperCase()}**: ${suggestion.issue}` },
            linesDecorationsClassName: `severity-line-${suggestion.severity}`,
          },
        };
      });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [suggestions]);

  useEffect(() => {
    updateDecorations();
  }, [updateDecorations]);

  useEffect(() => {
    if (!editorRef.current) return;

    const cleanupFunctions: (() => void)[] = [];

    users.forEach(user => {
      if (user.id === 'local') return;
      
      if (user.cursor) {
        const widget = document.createElement('div');
        widget.className = 'ghost-cursor';
        widget.style.cssText = `
          position: absolute;
          width: 2px;
          background: ${user.color};
          height: 18px;
          pointer-events: none;
          z-index: 10;
          animation: cursor-blink 1s ease-in-out infinite;
        `;
        
        const label = document.createElement('div');
        label.className = 'cursor-label';
        label.textContent = user.name;
        label.style.cssText = `
          position: absolute;
          top: -20px;
          left: 0;
          background: ${user.color};
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          white-space: nowrap;
          font-family: 'Outfit', sans-serif;
        `;
        
        widget.appendChild(label);
        
        cleanupFunctions.push(() => {
          widget.remove();
        });
      }
    });

    return () => {
      cleanupFunctions.forEach(fn => fn());
    };
  }, [users]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="code-editor-container">
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 22,
          minimap: { enabled: true, scale: 1 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          glyphMargin: true,
          lineDecorationsWidth: 8,
        }}
        loading={
          <div className="editor-loading">
            <div className="loading-spinner" />
            <span>Loading editor...</span>
          </div>
        }
      />
    </div>
  );
}