// ============================================
// NetSync Backend - Socket.IO Handlers
// ============================================

import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { RoomUser } from '../models/types';

// In-memory playback state for fast sync
interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  lastUpdate: number;
}

const roomPlaybackStates = new Map<string, PlaybackState>();

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // ---- Join Room ----
    socket.on('room:join', (data: { roomId: string; userName: string; isHost: boolean }) => {
      const { roomId, userName, isHost } = data;
      socket.join(roomId);

      const user: RoomUser = {
        id: uuidv4(),
        roomId,
        name: userName,
        socketId: socket.id,
        isHost: isHost || false,
        joinedAt: new Date().toISOString(),
      };

      db.addUser(user);

      // If host, set initial room host ID
      if (isHost) {
        db.updateRoom(roomId, { hostId: socket.id });
        // Initialize playback state
        if (!roomPlaybackStates.has(roomId)) {
          roomPlaybackStates.set(roomId, {
            isPlaying: false,
            currentTime: 0,
            lastUpdate: Date.now(),
          });
        }
      }

      // Send current playback state to joining user
      const state = roomPlaybackStates.get(roomId);
      if (state) {
        const elapsed = state.isPlaying ? (Date.now() - state.lastUpdate) / 1000 : 0;
        socket.emit('player:sync', {
          isPlaying: state.isPlaying,
          currentTime: state.currentTime + elapsed,
        });
      }

      // Send existing messages to the joining user
      const messages = db.getMessagesForRoom(roomId);
      socket.emit('chat:history', messages);

      // Send existing reactions to the joining user
      const reactions = db.getReactionsForRoom(roomId);
      socket.emit('reaction:history', reactions);

      // Notify all users in the room
      const users = db.getUsersInRoom(roomId);
      io.to(roomId).emit('room:userJoined', { user, users });

      console.log(`[Socket] ${userName} joined room ${roomId} (host: ${isHost})`);
    });

    // ---- Player Controls ----
    socket.on('player:play', (data: { roomId: string; currentTime: number }) => {
      roomPlaybackStates.set(data.roomId, {
        isPlaying: true,
        currentTime: data.currentTime,
        lastUpdate: Date.now(),
      });
      db.updateRoom(data.roomId, { status: 'playing', currentTime: data.currentTime });
      socket.to(data.roomId).emit('player:play', { currentTime: data.currentTime });
    });

    socket.on('player:pause', (data: { roomId: string; currentTime: number }) => {
      roomPlaybackStates.set(data.roomId, {
        isPlaying: false,
        currentTime: data.currentTime,
        lastUpdate: Date.now(),
      });
      db.updateRoom(data.roomId, { status: 'paused', currentTime: data.currentTime });
      socket.to(data.roomId).emit('player:pause', { currentTime: data.currentTime });
    });

    socket.on('player:seek', (data: { roomId: string; currentTime: number }) => {
      const existing = roomPlaybackStates.get(data.roomId);
      roomPlaybackStates.set(data.roomId, {
        isPlaying: existing?.isPlaying ?? false,
        currentTime: data.currentTime,
        lastUpdate: Date.now(),
      });
      db.updateRoom(data.roomId, { currentTime: data.currentTime });
      socket.to(data.roomId).emit('player:seek', { currentTime: data.currentTime });
    });

    // ---- Chat ----
    socket.on('chat:message', (data: { roomId: string; userName: string; text: string }) => {
      if (!data.text.trim()) return;

      const message = {
        id: uuidv4(),
        roomId: data.roomId,
        userId: socket.id,
        userName: data.userName,
        text: data.text.trim(),
        timestamp: new Date().toISOString(),
      };

      db.addMessage(message);
      io.to(data.roomId).emit('chat:message', message);
    });

    // ---- Reactions ----
    socket.on('reaction:send', (data: { roomId: string; userName: string; type: string }) => {
      const reaction = {
        id: uuidv4(),
        roomId: data.roomId,
        userId: socket.id,
        userName: data.userName,
        type: data.type as any,
        timestamp: new Date().toISOString(),
      };

      db.addReaction(reaction);
      io.to(data.roomId).emit('reaction:send', reaction);
    });

    // ---- Disconnect ----
    socket.on('disconnect', () => {
      const user = db.removeUserBySocketId(socket.id);
      if (user) {
        const remainingUsers = db.getUsersInRoom(user.roomId);
        io.to(user.roomId).emit('room:userLeft', { user, users: remainingUsers });

        // If no users left, mark room as ended
        if (remainingUsers.length === 0) {
          db.updateRoom(user.roomId, { status: 'ended', endedAt: new Date().toISOString() });
          roomPlaybackStates.delete(user.roomId);
        }

        console.log(`[Socket] ${user.name} left room ${user.roomId}`);
      }
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
}
