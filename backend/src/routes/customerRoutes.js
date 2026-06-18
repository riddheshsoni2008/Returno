import express from 'express';
import { getCustomerCampaignProgress } from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me/campaigns/:campaignId', protect, getCustomerCampaignProgress);

export default router;
