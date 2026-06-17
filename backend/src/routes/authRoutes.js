import express from 'express';
import {
  register,
  login,
  googleAuth,
  sendOtp,
  verifyOtp,
  me,
  logout
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.get('/me', me);
router.post('/me', logout); // The frontend calls POST /api/auth/me to logout

export default router;
