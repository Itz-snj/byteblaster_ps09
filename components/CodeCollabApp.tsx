'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSocket, Suggestion, User } from '../hooks/useSocket';
import { useApiKey } from '../hooks/useApiKey';
import { generateFix, detectLanguage } from '../lib/ai-service';
import CodeEditor from '../components/CodeEditor';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatusBar from '../components/StatusBar';
import SettingsModal from '../components/SettingsModal';

export default function CodeCollabApp() {
  const {
    room,
    isConnected,
    latency,
    createRoom,
    joinRoom,
    leaveRoom,
    updateCode,
    updateCursor,
    updateSelection,
    setLanguage,
    submitAnalysis,
    updateSuggestionStatus,
    applyFix,
  } = useSocket();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showSettings, setShowSettings] = useState(false);
  const { hasApiKey } = useApiKey();

  const handleCodeChange = useCallback((code: string) => {
    updateCode(code);
    const detected = detectLanguage(code);
    if (detected !== room.language) {
      setLanguage(detected);
    }
  }, [updateCode, setLanguage, room.language]);

  const handleAnalyze = useCallback(async (suggestions: Suggestion[], readme: string) => {
    setIsAnalyzing(true);
    setSyncStatus('syncing');
    
    await submitAnalysis(suggestions, readme);
    
    setIsAnalyzing(false);
    setSyncStatus('synced');
  }, [submitAnalysis]);

  const handleSuggestionAccept = useCallback(async (suggestionId: string) => {
    const suggestion = room.suggestions.find(s => s.id === suggestionId);
    if (!suggestion || !suggestion.fix) return;

    updateSuggestionStatus(suggestionId, 'accepted');
    
    const lines = room.code.split('\n');
    const fixedLines = [...lines];
    
    if (suggestion.line <= fixedLines.length) {
      const lineIndex = suggestion.line - 1;
      if (suggestion.fix.includes('\n')) {
        fixedLines.splice(lineIndex, 1, ...suggestion.fix.split('\n'));
      } else {
        fixedLines[lineIndex] = suggestion.fix;
      }
    }
    
    const newCode = fixedLines.join('\n');
    applyFix(suggestionId, newCode);
    updateCode(newCode);
  }, [room.suggestions, room.code, updateSuggestionStatus, applyFix, updateCode]);

  const handleSuggestionDismiss = useCallback((suggestionId: string) => {
    updateSuggestionStatus(suggestionId, 'dismissed');
  }, [updateSuggestionStatus]);

  const handleExport = useCallback((format: 'markdown' | 'pdf') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const roomId = room.roomId || 'export';
    
    let content = '';
    if (format === 'markdown') {
      content = `# CodeCollab AI Report - ${roomId}\n\n`;
      content += `**Date:** ${new Date().toLocaleDateString()}\n`;
      content += `**Language:** ${room.language}\n`;
      content += `**Users:** ${room.users.length}\n\n`;
      
      if (room.readme) {
        content += `## Documentation\n\n${room.readme}\n\n`;
      }
      
      const critical = room.suggestions.filter(s => s.severity === 'critical');
      const warnings = room.suggestions.filter(s => s.severity === 'warning');
      const info = room.suggestions.filter(s => s.severity === 'info');
      
      if (critical.length > 0) {
        content += `## Critical Issues\n\n`;
        critical.forEach(s => {
          content += `- **Line ${s.line}:** ${s.issue}\n`;
          if (s.fix) content += `  - Fix: \`${s.fix}\`\n`;
        });
        content += '\n';
      }
      
      if (warnings.length > 0) {
        content += `## Warnings\n\n`;
        warnings.forEach(s => {
          content += `- **Line ${s.line}:** ${s.issue}\n`;
          if (s.fix) content += `  - Fix: \`${s.fix}\`\n`;
        });
        content += '\n';
      }
      
      if (info.length > 0) {
        content += `## Suggestions\n\n`;
        info.forEach(s => {
          content += `- **Line ${s.line}:** ${s.issue}\n`;
        });
        content += '\n';
      }
      
      content += `## Code\n\n`;
      content += `\`\`\`${room.language}\n${room.code}\n\`\`\`\n`;
    }

    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codecollab-${roomId}-${timestamp}.${format === 'markdown' ? 'md' : 'pdf'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [room]);

  const handleReadmeCopy = useCallback(() => {
    navigator.clipboard.writeText(room.readme);
  }, [room.readme]);

  const handleReadmeDownload = useCallback(() => {
    const blob = new Blob([room.readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `README-${room.roomId || 'generated'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [room.readme, room.roomId]);

  return (
    <div className="app-container">
      <Header
        roomId={room.roomId}
        currentUser={room.currentUser}
        users={room.users}
        isConnected={isConnected}
        latency={latency}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onLeaveRoom={leaveRoom}
        onExport={handleExport}
        onOpenSettings={() => setShowSettings(true)}
        hasApiKey={hasApiKey}
      />

      <main className="main-content">
        <Sidebar
          code={room.code}
          language={room.language}
          suggestions={room.suggestions}
          readme={room.readme}
          isAnalyzing={isAnalyzing}
          onCodeImport={(code, filename) => {
            updateCode(code);
            if (filename) {
              const lang = detectLanguage(code, filename);
              setLanguage(lang);
            }
          }}
          onAnalyze={handleAnalyze}
          onSuggestionClick={() => {}}
          onSuggestionAccept={handleSuggestionAccept}
          onSuggestionDismiss={handleSuggestionDismiss}
          onApplyFix={() => {}}
          onReadmeCopy={handleReadmeCopy}
          onReadmeDownload={handleReadmeDownload}
        />

        <div className="editor-wrapper">
          <CodeEditor
            code={room.code}
            language={room.language}
            onChange={handleCodeChange}
            onCursorChange={updateCursor}
            onSelectionChange={updateSelection}
            users={[...(room.users || []), room.currentUser ? { ...room.currentUser, id: 'local' } : null].filter(Boolean) as User[]}
            suggestions={room.suggestions}
            onSuggestionClick={() => {}}
          />
        </div>
      </main>

      <StatusBar
        isConnected={isConnected}
        latency={latency}
        language={room.language}
        userCount={room.users.length}
        syncStatus={syncStatus}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}