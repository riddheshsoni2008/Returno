import express from 'express';
import { requestRedeem, approveRedeem } from '../controllers/rewardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/redeem', protect, requestRedeem);
router.post('/approve', protect, approveRedeem);

export default router;
