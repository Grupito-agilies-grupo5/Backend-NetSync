// ============================================
// NetSync Backend - Metrics Routes
// ============================================

import { Router } from 'express';
import * as metricController from '../controllers/metricController';

const router = Router();

// Get dashboard metrics
router.get('/metrics', metricController.getMetrics);

export const metricRoutes = router;
