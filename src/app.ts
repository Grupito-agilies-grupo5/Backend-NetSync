// ============================================
// NetSync Backend - Express App Configuration
// ============================================

import express from 'express';
import cors from 'cors';
import { roomRoutes } from './routes/roomRoutes';
import { metricRoutes } from './routes/metricRoutes';
import { fmdbRoutes } from './routes/fmdbRoutes';
import { ollamaRoutes } from './routes/ollamaRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', roomRoutes);
app.use('/api', metricRoutes);
app.use('/api', fmdbRoutes);
app.use('/api', ollamaRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'NetSync API', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export default app;
