import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredStamps: { type: Number, default: 10, required: true },
  rewardTitle: { type: String, required: true },
  isActive: { type: Boolean, default: true, index: true },
  expiryDate: { type: Date }
}, { timestamps: true, versionKey: false });

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
