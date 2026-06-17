import Business from '../models/Business.js';
import Campaign from '../models/Campaign.js';
import Visit from '../models/Visit.js';
import Reward from '../models/Reward.js';

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
  obj.name = obj.businessName; // Map businessName to name
  return obj;
};

export const getBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    return res.json({ success: true, business: formatBusinessForFE(business) });
  } catch (error) {
    console.error('Business Get API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const { name, category, address, city, state, geofenceRadius, longitude, latitude } = req.body;

    let business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    if (name) business.businessName = name;
    
    if (!business.loyaltyConfiguration) {
      business.loyaltyConfiguration = {};
    }
    
    if (category) business.loyaltyConfiguration.category = category;
    if (address) business.loyaltyConfiguration.address = address;
    if (city !== undefined) business.loyaltyConfiguration.city = city.trim();
    if (state !== undefined) business.loyaltyConfiguration.state = state.trim();
    if (geofenceRadius !== undefined) business.loyaltyConfiguration.geofenceRadius = parseInt(geofenceRadius);

    if (longitude !== undefined && latitude !== undefined) {
      business.loyaltyConfiguration.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    await business.save();
    return res.json({ success: true, business: formatBusinessForFE(business) });
  } catch (error) {
    console.error('Business Save API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMetrics = async (req, res) => {
  try {
    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const campaigns = await Campaign.find({ businessId: business._id });
    const campaignIds = campaigns.map(c => c._id);

    const totalStamps = await Visit.countDocuments({ campaignId: { $in: campaignIds } });
    const uniqueCustomers = await Visit.distinct('customerId', { campaignId: { $in: campaignIds } });
    const openRewardsCount = await Reward.countDocuments({ campaignId: { $in: campaignIds }, status: 'unredeemed' });
    const pendingRedemptions = await Reward.find({ campaignId: { $in: campaignIds }, status: 'pending' })
      .populate('customerId', 'name email')
      .sort({ updatedAt: -1 });

    const recentStamps = await Visit.find({ campaignId: { $in: campaignIds } })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      metrics: {
        totalStamps,
        uniqueCustomers: uniqueCustomers.length,
        openRewardsCount,
        pendingRedemptions,
        recentStamps
      }
    });
  } catch (error) {
    console.error('Business Metrics API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
