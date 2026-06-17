import mongoose from 'mongoose';

const QrCodeSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  qrType: { type: String, enum: ['static', 'dynamic'], default: 'static' },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date }
}, { timestamps: true, versionKey: false });

export default mongoose.models.QrCode || mongoose.model('QrCode', QrCodeSchema);
