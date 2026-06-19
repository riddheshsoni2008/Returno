import mongoose from 'mongoose';

const QrSessionSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
  isExpired: { type: Boolean, default: false },
  // 'dynamic' = rotating 60s QR shown on merchant screen
  // 'bulk' = pre-generated single-use printed QRs — NEVER auto-deleted
  type: { type: String, enum: ['dynamic', 'bulk'], default: 'dynamic', index: true }
}, { timestamps: true, versionKey: false });

// TTL index: MongoDB automatically deletes documents 5 minutes after expiry
QrSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 300 });

export default mongoose.models.QrSession || mongoose.model('QrSession', QrSessionSchema);
