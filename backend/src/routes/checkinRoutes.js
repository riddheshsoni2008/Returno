import express from 'express';
import { joinCampaign, validateCheckin, getCheckinHistory, getStreakInfo } from '../controllers/checkinController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/join/:campaignId', protect, joinCampaign);
router.post('/validate', protect, validateCheckin);
router.get('/history/:campaignId', protect, getCheckinHistory);
router.get('/streak/:campaignId', protect, getStreakInfo);

export default router;
