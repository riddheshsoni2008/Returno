import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredStamps: { type: Number, default: 10, required: true },
  rewardTitle: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date },
  // Streak & points configuration
  pointsPerCheckin: { type: Number, default: 10 },
  streakBonusMultiplier: { type: Number, default: 1 },
  maxStreak: { type: Number, default: 30 },
  // Permanent join QR token
  joinQrToken: { type: String, sparse: true, index: true }
}, { timestamps: true });

const BusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  role: { type: String, default: 'business' },
  qrCode: { type: String },
  loyaltyConfiguration: {
    category: { type: String, default: 'Cafe' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [72.8777, 19.0760] }
    },
    geofenceRadius: { type: Number, default: 100 },
    verificationCode: { type: String, default: '1234' }
  },
  campaigns: [CampaignSchema],
  otp: {
    hashedCode: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date },
    requestCount: { type: Number, default: 0 },
    windowStart: { type: Date }
  }
}, { timestamps: true, versionKey: false });

// Indexes for performance
BusinessSchema.index({ 'loyaltyConfiguration.location': '2dsphere' });

export default mongoose.models.Business || mongoose.model('Business', BusinessSchema);
