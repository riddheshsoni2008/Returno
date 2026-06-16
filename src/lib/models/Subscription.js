import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  plan: { type: String, enum: ['trial', 'starter', 'growth', 'enterprise'], default: 'trial' },
  status: { type: String, enum: ['active', 'suspended', 'canceled'], default: 'active' },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true },
  razorpaySubscriptionId: { type: String }
}, { timestamps: true, versionKey: false });

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
