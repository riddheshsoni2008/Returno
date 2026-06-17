import User from '../models/User.js';
import Business from '../models/Business.js';
import Visit from '../models/Visit.js';
import Reward from '../models/Reward.js';
import AuditLog from '../models/AuditLog.js';

export const getAdminMetrics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const totalShops = await Business.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalStamps = await Visit.countDocuments();
    const totalRedeemed = await Reward.countDocuments({ status: 'redeemed' });

    const recentShops = await Business.find()
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const securityLogs = await AuditLog.find()
      .populate('actorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      metrics: {
        totalShops,
        totalCustomers,
        totalStamps,
        totalRedeemed,
        recentShops,
        securityLogs
      }
    });
  } catch (error) {
    console.error('Admin Metrics API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
