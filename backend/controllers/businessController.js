import Business from '../models/Business.js';
import Campaign from '../models/Campaign.js';
import Visit from '../models/Visit.js';
import Reward from '../models/Reward.js';

export const getBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    return res.json({ success: true, business });
  } catch (error) {
    console.error('Business Get API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const { name, category, address, longitude, latitude, geofenceRadius, verificationCode } = req.body;

    let business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    if (name) business.name = name;
    if (category) business.category = category;
    if (address) business.address = address;
    if (verificationCode) business.verificationCode = verificationCode.trim().slice(0, 4);
    if (geofenceRadius) business.geofenceRadius = parseInt(geofenceRadius);
    
    if (longitude !== undefined && latitude !== undefined) {
      business.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    await business.save();
    return res.json({ success: true, business });
  } catch (error) {
    console.error('Business Save API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMetrics = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const campaigns = await Campaign.find({ businessId: business._id });
    const campaignIds = campaigns.map(c => c._id);

    const totalStamps = await Visit.countDocuments({ campaignId: { $in: campaignIds } });
    const uniqueCustomers = await Visit.distinct('customerId', { campaignId: { $in: campaignIds } });
    const openRewardsCount = await Reward.countDocuments({ campaignId: { $in: campaignIds }, status: 'unredeemed' });
    const pendingRedemptions = await Reward.find({ campaignId: { $in: campaignIds }, status: 'pending' })
      .populate('customerId', 'name phone')
      .sort({ updatedAt: -1 });

    const recentStamps = await Visit.find({ campaignId: { $in: campaignIds } })
      .populate('customerId', 'name phone')
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
