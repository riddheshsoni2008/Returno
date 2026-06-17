import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import CustomerCampaign from '../models/CustomerCampaign.js';
import Checkin from '../models/Checkin.js';
import Reward from '../models/Reward.js';

// Helper: check if streak is still active
const isStreakActive = (lastCheckinDate) => {
  if (!lastCheckinDate) return false;
  const now = new Date();
  const toIST = (d) => {
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 5.5 * 3600000);
  };
  const lastIST = toIST(lastCheckinDate);
  const nowIST = toIST(now);
  
  const lastMidnight = new Date(lastIST.getFullYear(), lastIST.getMonth(), lastIST.getDate());
  const nowMidnight = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
  const diffDays = (nowMidnight - lastMidnight) / 86400000;
  
  return diffDays <= 1; // today or yesterday
};

export const getWalletData = async (req, res) => {
  try {
    const user = await Customer.findById(req.user.id).select('-otp');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all customer's enrollments
    const enrollments = await CustomerCampaign.find({ customerId: user._id });
    const enrolledCampaignIds = enrollments.map(e => e.campaignId.toString());

    // Get all active campaigns with business info
    const activeCampaigns = await Campaign.find({ isActive: true }).populate('businessId');
    
    const walletCards = [];
    const exploreCampaigns = [];

    for (const camp of activeCampaigns) {
      if (!camp.businessId) continue;
      
      const formattedCampaign = camp.toObject();
      if (formattedCampaign.businessId) {
        const biz = formattedCampaign.businessId;
        biz.name = biz.businessName;
        if (biz.loyaltyConfiguration) {
          biz.category = biz.loyaltyConfiguration.category;
          biz.address = biz.loyaltyConfiguration.address;
          biz.city = biz.loyaltyConfiguration.city || '';
          biz.state = biz.loyaltyConfiguration.state || '';
          biz.location = biz.loyaltyConfiguration.location;
          biz.geofenceRadius = biz.loyaltyConfiguration.geofenceRadius;
        }
      }

      const enrollment = enrollments.find(e => e.campaignId.toString() === camp._id.toString());
      
      if (enrollment) {
        const target = camp.requiredStamps;
        const streakActive = isStreakActive(enrollment.lastCheckinDate);
        
        walletCards.push({
          campaign: formattedCampaign,
          currentStamps: enrollment.totalCheckins % target === 0 && enrollment.totalCheckins > 0 ? target : enrollment.totalCheckins % target,
          totalEarned: enrollment.totalCheckins,
          // Streak data
          currentStreak: streakActive ? enrollment.currentStreak : 0,
          longestStreak: enrollment.longestStreak,
          totalPoints: enrollment.totalPoints,
          totalCheckins: enrollment.totalCheckins,
          lastCheckinDate: enrollment.lastCheckinDate,
          streakActive
        });
      } else {
        exploreCampaigns.push({
          campaign: formattedCampaign,
          currentStamps: 0,
          totalEarned: 0
        });
      }
    }

    const rewards = await Reward.find({ customerId: user._id }).sort({ createdAt: -1 });

    // Recent check-in history (last 10 across all campaigns)
    const recentCheckins = await Checkin.find({ customerId: user._id })
      .populate('campaignId', 'title rewardTitle')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({ success: true, user, walletCards, exploreCampaigns, rewards, recentCheckins });
  } catch (error) {
    console.error('Wallet Get API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
