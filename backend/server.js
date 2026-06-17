import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import dbConnect from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';
import { validateEmailConfig } from './services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load backend/.env first, then root .env for fallback variables (like EMAIL_PASSWORD_ENV)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Run startup SMTP validation and fail fast if invalid
await validateEmailConfig();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Database Connection
try {
  await dbConnect();
  console.log('✓ MongoDB connected successfully');
} catch (error) {
  console.error('✗ MongoDB connection failed:', error.message || error);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/visit', visitRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running smoothly.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
