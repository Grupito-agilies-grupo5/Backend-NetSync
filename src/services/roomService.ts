// ============================================
// NetSync Backend - Room Service
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { Room, RoomUser, Rating } from '../models/types';
import { contentCatalog } from '../data/content';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const FALLBACK_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

function getDeterministicVideoFallback(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_VIDEOS.length;
  return FALLBACK_VIDEOS[index];
}

export function createRoom(contentId: string, hostName: string): Room {
  const content = contentCatalog.find((c) => c.id === contentId);
  if (!content) {
    throw new Error(`Content not found: ${contentId}`);
  }

  let code = generateRoomCode();
  while (db.getRoomByCode(code)) {
    code = generateRoomCode();
  }

  const room: Room = {
    id: uuidv4(),
    code,
    contentId,
    contentTitle: content.title,
    imdbId: content.imdbId,
    posterUrl: content.posterUrl,
    videoUrl: content.videoUrl || getDeterministicVideoFallback(content.id),
    hostName,
    hostId: '',
    status: 'waiting',
    currentTime: 0,
    createdAt: new Date().toISOString(),
  };

  return db.createRoom(room);
}

export function createRoomCustom(contentTitle: string, imdbId: string, hostName: string, posterUrl?: string): Room {
  let code = generateRoomCode();
  while (db.getRoomByCode(code)) {
    code = generateRoomCode();
  }

  const room: Room = {
    id: uuidv4(),
    code,
    contentId: `fmdb-${imdbId}`,
    contentTitle,
    imdbId,
    posterUrl,
    videoUrl: getDeterministicVideoFallback(imdbId),
    hostName,
    hostId: '',
    status: 'waiting',
    currentTime: 0,
    createdAt: new Date().toISOString(),
  };

  return db.createRoom(room);
}

export function getRoomById(id: string): Room | undefined {
  return db.getRoom(id);
}

export function getRoomByCode(code: string): Room | undefined {
  return db.getRoomByCode(code.toUpperCase());
}

export function joinRoom(roomId: string, userName: string, socketId: string, isHost: boolean): RoomUser {
  const room = db.getRoom(roomId);
  if (!room) throw new Error('Room not found');
  if (room.status === 'ended') throw new Error('Room has ended');

  const user: RoomUser = {
    id: uuidv4(),
    roomId,
    name: userName,
    socketId,
    isHost,
    joinedAt: new Date().toISOString(),
  };

  return db.addUser(user);
}

export function getUsersInRoom(roomId: string): RoomUser[] {
  return db.getUsersInRoom(roomId);
}

export function removeUserBySocketId(socketId: string): RoomUser | undefined {
  return db.removeUserBySocketId(socketId);
}

export function updateRoomStatus(roomId: string, status: Room['status'], currentTime?: number): Room | undefined {
  const updates: Partial<Room> = { status };
  if (currentTime !== undefined) updates.currentTime = currentTime;
  if (status === 'ended') updates.endedAt = new Date().toISOString();
  return db.updateRoom(roomId, updates);
}

export function addRating(roomId: string, userId: string, userName: string, score: number, comment?: string): Rating {
  if (score < 1 || score > 5) throw new Error('Score must be between 1 and 5');

  const rating: Rating = {
    id: uuidv4(),
    roomId,
    userId,
    userName,
    score,
    comment,
    timestamp: new Date().toISOString(),
  };

  return db.addRating(rating);
}

export function getContent() {
  return contentCatalog;
}
