'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiKey } from '../hooks/useApiKey';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setInputKey('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal settings-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="modal-body">
              <div className="settings-section">
                <h4>Google AI Studio API Key</h4>
                <p className="settings-description">
                  Get your free API key from{' '}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Google AI Studio
                  </a>
                </p>
                
                <div className="api-key-input-group">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="Enter your Gemini API key"
                    value={inputKey}
                    onChange={e => setInputKey(e.target.value)}
                    className="api-key-input"
                  />
                  <button
                    className="toggle-visibility"
                    onClick={() => setShowKey(!showKey)}
                    type="button"
                  >
                    {showKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                <div className="settings-actions">
                  <button 
                    className="save-btn"
                    onClick={handleSave}
                    disabled={!inputKey.trim()}
                  >
                    {saved ? '✓ Saved!' : 'Save Key'}
                  </button>
                  {hasApiKey && (
                    <button 
                      className="clear-btn"
                      onClick={handleClear}
                    >
                      Remove Key
                    </button>
                  )}
                </div>

                {hasApiKey && (
                  <p className="key-status">
                    ✓ API key is configured
                  </p>
                )}
              </div>

              <div className="settings-section">
                <h4>About</h4>
                <p className="about-text">
                  CodeCollab AI uses Google's Gemini 2.0 Flash model for code analysis and documentation generation.
                  The free tier includes generous usage limits for personal projects.
                </p>
                <ul className="feature-list">
                  <li>🔍 AI-powered code analysis</li>
                  <li>📝 Auto-generated README</li>
                  <li>🔧 Smart fix suggestions</li>
                  <li>👥 Real-time collaboration</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}