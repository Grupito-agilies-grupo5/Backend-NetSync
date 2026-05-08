// ============================================
// NetSync Backend - Room Controller
// ============================================

import { Request, Response } from 'express';
import * as roomService from '../services/roomService';

export function createRoom(req: Request, res: Response): void {
  try {
    const { contentId, hostName, contentTitle, imdbId, posterUrl } = req.body;

    if (!hostName) {
      res.status(400).json({ error: 'hostName is required' });
      return;
    }

    if (hostName.trim().length < 2) {
      res.status(400).json({ error: 'hostName must be at least 2 characters' });
      return;
    }

    // Support both catalog content and FM-DB movies
    if (contentId) {
      const room = roomService.createRoom(contentId, hostName.trim());
      res.status(201).json(room);
    } else if (contentTitle && imdbId) {
      const room = roomService.createRoomCustom(contentTitle, imdbId, hostName.trim(), posterUrl);
      res.status(201).json(room);
    } else {
      res.status(400).json({ error: 'contentId or (contentTitle + imdbId) are required' });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export function getRoom(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const room = roomService.getRoomById(id);

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const users = roomService.getUsersInRoom(id);
    res.json({ ...room, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export function joinRoom(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { userName } = req.body;

    if (!userName) {
      res.status(400).json({ error: 'userName is required' });
      return;
    }

    // id can be a room ID or a room code
    let room = roomService.getRoomById(id);
    if (!room) {
      room = roomService.getRoomByCode(id);
    }

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    if (room.status === 'ended') {
      res.status(400).json({ error: 'Room has ended' });
      return;
    }

    res.json(room);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export function addRating(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { userId, userName, score, comment } = req.body;

    if (!userName || !score) {
      res.status(400).json({ error: 'userName and score are required' });
      return;
    }

    if (score < 1 || score > 5) {
      res.status(400).json({ error: 'Score must be between 1 and 5' });
      return;
    }

    const rating = roomService.addRating(id, userId || 'anonymous', userName, score, comment);
    res.status(201).json(rating);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export function getContent(_req: Request, res: Response): void {
  try {
    const content = roomService.getContent();
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
