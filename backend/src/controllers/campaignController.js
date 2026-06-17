import Campaign from '../models/Campaign.js';
import Business from '../models/Business.js';
import CustomerCampaign from '../models/CustomerCampaign.js';
import crypto from 'crypto';

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
    obj.verificationCode = obj.loyaltyConfiguration.verificationCode;
  }
  obj.name = obj.businessName;
  return obj;
};

export const createCampaign = async (req, res) => {
  try {
    const { title, description, requiredStamps, rewardTitle, pointsPerCheckin, streakBonusMultiplier } = req.body;

    if (!title || !description || !requiredStamps || !rewardTitle) {
      return res.status(400).json({ error: 'Missing required campaign parameters' });
    }

    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(400).json({ error: 'Business profile not found' });
    }

    // Generate permanent join QR token
    const joinQrToken = crypto.randomBytes(16).toString('hex');

    const campaign = await Campaign.create({
      businessId: business._id,
      title,
      description,
      requiredStamps: parseInt(requiredStamps),
      rewardTitle,
      isActive: true,
      joinQrToken,
      pointsPerCheckin: parseInt(pointsPerCheckin) || 10,
      streakBonusMultiplier: parseFloat(streakBonusMultiplier) || 1
    });

    return res.status(201).json({ success: true, campaign });
  } catch (error) {
    console.error('Campaign Create API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(400).json({ error: 'Business profile not found' });
    }

    const campaigns = await Campaign.find({ businessId: business._id }).sort({ createdAt: -1 });
    
    // Enrich with enrollment counts
    const enriched = await Promise.all(campaigns.map(async (camp) => {
      const enrollmentCount = await CustomerCampaign.countDocuments({ campaignId: camp._id });
      const campObj = camp.toObject();
      campObj.enrollmentCount = enrollmentCount;
      return campObj;
    }));

    return res.json({ success: true, campaigns: enriched });
  } catch (error) {
    console.error('Campaign Get API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const business = await Business.findById(campaign.businessId);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const enrollmentCount = await CustomerCampaign.countDocuments({ campaignId: campaign._id });

    return res.json({ 
      success: true, 
      campaign, 
      business: formatBusinessForFE(business),
      enrollmentCount
    });
  } catch (error) {
    console.error('Campaign GetById API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
