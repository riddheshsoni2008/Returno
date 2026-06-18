import Customer from '../models/Customer.js';
import Business from '../models/Business.js';

// Helper to format business object for the frontend expectations
const formatBusinessForFE = (business) => {
  if (!business) return null;
  const obj = business.toObject ? business.toObject() : { ...business };
  if (obj.loyaltyConfiguration) {
    obj.category = obj.loyaltyConfiguration.category;
    obj.address = obj.loyaltyConfiguration.address;
    obj.city = obj.loyaltyConfiguration.city || '';
    obj.state = obj.loyaltyConfiguration.state || '';
    obj.location = obj.loyaltyConfiguration.location;
    obj.geofenceRadius = obj.loyaltyConfiguration.geofenceRadius;
  }
  obj.name = obj.businessName;
  return obj;
};

export const getCustomerCampaignProgress = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { campaignId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const enrollment = customer.joinedCampaigns.find(
      (c) => c.campaignId.toString() === campaignId
    );

    if (!enrollment) {
      return res.json({ success: true, joined: false });
    }

    const business = await Business.findOne({ "campaigns._id": campaignId });
    if (!business) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = business.campaigns.id(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const target = campaign.requiredStamps;
    return res.json({
      success: true,
      joined: true,
      enrollment: {
        campaignId: campaign._id,
        currentStamps: enrollment.totalCheckins % target === 0 && enrollment.totalCheckins > 0 ? target : enrollment.totalCheckins % target,
        totalEarned: enrollment.totalCheckins,
        currentStreak: enrollment.currentStreak,
        longestStreak: enrollment.longestStreak,
        totalPoints: enrollment.totalPoints,
        totalCheckins: enrollment.totalCheckins,
        lastCheckinDate: enrollment.lastCheckinDate,
        rewards: enrollment.rewards
      },
      campaign,
      business: formatBusinessForFE(business)
    });
  } catch (error) {
    console.error('Get Customer Campaign Progress Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
