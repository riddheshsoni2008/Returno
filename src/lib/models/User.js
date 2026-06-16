import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, index: true },
  role: { type: String, enum: ['admin', 'business', 'customer'], default: 'customer' },
    passwordHash: { type: String },
  otp: {
    hashedCode: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date },
    requestCount: { type: Number, default: 0 },
    windowStart: { type: Date }
  }
}, { timestamps: true, versionKey: false });

export default mongoose.models.User || mongoose.model('User', UserSchema);
