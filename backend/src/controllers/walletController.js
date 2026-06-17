import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import Visit from '../models/Visit.js';
import Reward from '../models/Reward.js';

export const getWalletData = async (req, res) => {
  try {
    const user = await Customer.findById(req.user.id).select('-otp');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activeCampaigns = await Campaign.find({ isActive: true }).populate('businessId');
    
    const walletCards = [];
    for (const camp of activeCampaigns) {
      if (!camp.businessId) continue;
      
      const stampCount = await Visit.countDocuments({ customerId: user._id, campaignId: camp._id });
      if (stampCount > 0) {
        const target = camp.requiredStamps;
        const formattedCampaign = camp.toObject();
        if (formattedCampaign.businessId) {
          const biz = formattedCampaign.businessId;
          biz.name = biz.businessName; // Map businessName to name for frontend display
          if (biz.loyaltyConfiguration) {
            biz.category = biz.loyaltyConfiguration.category;
            biz.address = biz.loyaltyConfiguration.address;
            biz.location = biz.loyaltyConfiguration.location;
            biz.geofenceRadius = biz.loyaltyConfiguration.geofenceRadius;
            biz.verificationCode = biz.loyaltyConfiguration.verificationCode;
          }
        }

        walletCards.push({
          campaign: formattedCampaign,
          currentStamps: stampCount % target === 0 ? 0 : stampCount % target,
          totalEarned: stampCount
        });
      }
    }

    const rewards = await Reward.find({ customerId: user._id }).sort({ createdAt: -1 });

    return res.json({ success: true, user, walletCards, rewards });
  } catch (error) {
    console.error('Wallet Get API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
