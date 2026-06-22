import express from 'express';
import { joinCampaign, validateCheckin, getCheckinHistory, getStreakInfo, restartCampaign } from '../controllers/checkinController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/join/:campaignId', protect, joinCampaign);
router.post('/validate', protect, validateCheckin);
router.get('/history/:campaignId', protect, getCheckinHistory);
router.get('/streak/:campaignId', protect, getStreakInfo);
router.post('/restart/:campaignId', protect, restartCampaign);

export default router;
