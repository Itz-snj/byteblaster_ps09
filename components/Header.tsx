'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../hooks/useSocket';

interface HeaderProps {
  roomId: string | null;
  currentUser: User | null;
  users: User[];
  isConnected: boolean;
  latency: number;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
  onExport: (format: 'markdown' | 'pdf') => void;
}

export default function Header({
  roomId,
  currentUser,
  users,
  isConnected,
  latency,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onExport,
}: HeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
    }
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      onJoinRoom(joinRoomId.trim().toUpperCase());
      setJoinRoomId('');
      setShowJoinModal(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">CodeCollab AI</span>
        </div>
      </div>

      <div className="header-center">
        {!roomId ? (
          <div className="room-actions">
            <button className="create-room-btn" onClick={onCreateRoom}>
              <span>+ Create Room</span>
            </button>
            <button 
              className="join-room-btn"
              onClick={() => setShowJoinModal(true)}
            >
              Join Room
            </button>
          </div>
        ) : (
          <div className="room-info">
            <div className="room-id-display">
              <span className="label">Room:</span>
              <code className="room-id">{roomId}</code>
              <button 
                className="copy-btn"
                onClick={handleCopyRoomId}
                title="Copy Room ID"
              >
                📋
              </button>
            </div>
            <div className="users-display">
              <span className="label">Users:</span>
              <div className="user-avatars">
                {users.slice(0, 5).map((user, idx) => (
                  <motion.div
                    key={user.id}
                    className="user-avatar"
                    style={{ 
                      backgroundColor: user.color,
                      zIndex: users.length - idx,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </motion.div>
                ))}
                {users.length > 5 && (
                  <div className="user-avatar more">
                    +{users.length - 5}
                  </div>
                )}
              </div>
            </div>
            <button className="leave-btn" onClick={onLeaveRoom}>
              Leave
            </button>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="connection-status">
          <span 
            className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}
          />
          <span className="status-text">
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {latency > 0 && (
            <span className="latency">
              {latency}ms
            </span>
          )}
        </div>

        {roomId && (
          <div className="export-dropdown">
            <button 
              className="export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              📤 Export
              <span className="dropdown-arrow">▼</span>
            </button>
            
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  className="export-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <button onClick={() => { onExport('markdown'); setShowExportMenu(false); }}>
                    📄 Markdown Report
                  </button>
                  <button onClick={() => { onExport('pdf'); setShowExportMenu(false); }}>
                    📑 PDF Report
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showJoinModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div 
              className="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Join Room</h3>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={joinRoomId}
                onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <div className="modal-actions">
                <button onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button 
                  className="primary"
                  onClick={handleJoinRoom}
                  disabled={!joinRoomId.trim()}
                >
                  Join
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}