import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true }
}, { timestamps: true, versionKey: false });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
