import express from 'express';
import { 
  generateQrSession, 
  generateBulkQrSessions, 
  getActiveQrSession, 
  getCampaignQrStats,
  getActiveBulkSessions,
  deleteUnusedBulkSessions
} from '../controllers/qrSessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, generateQrSession);
router.post('/generate-bulk', protect, generateBulkQrSessions);
router.get('/active/:campaignId', protect, getActiveQrSession);
router.get('/stats/:campaignId', protect, getCampaignQrStats);
router.get('/bulk/:campaignId', protect, getActiveBulkSessions);
router.delete('/bulk/:campaignId', protect, deleteUnusedBulkSessions);

export default router;
