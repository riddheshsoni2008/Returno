import mongoose from 'mongoose';

const CustomerRewardSchema = new mongoose.Schema({
  rewardTitle: { type: String, required: true },
  status: { type: String, enum: ['unredeemed', 'pending', 'redeemed'], default: 'unredeemed' },
  unlockedAt: { type: Date, default: Date.now },
  redeemedAt: { type: Date }
}, { timestamps: true });

const JoinedCampaignSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  campaignName: { type: String },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  totalCheckins: { type: Number, default: 0 },
  lastCheckinDate: { type: Date, default: null },
  joinedAt: { type: Date, default: Date.now },
  rewards: [CustomerRewardSchema]
});

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String },
  role: { type: String, default: 'customer' },
  loyaltyData: {
    points: { type: Number, default: 0 }
  },
  joinedCampaigns: [JoinedCampaignSchema],
  otp: {
    hashedCode: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date },
    requestCount: { type: Number, default: 0 },
    windowStart: { type: Date }
  }
}, { timestamps: true, versionKey: false });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
