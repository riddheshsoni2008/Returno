import express from 'express';
import { createCampaign, getCampaigns, getCampaignById } from '../controllers/campaignController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCampaigns)
  .post(protect, createCampaign);

router.get('/:id', getCampaignById); // Public endpoint

export default router;
