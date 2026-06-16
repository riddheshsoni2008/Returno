import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  logoUrl: { type: String },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  geofenceRadius: { type: Number, default: 100 }, // in meters
  verificationCode: { type: String, required: true, default: '1234' } // 4-digit code for quick pin verification
}, { timestamps: true, versionKey: false });

// Add 2dsphere index for geolocation distance queries
BusinessSchema.index({ location: '2dsphere' });

export default mongoose.models.Business || mongoose.model('Business', BusinessSchema);
