import Customer from '../models/Customer.js';
import Business from '../models/Business.js';
import Checkin from '../models/Checkin.js';

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

    const enrollments = user.joinedCampaigns || [];

    // Get all businesses with active campaigns
    const businesses = await Business.find({ "campaigns.isActive": true });
    
    // Flatten and format active campaigns with populated business info
    const activeCampaigns = [];
    for (const biz of businesses) {
      for (const camp of biz.campaigns) {
        if (camp.isActive) {
          const campObj = camp.toObject();
          
          // Enrich businessId object for the frontend expectations
          const bizObj = biz.toObject();
          bizObj.name = bizObj.businessName;
          if (bizObj.loyaltyConfiguration) {
            bizObj.category = bizObj.loyaltyConfiguration.category;
            bizObj.address = bizObj.loyaltyConfiguration.address;
            bizObj.city = bizObj.loyaltyConfiguration.city || '';
            bizObj.state = bizObj.loyaltyConfiguration.state || '';
            bizObj.location = bizObj.loyaltyConfiguration.location;
            bizObj.geofenceRadius = bizObj.loyaltyConfiguration.geofenceRadius;
          }
          
          campObj.businessId = bizObj;
          activeCampaigns.push(campObj);
        }
      }
    }
    
    const walletCards = [];
    const exploreCampaigns = [];

    for (const camp of activeCampaigns) {
      const enrollment = enrollments.find(e => e.campaignId.toString() === camp._id.toString());
      
      if (enrollment) {
        const target = camp.requiredStamps;
        const streakActive = isStreakActive(enrollment.lastCheckinDate);
        
        walletCards.push({
          campaign: camp,
          currentStamps: enrollment.totalCheckins % target === 0 && enrollment.totalCheckins > 0 ? target : enrollment.totalCheckins % target,
          totalEarned: enrollment.totalCheckins,
          currentStreak: streakActive ? enrollment.currentStreak : 0,
          longestStreak: enrollment.longestStreak,
          totalPoints: enrollment.totalPoints,
          totalCheckins: enrollment.totalCheckins,
          lastCheckinDate: enrollment.lastCheckinDate,
          streakActive
        });
      } else {
        exploreCampaigns.push({
          campaign: camp,
          currentStamps: 0,
          totalEarned: 0
        });
      }
    }

    // Extract rewards from joined campaigns
    const rewards = [];
    for (const enrollment of enrollments) {
      for (const r of enrollment.rewards) {
        const rewardObj = r.toObject();
        rewardObj.campaignId = enrollment.campaignId;
        rewards.push(rewardObj);
      }
    }
    // Sort rewards by unlockedAt descending
    rewards.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));

    // Recent check-in history (last 10 across all campaigns)
    const recentCheckins = await Checkin.find({ customerId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Populate campaign info manually for checkins
    const enrichedCheckins = [];
    for (const checkin of recentCheckins) {
      const checkinObj = checkin.toObject();
      const biz = await Business.findOne({ "campaigns._id": checkin.campaignId });
      if (biz) {
        const camp = biz.campaigns.id(checkin.campaignId);
        if (camp) {
          checkinObj.campaignId = {
            _id: camp._id,
            title: camp.title,
            rewardTitle: camp.rewardTitle
          };
        }
      }
      enrichedCheckins.push(checkinObj);
    }

    return res.json({ success: true, user, walletCards, exploreCampaigns, rewards, recentCheckins: enrichedCheckins });
  } catch (error) {
    console.error('Wallet Get API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
