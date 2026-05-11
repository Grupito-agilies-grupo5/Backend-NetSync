// ============================================
// NetSync Backend - Ollama AI Controller
// ============================================

import { Request, Response } from 'express';
import { chatWithOllama } from '../services/ollamaService';

/**
 * POST /api/ai/recommend
 * Streams AI-generated movie recommendations based on dashboard data.
 * Sends heartbeats during the thinking phase to keep the connection alive.
 */
export async function recommend(req: Request, res: Response): Promise<void> {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Se requiere un mensaje para obtener recomendaciones.' });
    return;
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Track if client disconnected
  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
    clearInterval(heartbeat);
  });

  // Send heartbeats every 5s to keep connection alive during thinking
  const heartbeat = setInterval(() => {
    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ heartbeat: true })}\n\n`);
    }
  }, 5000);

  try {
    await chatWithOllama(message.trim(), {
      onThinking: () => {
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ thinking: true })}\n\n`);
        }
      },
      onToken: (token: string) => {
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      },
      onDone: () => {
        clearInterval(heartbeat);
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        }
      },
      onError: (error: string) => {
        clearInterval(heartbeat);
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ error })}\n\n`);
          res.end();
        }
      },
    });
  } catch (err: any) {
    clearInterval(heartbeat);
    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}
