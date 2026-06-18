import express from 'express';
import { createCampaign, getCampaigns, getCampaignById, deleteCampaign } from '../controllers/campaignController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCampaigns)
  .post(protect, createCampaign);

router.route('/:id')
  .get(getCampaignById) // Public endpoint
  .delete(protect, deleteCampaign);

export default router;
