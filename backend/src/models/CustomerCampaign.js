import mongoose from 'mongoose';

const CustomerCampaignSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  totalCheckins: { type: Number, default: 0 },
  lastCheckinDate: { type: Date, default: null },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });

// One enrollment per customer per campaign
CustomerCampaignSchema.index({ customerId: 1, campaignId: 1 }, { unique: true });

export default mongoose.models.CustomerCampaign || mongoose.model('CustomerCampaign', CustomerCampaignSchema);
