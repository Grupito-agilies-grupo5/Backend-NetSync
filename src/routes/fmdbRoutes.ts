// ============================================
// NetSync Backend - FM-DB Proxy Routes
// Proxy to Free Movie Database API to avoid CORS
// ============================================

import { Router, Request, Response } from 'express';

const router = Router();

const FMDB_BASE = 'https://imdb.iamidiotareyoutoo.com';

// Search movies
router.get('/fmdb/search', async (req: Request, res: Response) => {
  try {
    const { q, tt } = req.query;
    if (!q && !tt) {
      res.status(400).json({ error: 'At least one of q or tt is required' });
      return;
    }

    const params = new URLSearchParams();
    if (q) params.set('q', q as string);
    if (tt) params.set('tt', tt as string);

    const response = await fetch(`${FMDB_BASE}/search?${params.toString()}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error('[FM-DB] Search error:', err.message);
    res.status(500).json({ error: 'Failed to search FM-DB' });
  }
});

// Get movie details by IMDb ID
router.get('/fmdb/details/:tt', async (req: Request, res: Response) => {
  try {
    const { tt } = req.params;
    const response = await fetch(`${FMDB_BASE}/search?tt=${tt}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error('[FM-DB] Details error:', err.message);
    res.status(500).json({ error: 'Failed to get movie details' });
  }
});

// Proxy poster photo
router.get('/fmdb/photo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const w = req.query.w || 300;
    const h = req.query.h || 450;
    const response = await fetch(`${FMDB_BASE}/photo/${id}?w=${w}&h=${h}`);

    if (!response.ok) {
      res.status(response.status).json({ error: 'Photo not available' });
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[FM-DB] Photo error:', err.message);
    res.status(500).json({ error: 'Failed to get photo' });
  }
});

// Proxy trailer/media
router.get('/fmdb/media/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${FMDB_BASE}/media/${id}`);

    if (!response.ok) {
      res.status(response.status).json({ error: 'Media not available' });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error('[FM-DB] Media error:', err.message);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

export const fmdbRoutes = router;
