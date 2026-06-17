import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'actorType' },
  actorType: { type: String, required: true, enum: ['Customer', 'Business'] },
  action: { type: String, required: true },
  details: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info', index: true }
}, { timestamps: true, versionKey: false });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
