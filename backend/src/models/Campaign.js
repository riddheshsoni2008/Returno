import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredStamps: { type: Number, default: 10, required: true },
  rewardTitle: { type: String, required: true },
  isActive: { type: Boolean, default: true, index: true },
  expiryDate: { type: Date },
  // Streak & points configuration
  pointsPerCheckin: { type: Number, default: 10 },
  streakBonusMultiplier: { type: Number, default: 1 },
  maxStreak: { type: Number, default: 30 },
  // Permanent join QR token (generated once on campaign creation)
  joinQrToken: { type: String, unique: true, sparse: true }
}, { timestamps: true, versionKey: false });

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
