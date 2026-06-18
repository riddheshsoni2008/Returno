import mongoose from 'mongoose';

const CheckinSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // refers to business.campaigns._id
  qrSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QrSession' }, // optional for visit stamp
  billNumber: { type: String }, // optional, from merged Visit model
  amount: { type: Number }, // optional, from merged Visit model
  pointsAwarded: { type: Number, required: true },
  streakAtCheckin: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }
  }
}, { timestamps: true, versionKey: false });

// Indexes for fast querying
CheckinSchema.index({ customerId: 1, campaignId: 1, createdAt: -1 });
CheckinSchema.index({ businessId: 1, createdAt: -1 });

// Prevent duplicate bill claims on the same campaign (only when billNumber exists)
CheckinSchema.index(
  { campaignId: 1, billNumber: 1 },
  { unique: true, partialFilterExpression: { billNumber: { $exists: true } } }
);

export default mongoose.models.Checkin || mongoose.model('Checkin', CheckinSchema);
