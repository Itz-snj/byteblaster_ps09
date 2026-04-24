'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
}

export interface Suggestion {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  line: number;
  issue: string;
  fix?: string;
  status: 'pending' | 'accepted' | 'dismissed';
  fixedCode?: string;
}

export interface RoomState {
  roomId: string | null;
  code: string;
  language: string;
  users: User[];
  suggestions: Suggestion[];
  readme: string;
  currentUser: User | null;
}

export interface UseSocketReturn {
  room: RoomState;
  isConnected: boolean;
  latency: number;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  updateCode: (code: string, cursor?: { line: number; column: number }) => void;
  updateCursor: (line: number, column: number) => void;
  updateSelection: (selection: { startLine: number; startColumn: number; endLine: number; endColumn: number }) => void;
  setLanguage: (language: string) => void;
  submitAnalysis: (suggestions: Suggestion[], readme: string) => void;
  updateSuggestionStatus: (suggestionId: string, status: 'accepted' | 'dismissed', fixedCode?: string) => void;
  applyFix: (suggestionId: string, fixedCode: string) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [room, setRoom] = useState<RoomState>({
    roomId: null,
    code: '',
    language: 'javascript',
    users: [],
    suggestions: [],
    readme: '',
    currentUser: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const latencyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    latencyIntervalRef.current = setInterval(() => {
      const start = Date.now();
      socket.emit('ping', () => {
        setLatency(Date.now() - start);
      });
    }, 5000);

    return () => {
      if (latencyIntervalRef.current) {
        clearInterval(latencyIntervalRef.current);
      }
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('user-joined', (user: User) => {
      setRoom(prev => ({
        ...prev,
        users: [...prev.users, user],
      }));
    });

    socket.on('user-left', (user: User) => {
      setRoom(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== user.id),
      }));
    });

    socket.on('code-update', (data: { code: string; userId: string; cursor?: any }) => {
      setRoom(prev => ({
        ...prev,
        code: data.code,
      }));
    });

    socket.on('cursor-update', (data: { userId: string; user: User; cursor: { line: number; column: number } }) => {
      setRoom(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === data.userId ? { ...u, cursor: data.cursor } : u),
      }));
    });

    socket.on('selection-update', (data: { userId: string; user: User; selection: any }) => {
      setRoom(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === data.userId ? { ...u, selection: data.selection } : u),
      }));
    });

    socket.on('language-update', (language: string) => {
      setRoom(prev => ({
        ...prev,
        language,
      }));
    });

    socket.on('analysis-complete', (data: { suggestions: Suggestion[]; readme: string }) => {
      setRoom(prev => ({
        ...prev,
        suggestions: data.suggestions,
        readme: data.readme,
      }));
    });

    socket.on('suggestion-status-update', (data: { suggestionId: string; status: string; fixedCode?: string }) => {
      setRoom(prev => ({
        ...prev,
        suggestions: prev.suggestions.map(s => 
          s.id === data.suggestionId 
            ? { ...s, status: data.status as any, fixedCode: data.fixedCode }
            : s
        ),
      }));
    });

    socket.on('fix-applied', (data: { suggestionId: string; code: string; userId: string }) => {
      setRoom(prev => ({
        ...prev,
        code: data.code,
      }));
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('code-update');
      socket.off('cursor-update');
      socket.off('selection-update');
      socket.off('language-update');
      socket.off('analysis-complete');
      socket.off('suggestion-status-update');
      socket.off('fix-applied');
    };
  }, []);

  const createRoom = useCallback(() => {
    socketRef.current?.emit('create-room', (response: any) => {
      if (response.roomId) {
        setRoom(prev => ({
          ...prev,
          roomId: response.roomId,
          currentUser: response.user,
          users: [response.user],
        }));
      }
    });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join-room', roomId, (response: any) => {
      if (response.roomId) {
        setRoom(prev => ({
          ...prev,
          roomId: response.roomId,
          currentUser: response.user,
          code: response.code || '',
          language: response.language || 'javascript',
          users: response.users || [],
          suggestions: response.suggestions || [],
          readme: response.readme || '',
        }));
      } else if (response.error) {
        console.error('Failed to join room:', response.error);
      }
    });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave-room');
    setRoom({
      roomId: null,
      code: '',
      language: 'javascript',
      users: [],
      suggestions: [],
      readme: '',
      currentUser: null,
    });
  }, []);

  const updateCode = useCallback((code: string, cursor?: { line: number; column: number }) => {
    setRoom(prev => ({ ...prev, code }));
    socketRef.current?.emit('code-change', { code, cursor }, () => {});
  }, []);

  const updateCursor = useCallback((line: number, column: number) => {
    socketRef.current?.emit('cursor-move', { line, column });
  }, []);

  const updateSelection = useCallback((selection: { startLine: number; startColumn: number; endLine: number; endColumn: number }) => {
    socketRef.current?.emit('selection-change', selection);
  }, []);

  const setLanguage = useCallback((language: string) => {
    setRoom(prev => ({ ...prev, language }));
    socketRef.current?.emit('language-change', language);
  }, []);

  const submitAnalysis = useCallback((suggestions: Suggestion[], readme: string) => {
    socketRef.current?.emit('analyze-code', { suggestions, readme }, () => {});
    setRoom(prev => ({ ...prev, suggestions, readme }));
  }, []);

  const updateSuggestionStatus = useCallback((suggestionId: string, status: 'accepted' | 'dismissed', fixedCode?: string) => {
    socketRef.current?.emit('suggestion-update', { suggestionId, status, fixedCode });
    setRoom(prev => ({
      ...prev,
      suggestions: prev.suggestions.map(s =>
        s.id === suggestionId
          ? { ...s, status, fixedCode }
          : s
      ),
    }));
  }, []);

  const applyFix = useCallback((suggestionId: string, fixedCode: string) => {
    socketRef.current?.emit('apply-fix', { suggestionId, fixedCode }, () => {});
    setRoom(prev => ({ ...prev, code: fixedCode }));
  }, []);

  return {
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
  };
}