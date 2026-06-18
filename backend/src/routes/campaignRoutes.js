import express from 'express';
import { createCampaign, getCampaigns, getCampaignById, deleteCampaign } from '../controllers/campaignController.js';
import { joinCampaign } from '../controllers/checkinController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCampaigns)
  .post(protect, createCampaign);

router.get('/public/:id', getCampaignById);

router.route('/:id')
  .get(getCampaignById) // Public endpoint
  .delete(protect, deleteCampaign);

router.post('/:id/join', protect, joinCampaign);

export default router;
