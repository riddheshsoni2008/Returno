import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  billNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
    }, { timestamps: true, versionKey: false });

// Strict unique constraint: a single bill number can only be claimed once per campaign
VisitSchema.index({ campaignId: 1, billNumber: 1 }, { unique: true });

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);
