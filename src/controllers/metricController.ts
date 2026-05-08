// ============================================
// NetSync Backend - Metrics Controller
// ============================================

import { Request, Response } from 'express';
import * as metricService from '../services/metricService';

export function getMetrics(_req: Request, res: Response): void {
  try {
    const metrics = metricService.getMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
