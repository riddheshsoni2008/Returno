import express from 'express';
import { getBusiness, updateBusiness, getMetrics } from '../controllers/businessController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getBusiness)
  .post(protect, updateBusiness);

router.get('/metrics', protect, getMetrics);

export default router;
