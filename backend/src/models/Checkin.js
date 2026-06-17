import mongoose from 'mongoose';

const CheckinSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  qrSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QrSession', required: true },
  pointsAwarded: { type: Number, required: true },
  streakAtCheckin: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }
  }
}, { timestamps: true, versionKey: false });

// Enforce one check-in per customer per campaign per calendar day
CheckinSchema.index({ customerId: 1, campaignId: 1, createdAt: 1 });

export default mongoose.models.Checkin || mongoose.model('Checkin', CheckinSchema);
