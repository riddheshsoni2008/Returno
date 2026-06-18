import Business from '../models/Business.js';
import Customer from '../models/Customer.js';
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

    const newCampaign = {
      title,
      description,
      requiredStamps: parseInt(requiredStamps),
      rewardTitle,
      isActive: true,
      joinQrToken,
      pointsPerCheckin: parseInt(pointsPerCheckin) || 10,
      streakBonusMultiplier: parseFloat(streakBonusMultiplier) || 1
    };

    business.campaigns.push(newCampaign);
    await business.save();

    // Get the created campaign with its generated _id
    const campaign = business.campaigns[business.campaigns.length - 1];

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

    const campaigns = business.campaigns || [];
    
    // Enrich with enrollment counts
    const enriched = await Promise.all(campaigns.map(async (camp) => {
      const enrollmentCount = await Customer.countDocuments({ "joinedCampaigns.campaignId": camp._id });
      const campObj = camp.toObject();
      campObj.enrollmentCount = enrollmentCount;
      return campObj;
    }));

    // Sort by createdAt descending
    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, campaigns: enriched });
  } catch (error) {
    console.error('Campaign Get API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    // Find the business that contains the campaign
    const business = await Business.findOne({ "campaigns._id": campaignId });
    if (!business) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = business.campaigns.id(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const enrollmentCount = await Customer.countDocuments({ "joinedCampaigns.campaignId": campaign._id });

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

export const deleteCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const campaign = business.campaigns.id(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Pull campaign from subdocument array
    business.campaigns.pull(campaignId);
    await business.save();

    return res.json({ success: true, message: 'Campaign successfully deleted' });
  } catch (error) {
    console.error('Campaign Delete API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
