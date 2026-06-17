import express from 'express';
import { stampVisit } from '../controllers/visitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/stamp', protect, stampVisit);

export default router;
