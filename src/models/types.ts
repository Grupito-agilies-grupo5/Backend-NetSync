// ============================================
// NetSync Backend - Type Definitions
// ============================================

export interface Room {
  id: string;
  code: string;
  contentId: string;
  contentTitle: string;
  imdbId?: string;
  posterUrl?: string;
  actors?: string;
  videoUrl?: string;
  hostName: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  currentTime: number;
  createdAt: string;
  endedAt?: string;
}

export interface RoomUser {
  id: string;
  roomId: string;
  name: string;
  socketId: string;
  isHost: boolean;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Reaction {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  type: 'like' | 'surprised' | 'laugh' | 'bored';
  timestamp: string;
}

export interface Rating {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  score: number;
  comment?: string;
  timestamp: string;
}

export interface ContentItem {
  id: string;
  title: string;
  genre: string;
  year: number;
  duration: string;
  description: string;
  gradient: string;
  rating: string;
  imdbId?: string;
  posterUrl?: string;
  actors?: string;
  videoUrl?: string;
}

export interface Metrics {
  totalRooms: number;
  activeRooms: number;
  totalUsers: number;
  averageRating: number;
  totalRatings: number;
  mostUsedContent: { title: string; count: number }[];
  reactionCounts: { type: string; count: number }[];
  averageSessionMinutes: number;
}

export interface DatabaseSchema {
  rooms: Room[];
  users: RoomUser[];
  messages: ChatMessage[];
  reactions: Reaction[];
  ratings: Rating[];
}
