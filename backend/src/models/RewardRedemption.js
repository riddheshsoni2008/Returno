import mongoose from 'mongoose';

const RewardRedemptionSchema = new mongoose.Schema({
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  confirmedByOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  redeemedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });

export default mongoose.models.RewardRedemption || mongoose.model('RewardRedemption', RewardRedemptionSchema);
