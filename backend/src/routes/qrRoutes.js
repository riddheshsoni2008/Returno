import express from 'express';
import { generateQrSession, getActiveQrSession, getCampaignQrStats } from '../controllers/qrSessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, generateQrSession);
router.get('/active/:campaignId', protect, getActiveQrSession);
router.get('/stats/:campaignId', protect, getCampaignQrStats);

export default router;
