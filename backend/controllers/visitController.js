import User from '../models/User.js';
import Business from '../models/Business.js';
import Campaign from '../models/Campaign.js';
import Visit from '../models/Visit.js';
import Reward from '../models/Reward.js';
import AuditLog from '../models/AuditLog.js';

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const stampVisit = async (req, res) => {
  try {
    const { campaignId, billNumber, amount, lat, lng, deviceFingerprint } = req.body;
    
    if (!campaignId || !billNumber || !amount) {
      return res.status(400).json({ error: 'Missing stamp request parameters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ error: 'Campaign is inactive or does not exist' });
    }

    const business = await Business.findById(campaign.businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const clientIp = req.ip || '127.0.0.1';
    const cleanedBillNumber = billNumber.trim().toUpperCase();
    
    const existingBillClaim = await Visit.findOne({ campaignId, billNumber: cleanedBillNumber });
    if (existingBillClaim) {
      await AuditLog.create({
        actorId: user._id,
        action: 'STAMP_CLAIM_FAILED_DUPLICATE_BILL',
        details: `Duplicate bill claim attempted: ${cleanedBillNumber} for Campaign ID: ${campaignId}`,
        ipAddress: clientIp,
        deviceFingerprint,
        severity: 'warning'
      });
      return res.status(400).json({ error: 'This bill number has already been used to claim a stamp.' });
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Location verification is required to award stamps.' });
    }

    const shopLng = business.location.coordinates[0];
    const shopLat = business.location.coordinates[1];
    const distance = getDistance(parseFloat(lat), parseFloat(lng), shopLat, shopLng);

    if (distance > business.geofenceRadius) {
      await AuditLog.create({
        actorId: user._id,
        action: 'STAMP_CLAIM_FAILED_GEOFENCE',
        details: `Geofence check failed. Customer coordinate: [${lat}, ${lng}]. Shop coordinate: [${shopLat}, ${shopLng}]. Distance: ${distance.toFixed(1)}m. Limit: ${business.geofenceRadius}m.`,
        ipAddress: clientIp,
        deviceFingerprint,
        severity: 'critical'
      });
      return res.status(400).json({
        error: `Location check failed. You must scan within ${business.geofenceRadius}m of the counter. Current: ${distance.toFixed(0)}m.`
      });
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentVisit = await Visit.findOne({
      customerId: user._id,
      campaignId,
      createdAt: { $gte: fiveMinsAgo }
    });

    if (recentVisit) {
      return res.status(429).json({
        error: 'Scan rate limit exceeded. Please wait 5 minutes between loyalty claims.'
      });
    }

    const visit = await Visit.create({
      customerId: user._id,
      campaignId,
      billNumber: cleanedBillNumber,
      amount: parseFloat(amount),
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      deviceFingerprint,
      ipAddress: clientIp
    });

    const totalStamps = await Visit.countDocuments({ customerId: user._id, campaignId });
    const target = campaign.requiredStamps;
    const targetRewardVolume = Math.floor(totalStamps / target);
    const existingRewardsCount = await Reward.countDocuments({ customerId: user._id, campaignId });

    let rewardUnlocked = false;
    if (targetRewardVolume > existingRewardsCount) {
      await Reward.create({
        customerId: user._id,
        campaignId,
        rewardTitle: campaign.rewardTitle,
        status: 'unredeemed',
        unlockedAt: new Date()
      });
      rewardUnlocked = true;
    }

    return res.json({
      success: true,
      rewardUnlocked,
      currentStamps: totalStamps % target === 0 && totalStamps > 0 ? target : totalStamps % target,
      totalStamps,
      requiredStamps: target
    });
  } catch (error) {
    console.error('Visit Stamp API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
