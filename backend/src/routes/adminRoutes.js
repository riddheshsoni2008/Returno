import express from 'express';
import { getAdminMetrics } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/metrics', protect, getAdminMetrics);

export default router;
