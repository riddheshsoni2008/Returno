import mongoose from 'mongoose';

const RewardSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  rewardTitle: { type: String, required: true },
  status: { type: String, enum: ['unredeemed', 'pending', 'redeemed'], default: 'unredeemed', index: true },
  unlockedAt: { type: Date, default: Date.now },
  redeemedAt: { type: Date }
}, { timestamps: true, versionKey: false });

export default mongoose.models.Reward || mongoose.model('Reward', RewardSchema);
