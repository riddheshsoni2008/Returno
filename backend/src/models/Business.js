import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  role: { type: String, default: 'business' },
  qrCode: { type: String },
  loyaltyConfiguration: {
    category: { type: String, default: 'Cafe' },
    address: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [72.8777, 19.0760] } // [longitude, latitude]
    },
    geofenceRadius: { type: Number, default: 100 }, // in meters
    verificationCode: { type: String, default: '1234' } // 4-digit code for quick pin verification
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

// Add 2dsphere index on the location inside loyaltyConfiguration
BusinessSchema.index({ 'loyaltyConfiguration.location': '2dsphere' });

export default mongoose.models.Business || mongoose.model('Business', BusinessSchema);
