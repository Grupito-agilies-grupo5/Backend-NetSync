// ============================================
// NetSync Backend - JSON File Database
// ============================================

import fs from 'fs';
import path from 'path';
import { DatabaseSchema, Room, RoomUser, ChatMessage, Reaction, Rating } from './models/types';

const DATA_DIR = path.join(process.cwd(), 'data', 'db');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class JsonDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDir();
    this.data = this.load();
  }

  private ensureDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading database, starting fresh:', err);
    }
    return { rooms: [], users: [], messages: [], reactions: [], ratings: [] };
  }

  private save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // ---- Rooms ----
  createRoom(room: Room): Room {
    this.data.rooms.push(room);
    this.save();
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.data.rooms.find((r) => r.id === id);
  }

  getRoomByCode(code: string): Room | undefined {
    return this.data.rooms.find((r) => r.code === code && r.status !== 'ended');
  }

  updateRoom(id: string, updates: Partial<Room>): Room | undefined {
    const index = this.data.rooms.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    this.data.rooms[index] = { ...this.data.rooms[index], ...updates };
    this.save();
    return this.data.rooms[index];
  }

  getAllRooms(): Room[] {
    return this.data.rooms;
  }

  // ---- Users ----
  addUser(user: RoomUser): RoomUser {
    this.data.users.push(user);
    this.save();
    return user;
  }

  removeUserBySocketId(socketId: string): RoomUser | undefined {
    const index = this.data.users.findIndex((u) => u.socketId === socketId);
    if (index === -1) return undefined;
    const [user] = this.data.users.splice(index, 1);
    this.save();
    return user;
  }

  getUsersInRoom(roomId: string): RoomUser[] {
    return this.data.users.filter((u) => u.roomId === roomId);
  }

  // ---- Messages ----
  addMessage(message: ChatMessage): ChatMessage {
    this.data.messages.push(message);
    this.save();
    return message;
  }

  getMessagesForRoom(roomId: string): ChatMessage[] {
    return this.data.messages.filter((m) => m.roomId === roomId);
  }

  // ---- Reactions ----
  addReaction(reaction: Reaction): Reaction {
    this.data.reactions.push(reaction);
    this.save();
    return reaction;
  }

  getReactionsForRoom(roomId: string): Reaction[] {
    return this.data.reactions.filter((r) => r.roomId === roomId);
  }

  getAllReactions(): Reaction[] {
    return this.data.reactions;
  }

  // ---- Ratings ----
  addRating(rating: Rating): Rating {
    this.data.ratings.push(rating);
    this.save();
    return rating;
  }

  getRatingsForRoom(roomId: string): Rating[] {
    return this.data.ratings.filter((r) => r.roomId === roomId);
  }

  getAllRatings(): Rating[] {
    return this.data.ratings;
  }
}

export const db = new JsonDatabase();
