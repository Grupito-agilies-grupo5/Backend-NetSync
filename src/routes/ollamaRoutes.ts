// ============================================
// NetSync Backend - Ollama AI Routes
// ============================================

import { Router } from 'express';
import * as ollamaController from '../controllers/ollamaController';

const router = Router();

// AI-powered movie recommendations
router.post('/ai/recommend', ollamaController.recommend);

export const ollamaRoutes = router;
