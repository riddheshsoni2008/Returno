import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  role: { type: String, default: 'customer' },
  loyaltyData: {
    points: { type: Number, default: 0 }
  },
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
