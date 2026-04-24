'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';

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

const userColors = [
  '#6366f1', '#22d3ee', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 11);
}

export function useSocket(): UseSocketReturn {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
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

  const triggerEvent = useCallback(async (eventName: string, data: any) => {
    try {
      await fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: `room-${room.roomId}`,
          eventName,
          data,
        }),
      });
    } catch (error) {
      console.error('Trigger error:', error);
    }
  }, [room.roomId]);

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || 'demo';
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';

    try {
      pusherRef.current = new Pusher(pusherKey, {
        cluster: pusherCluster,
      });
      setIsConnected(true);
    } catch (error) {
      console.error('Pusher connection error:', error);
    }

    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!room.roomId || !pusherRef.current) return;

    const channel = pusherRef.current.subscribe(`room-${room.roomId}`);
    channelRef.current = channel;

    channel.bind('user-joined', (user: User) => {
      setRoom(prev => ({
        ...prev,
        users: [...prev.users, user],
      }));
    });

    channel.bind('user-left', (user: User) => {
      setRoom(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== user.id),
      }));
    });

    channel.bind('code-update', (data: { code: string; userId: string; cursor?: any }) => {
      setRoom(prev => ({
        ...prev,
        code: data.code,
      }));
    });

    channel.bind('cursor-update', (data: { userId: string; user: User; cursor: { line: number; column: number } }) => {
      setRoom(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === data.userId ? { ...u, cursor: data.cursor } : u),
      }));
    });

    channel.bind('selection-update', (data: { userId: string; user: User; selection: any }) => {
      setRoom(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === data.userId ? { ...u, selection: data.selection } : u),
      }));
    });

    channel.bind('language-update', (language: string) => {
      setRoom(prev => ({
        ...prev,
        language,
      }));
    });

    channel.bind('analysis-complete', (data: { suggestions: Suggestion[]; readme: string }) => {
      setRoom(prev => ({
        ...prev,
        suggestions: data.suggestions,
        readme: data.readme,
      }));
    });

    channel.bind('suggestion-status-update', (data: { suggestionId: string; status: string; fixedCode?: string }) => {
      setRoom(prev => ({
        ...prev,
        suggestions: prev.suggestions.map(s =>
          s.id === data.suggestionId
            ? { ...s, status: data.status as any, fixedCode: data.fixedCode }
            : s
        ),
      }));
    });

    channel.bind('fix-applied', (data: { suggestionId: string; code: string; userId: string }) => {
      setRoom(prev => ({
        ...prev,
        code: data.code,
      }));
    });

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`room-${room.roomId}`);
      }
    };
  }, [room.roomId]);

  const createRoom = useCallback(() => {
    const roomId = generateRoomId();
    const colorIndex = Math.floor(Math.random() * userColors.length);
    const user: User = {
      id: generateUserId(),
      name: `User ${Math.random().toString(36).substring(2, 6)}`,
      color: userColors[colorIndex],
    };

    setRoom(prev => ({
      ...prev,
      roomId,
      currentUser: user,
      users: [user],
    }));

    triggerEvent('user-joined', user);
  }, [triggerEvent]);

  const joinRoom = useCallback((roomId: string) => {
    const colorIndex = Math.floor(Math.random() * userColors.length);
    const user: User = {
      id: generateUserId(),
      name: `User ${Math.random().toString(36).substring(2, 6)}`,
      color: userColors[colorIndex],
    };

    setRoom(prev => ({
      ...prev,
      roomId,
      currentUser: user,
      users: [user],
    }));

    triggerEvent('user-joined', user);
  }, [triggerEvent]);

  const leaveRoom = useCallback(() => {
    if (room.currentUser) {
      triggerEvent('user-left', room.currentUser);
    }
    setRoom({
      roomId: null,
      code: '',
      language: 'javascript',
      users: [],
      suggestions: [],
      readme: '',
      currentUser: null,
    });
  }, [room.currentUser, triggerEvent]);

  const updateCode = useCallback((code: string, cursor?: { line: number; column: number }) => {
    setRoom(prev => ({ ...prev, code }));
    triggerEvent('code-change', { code, cursor, userId: room.currentUser?.id });
  }, [triggerEvent, room.currentUser?.id]);

  const updateCursor = useCallback((line: number, column: number) => {
    triggerEvent('cursor-move', { line, column, userId: room.currentUser?.id });
  }, [triggerEvent, room.currentUser?.id]);

  const updateSelection = useCallback((selection: { startLine: number; startColumn: number; endLine: number; endColumn: number }) => {
    triggerEvent('selection-change', { ...selection, userId: room.currentUser?.id });
  }, [triggerEvent, room.currentUser?.id]);

  const setLanguage = useCallback((language: string) => {
    setRoom(prev => ({ ...prev, language }));
    triggerEvent('language-change', language);
  }, [triggerEvent]);

  const submitAnalysis = useCallback((suggestions: Suggestion[], readme: string) => {
    setRoom(prev => ({ ...prev, suggestions, readme }));
    triggerEvent('analyze-code', { suggestions, readme });
  }, [triggerEvent]);

  const updateSuggestionStatus = useCallback((suggestionId: string, status: 'accepted' | 'dismissed', fixedCode?: string) => {
    setRoom(prev => ({
      ...prev,
      suggestions: prev.suggestions.map(s =>
        s.id === suggestionId
          ? { ...s, status, fixedCode }
          : s
      ),
    }));
    triggerEvent('suggestion-update', { suggestionId, status, fixedCode });
  }, [triggerEvent]);

  const applyFix = useCallback((suggestionId: string, fixedCode: string) => {
    setRoom(prev => ({ ...prev, code: fixedCode }));
    triggerEvent('apply-fix', { suggestionId, fixedCode, userId: room.currentUser?.id });
  }, [triggerEvent, room.currentUser?.id]);

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