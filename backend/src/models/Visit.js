import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  billNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }
  }
}, { timestamps: true, versionKey: false });

VisitSchema.index({ campaignId: 1, billNumber: 1 }, { unique: true });

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);
