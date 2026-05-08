// ============================================
// NetSync Backend - Server Entry Point
// ============================================

import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupSocketHandlers } from './sockets/roomSocket';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║          🎬 NetSync Server               ║');
  console.log(`║   Running on http://localhost:${PORT}       ║`);
  console.log('║   Socket.IO ready for connections        ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
