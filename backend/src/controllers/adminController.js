import Customer from '../models/Customer.js';
import Business from '../models/Business.js';
import Checkin from '../models/Checkin.js';
import AuditLog from '../models/AuditLog.js';

export const getAdminMetrics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const totalShops = await Business.countDocuments();
    const totalCustomers = await Customer.countDocuments({ role: 'customer' });
    
    // Checkins represents both visit stamps and dynamic checkins now
    const totalStamps = await Checkin.countDocuments();

    // Aggregate redeemed rewards across all customers
    const totalRedeemedAgg = await Customer.aggregate([
      { $unwind: "$joinedCampaigns" },
      { $unwind: "$joinedCampaigns.rewards" },
      { $match: { "joinedCampaigns.rewards.status": "redeemed" } },
      { $count: "count" }
    ]);
    const totalRedeemed = totalRedeemedAgg[0]?.count || 0;

    const recentShops = await Business.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const securityLogs = await AuditLog.find()
      .populate('actorId', 'name businessName ownerName email')
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
