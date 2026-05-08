// ============================================
// NetSync Backend - Room Routes
// ============================================

import { Router } from 'express';
import * as roomController from '../controllers/roomController';

const router = Router();

// Create a new room
router.post('/rooms', roomController.createRoom);

// Get room by ID
router.get('/rooms/:id', roomController.getRoom);

// Join a room (validates room exists)
router.post('/rooms/:id/join', roomController.joinRoom);

// Add a rating to a room
router.post('/rooms/:id/rating', roomController.addRating);

// Get content catalog
router.get('/content', roomController.getContent);

export const roomRoutes = router;
