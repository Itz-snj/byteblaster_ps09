'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Suggestion } from '../hooks/useSocket';
import { analyzeCode, importFromGitHub } from '../lib/ai-service';

interface SidebarProps {
  code: string;
  language: string;
  suggestions: Suggestion[];
  readme: string;
  isAnalyzing: boolean;
  onCodeImport: (code: string, language?: string) => void;
  onAnalyze: (suggestions: Suggestion[], readme: string) => void;
  onSuggestionClick: (suggestion: Suggestion) => void;
  onSuggestionAccept: (suggestionId: string) => void;
  onSuggestionDismiss: (suggestionId: string) => void;
  onApplyFix: (suggestionId: string, fixedCode: string) => void;
  onReadmeCopy: () => void;
  onReadmeDownload: () => void;
}

export default function Sidebar({
  code,
  language,
  suggestions,
  readme,
  isAnalyzing,
  onCodeImport,
  onAnalyze,
  onSuggestionClick,
  onSuggestionAccept,
  onSuggestionDismiss,
  onApplyFix,
  onReadmeCopy,
  onReadmeDownload,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'import' | 'analysis' | 'suggestions' | 'readme'>('import');
  const [githubUrl, setGithubUrl] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImportFromUrl = async () => {
    if (!githubUrl.trim()) return;
    
    setImporting(true);
    setImportError('');
    
    try {
      const importedCode = await importFromGitHub(githubUrl);
      const fileName = githubUrl.split('/').pop() || '';
      onCodeImport(importedCode, fileName);
      setGithubUrl('');
    } catch (error) {
      setImportError('Failed to import. Make sure URL is a raw GitHub file.');
    } finally {
      setImporting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    onAnalyze([], '');
    const result = await analyzeCode(code, language);
    
    if (result.suggestions.length > 0 || result.readme) {
      onAnalyze(result.suggestions, result.readme);
    }
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => {
      if (text.trim()) {
        onCodeImport(text);
      }
    }).catch(() => {
      setImportError('Cannot access clipboard');
    });
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
  const dismissedSuggestions = suggestions.filter(s => s.status === 'dismissed');

  return (
    <motion.aside 
      className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}
      initial={{ x: -280 }}
      animate={{ x: isOpen ? 0 : -240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <button 
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.span
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          ▶
        </motion.span>
      </button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            className="sidebar-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <nav className="sidebar-tabs">
              {(['import', 'analysis', 'suggestions', 'readme'] as const).map(tab => (
                <button
                  key={tab}
                  className={`sidebar-tab ${activeSection === tab ? 'active' : ''}`}
                  onClick={() => setActiveSection(tab)}
                >
                  {tab === 'import' && '📥'}
                  {tab === 'analysis' && '🔍'}
                  {tab === 'suggestions' && '💬'}
                  {tab === 'readme' && '📝'}
                </button>
              ))}
            </nav>

            <div className="sidebar-panel">
              {activeSection === 'import' && (
                <div className="import-section">
                  <h3>Import Code</h3>
                  
                  <div className="import-dropzone">
                    <textarea
                      className="code-input"
                      placeholder="Paste your code here..."
                      value={code}
                      onChange={(e) => onCodeImport(e.target.value)}
                    />
                  </div>

                  <button className="import-btn secondary" onClick={handlePaste}>
                    📋 Paste from Clipboard
                  </button>

                  <div className="divider">
                    <span>OR</span>
                  </div>

                  <div className="github-import">
                    <label>Import from GitHub</label>
                    <div className="import-input-group">
                      <input
                        type="text"
                        placeholder="https://github.com/user/repo/blob/main/file.js"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                      <button 
                        onClick={handleImportFromUrl}
                        disabled={importing || !githubUrl.trim()}
                      >
                        {importing ? '...' : 'Import'}
                      </button>
                    </div>
                    {importError && <p className="error">{importError}</p>}
                  </div>
                </div>
              )}

              {activeSection === 'analysis' && (
                <div className="analysis-section">
                  <h3>AI Code Analysis</h3>
                  
                  <button 
                    className="analyze-btn"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !code.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="spinner" /> Analyzing...
                      </>
                    ) : (
                      <>🔍 Run AI Analysis</>
                    )}
                  </button>

                  <div className="analysis-stats">
                    <div className="stat critical">
                      <span className="stat-icon">🔥</span>
                      <span className="stat-count">
                        {suggestions.filter(s => s.severity === 'critical').length}
                      </span>
                      <span className="stat-label">Critical</span>
                    </div>
                    <div className="stat warning">
                      <span className="stat-icon">⚠️</span>
                      <span className="stat-count">
                        {suggestions.filter(s => s.severity === 'warning').length}
                      </span>
                      <span className="stat-label">Warnings</span>
                    </div>
                    <div className="stat info">
                      <span className="stat-icon">💡</span>
                      <span className="stat-count">
                        {suggestions.filter(s => s.severity === 'info').length}
                      </span>
                      <span className="stat-label">Info</span>
                    </div>
                  </div>

                  <p className="analysis-hint">
                    Analysis includes security vulnerabilities, anti-patterns, and performance issues with AI-powered fixes.
                  </p>
                </div>
              )}

              {activeSection === 'suggestions' && (
                <div className="suggestions-section">
                  <h3>AI Suggestions</h3>
                  
                  {suggestions.length === 0 ? (
                    <p className="empty-state">
                      Run AI analysis to see code review suggestions.
                    </p>
                  ) : (
                    <>
                      {pendingSuggestions.length > 0 && (
                        <div className="suggestion-group">
                          <h4>Pending ({pendingSuggestions.length})</h4>
                          {pendingSuggestions.map(sugg => (
                            <motion.div
                              key={sugg.id}
                              className={`suggestion-card ${sugg.severity}`}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <div className="suggestion-header">
                                <span className={`severity-badge ${sugg.severity}`}>
                                  {sugg.severity === 'critical' && '🔥'}
                                  {sugg.severity === 'warning' && '⚠️'}
                                  {sugg.severity === 'info' && '💡'}
                                  {sugg.severity}
                                </span>
                                <span className="line-number">Line {sugg.line}</span>
                              </div>
                              <p className="suggestion-issue">{sugg.issue}</p>
                              {sugg.fix && (
                                <div className="suggestion-fix">
                                  <code>{sugg.fix}</code>
                                </div>
                              )}
                              <div className="suggestion-actions">
                                <button
                                  className="action-btn accept"
                                  onClick={() => onSuggestionAccept(sugg.id)}
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  className="action-btn dismiss"
                                  onClick={() => onSuggestionDismiss(sugg.id)}
                                >
                                  ✕ Dismiss
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {acceptedSuggestions.length > 0 && (
                        <div className="suggestion-group">
                          <h4>Accepted ({acceptedSuggestions.length})</h4>
                          {acceptedSuggestions.map(sugg => (
                            <div key={sugg.id} className="suggestion-card accepted">
                              <div className="suggestion-header">
                                <span className="status-badge accepted">✓ Accepted</span>
                                <span className="line-number">Line {sugg.line}</span>
                              </div>
                              <p className="suggestion-issue">{sugg.issue}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {dismissedSuggestions.length > 0 && (
                        <div className="suggestion-group">
                          <h4>Dismissed ({dismissedSuggestions.length})</h4>
                          {dismissedSuggestions.slice(0, 3).map(sugg => (
                            <div key={sugg.id} className="suggestion-card dismissed">
                              <div className="suggestion-header">
                                <span className="status-badge dismissed">✕ Dismissed</span>
                                <span className="line-number">Line {sugg.line}</span>
                              </div>
                              <p className="suggestion-issue">{sugg.issue}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeSection === 'readme' && (
                <div className="readme-section">
                  <h3>Generated README</h3>
                  
                  {!readme ? (
                    <p className="empty-state">
                      Run AI analysis to generate documentation.
                    </p>
                  ) : (
                    <>
                      <div className="readme-preview">
                        <pre>{readme}</pre>
                      </div>
                      <div className="readme-actions">
                        <button onClick={onReadmeCopy}>
                          📋 Copy to Clipboard
                        </button>
                        <button onClick={onReadmeDownload}>
                          💾 Download .md
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}