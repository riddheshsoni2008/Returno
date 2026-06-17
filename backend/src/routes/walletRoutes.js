import express from 'express';
import { getWalletData } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWalletData);

export default router;
