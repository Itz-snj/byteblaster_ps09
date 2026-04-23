'use client';

import { motion } from 'framer-motion';

interface StatusBarProps {
  isConnected: boolean;
  latency: number;
  language: string;
  userCount: number;
  syncStatus: 'synced' | 'syncing' | 'error';
}

export default function StatusBar({
  isConnected,
  latency,
  language,
  userCount,
  syncStatus,
}: StatusBarProps) {
  return (
    <footer className="status-bar">
      <div className="status-left">
        <div className={`sync-indicator ${syncStatus}`}>
          {syncStatus === 'synced' && (
            <motion.span
              className="sync-dot"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
          {syncStatus === 'syncing' && (
            <motion.span
              className="sync-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
          {syncStatus === 'error' && <span className="sync-error">⚠️</span>}
          <span className="sync-text">
            {syncStatus === 'synced' && 'Synced'}
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'error' && 'Sync Error'}
          </span>
        </div>

        {latency > 0 && (
          <div className="latency-display">
            <span className="latency-label">Latency:</span>
            <span className={`latency-value ${latency < 50 ? 'good' : latency < 100 ? 'medium' : 'poor'}`}>
              {latency}ms
            </span>
          </div>
        )}
      </div>

      <div className="status-center">
        <span className="language-badge">
          {language === 'javascript' && '🟨'}
          {language === 'typescript' && '🟦'}
          {language === 'python' && '🐍'}
          {language === 'java' && '☕'}
          {language === 'go' && '🔵'}
          {language === 'rust' && '🦀'}
          {language === 'ruby' && '💎'}
          {language === 'cpp' && '⚙️'}
          {language === 'csharp' && '🟣'}
          {language === 'swift' && '🍎'}
          {language === 'html' && '🌐'}
          {language === 'css' && '🎨'}
          {language === 'json' && '📋'}
          {language === 'markdown' && '📝'}
          {language === 'sql' && '🗃️'}
          {language === 'bash' && '💻'}
          {language === 'yaml' && '📄'}
          {language === 'php' && '🐘'}
          {language === 'kotlin' && '🟠'}
          {language === 'scala' && '🔴'}
          {language === 'swift' && '🍎'}
          {!['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'ruby', 'cpp', 'csharp', 'swift', 'html', 'css', 'json', 'markdown', 'sql', 'bash', 'yaml', 'php', 'kotlin', 'scala'].includes(language) && '📄'}
          <span>{language}</span>
        </span>
      </div>

      <div className="status-right">
        <div className="users-online">
          <span className="online-dot" />
          <span className="users-count">{userCount}</span>
          <span className="users-label">online</span>
        </div>

        <div className="app-version">
          CodeCollab AI v1.0.0
        </div>
      </div>
    </footer>
  );
}