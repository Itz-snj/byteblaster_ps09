import { createServer } from 'http';
import { Server } from 'socket.io';
import { parse } from 'url';
import next from 'next';

const PORT = process.env.PORT || 3000;

const rooms = new Map();
const userSockets = new Map();

interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
}

interface Room {
  id: string;
  code: string;
  language: string;
  users: Map<string, User>;
  suggestions: any[];
  readme: string;
}

const userColors = [
  '#6366f1', '#22d3ee', '#10b981', '#f59e0b', 
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function initSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let currentRoom: string | null = null;
    let currentUser: User | null = null;

    socket.on('create-room', (callback) => {
      const roomId = generateRoomId();
      const colorIndex = Math.floor(Math.random() * userColors.length);
      
      currentUser = {
        id: socket.id,
        name: `User ${socket.id.substring(0, 4)}`,
        color: userColors[colorIndex],
      };
      
      const room: Room = {
        id: roomId,
        code: '',
        language: 'javascript',
        users: new Map([[socket.id, currentUser]]),
        suggestions: [],
        readme: '',
      };
      
      rooms.set(roomId, room);
      socket.join(roomId);
      currentRoom = roomId;
      userSockets.set(socket.id, roomId);
      
      callback({ roomId, user: currentUser });
      console.log(`Room created: ${roomId} by ${socket.id}`);
    });

    socket.on('join-room', (roomId: string, callback) => {
      const room = rooms.get(roomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }
      
      const colorIndex = room.users.size % userColors.length;
      currentUser = {
        id: socket.id,
        name: `User ${socket.id.substring(0, 4)}`,
        color: userColors[colorIndex],
      };
      
      room.users.set(socket.id, currentUser);
      socket.join(roomId);
      currentRoom = roomId;
      userSockets.set(socket.id, roomId);
      
      callback({ 
        roomId, 
        user: currentUser,
        code: room.code,
        language: room.language,
        users: Array.from(room.users.values()),
        suggestions: room.suggestions,
        readme: room.readme,
      });
      
      socket.to(roomId).emit('user-joined', currentUser);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave-room', () => {
      if (currentRoom && currentUser) {
        const room = rooms.get(currentRoom);
        if (room) {
          room.users.delete(socket.id);
          socket.to(currentRoom).emit('user-left', currentUser);
          
          if (room.users.size === 0) {
            rooms.delete(currentRoom);
            console.log(`Room ${currentRoom} deleted (empty)`);
          }
        }
        socket.leave(currentRoom);
        userSockets.delete(socket.id);
        currentRoom = null;
        currentUser = null;
      }
    });

    socket.on('code-change', (data: { code: string; cursor?: any }, callback) => {
      if (!currentRoom) return;
      
      const room = rooms.get(currentRoom);
      if (!room) return;
      
      room.code = data.code;
      
      socket.to(currentRoom).emit('code-update', {
        code: data.code,
        userId: socket.id,
        cursor: data.cursor,
      });
      
      if (callback) callback({ acknowledged: true });
    });

    socket.on('cursor-move', (data: { line: number; column: number }) => {
      if (!currentRoom || !currentUser) return;
      
      currentUser.cursor = data;
      const room = rooms.get(currentRoom);
      if (!room) return;
      
      room.users.set(socket.id, currentUser);
      
      socket.to(currentRoom).emit('cursor-update', {
        userId: socket.id,
        user: currentUser,
        cursor: data,
      });
    });

    socket.on('selection-change', (data: { startLine: number; startColumn: number; endLine: number; endColumn: number }) => {
      if (!currentRoom || !currentUser) return;
      
      currentUser.selection = data;
      const room = rooms.get(currentRoom);
      if (!room) return;
      
      room.users.set(socket.id, currentUser);
      
      socket.to(currentRoom).emit('selection-update', {
        userId: socket.id,
        user: currentUser,
        selection: data,
      });
    });

    socket.on('language-change', (language: string) => {
      if (!currentRoom) return;
      
      const room = rooms.get(currentRoom);
      if (!room) return;
      
      room.language = language;
      socket.to(currentRoom).emit('language-update', language);
    });

    socket.on('analyze-code', (data: { suggestions: any[]; readme: string }, callback) => {
      if (!currentRoom) return;
      
      const room = rooms.get(currentRoom);
      if (!room) return;
      
      room.suggestions = data.suggestions;
      room.readme = data.readme;
      
      io.to(currentRoom).emit('analysis-complete', {
        suggestions: data.suggestions,
        readme: data.readme,
      });
      
      if (callback) callback({ acknowledged: true });
    });

    socket.on('suggestion-update', (data: { suggestionId: string; status: string; fixedCode?: string }) => {
      if (!currentRoom) return;
      
      const room = rooms.get(currentRoom);
      if (!room) return;
      
      const suggestion = room.suggestions.find((s: any) => s.id === data.suggestionId);
      if (suggestion) {
        suggestion.status = data.status;
        if (data.fixedCode) {
          suggestion.fixedCode = data.fixedCode;
        }
      }
      
      io.to(currentRoom).emit('suggestion-status-update', data);
    });

    socket.on('apply-fix', (data: { suggestionId: string; fixedCode: string }, callback) => {
      if (!currentRoom) return;
      
      const room = rooms.get(currentRoom);
      if (!room) return;
      
      room.code = data.fixedCode;
      
      io.to(currentRoom).emit('fix-applied', {
        suggestionId: data.suggestionId,
        code: data.fixedCode,
        userId: socket.id,
      });
      
      if (callback) callback({ acknowledged: true });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (currentRoom && currentUser) {
        const room = rooms.get(currentRoom);
        if (room) {
          room.users.delete(socket.id);
          socket.to(currentRoom).emit('user-left', currentUser);
          
          if (room.users.size === 0) {
            rooms.delete(currentRoom);
            console.log(`Room ${currentRoom} deleted (empty)`);
          }
        }
        userSockets.delete(socket.id);
      }
    });
  });

  return io;
}