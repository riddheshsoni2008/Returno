import Customer from '../models/Customer.js';
import Business from '../models/Business.js';
import Checkin from '../models/Checkin.js';
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

const getCityStateFromCoords = async (lat, lng) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: {
        'User-Agent': 'ReturnoLoyaltyApp/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county || '';
      const state = addr.state || addr.state_district || '';
      return { 
        city: city.toLowerCase().trim(), 
        state: state.toLowerCase().trim(),
        displayName: data.display_name || `${city}, ${state}`
      };
    }
  } catch (error) {
    clearTimeout(id);
    console.error('Error reverse geocoding:', error);
  }
  return null;
};

export const stampVisit = async (req, res) => {
  try {
    const { campaignId, billNumber, amount, lat, lng, deviceFingerprint } = req.body;
    
    if (!campaignId || !billNumber || !amount) {
      return res.status(400).json({ error: 'Missing stamp request parameters' });
    }

    const user = await Customer.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const business = await Business.findOne({ "campaigns._id": campaignId });
    if (!business) {
      return res.status(404).json({ error: 'Campaign business not found' });
    }

    const campaign = business.campaigns.id(campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ error: 'Campaign is inactive or does not exist' });
    }

    const clientIp = req.ip || '127.0.0.1';
    const cleanedBillNumber = billNumber.trim().toUpperCase();
    
    const existingBillClaim = await Checkin.findOne({ campaignId, billNumber: cleanedBillNumber });
    if (existingBillClaim) {
      await AuditLog.create({
        actorId: user._id,
        actorType: 'Customer',
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

    const shopCity = (business.loyaltyConfiguration?.city || '').toLowerCase().trim();
    const shopState = (business.loyaltyConfiguration?.state || '').toLowerCase().trim();

    if (shopCity || shopState) {
      const geoInfo = await getCityStateFromCoords(parseFloat(lat), parseFloat(lng));
      if (geoInfo) {
        const { city, state } = geoInfo;
        const cityMatches = !shopCity || city.includes(shopCity) || shopCity.includes(city);
        const stateMatches = !shopState || state.includes(shopState) || shopState.includes(state);
        
        if (!cityMatches || !stateMatches) {
          await AuditLog.create({
            actorId: user._id,
            actorType: 'Customer',
            action: 'STAMP_CLAIM_FAILED_LOCATION_MISMATCH',
            details: `Location check failed. Customer geocoded: "${geoInfo.displayName}". Shop expected: "${shopCity}, ${shopState}".`,
            ipAddress: clientIp,
            deviceFingerprint,
            severity: 'critical'
          });
          return res.status(400).json({
            error: `Location check failed. You must scan within the shop's region. Your location: ${geoInfo.displayName || 'unknown'}. Shop location: ${business.loyaltyConfiguration?.city || ''}, ${business.loyaltyConfiguration?.state || ''}.`
          });
        }
      } else {
        console.warn('Reverse geocoding failed or timed out. Bypassing region check as a fallback to avoid blocking user.');
      }
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentVisit = await Checkin.findOne({
      customerId: user._id,
      campaignId,
      createdAt: { $gte: fiveMinsAgo }
    });

    if (recentVisit) {
      return res.status(429).json({
        error: 'Scan rate limit exceeded. Please wait 5 minutes between loyalty claims.'
      });
    }

    // Auto-enroll if not already joined
    let enrollment = user.joinedCampaigns.find(jc => jc.campaignId.toString() === campaignId);
    if (!enrollment) {
      enrollment = {
        campaignId: campaign._id,
        businessId: business._id,
        campaignName: campaign.title,
        rewards: []
      };
      user.joinedCampaigns.push(enrollment);
      // Re-find reference inside mongoose array
      enrollment = user.joinedCampaigns[user.joinedCampaigns.length - 1];
    }

    // Update campaign progress
    enrollment.totalCheckins += 1;
    enrollment.lastCheckinDate = new Date();

    const target = campaign.requiredStamps;
    const targetRewardVolume = Math.floor(enrollment.totalCheckins / target);
    const existingRewardsCount = enrollment.rewards.length;

    let rewardUnlocked = false;
    if (targetRewardVolume > existingRewardsCount) {
      enrollment.rewards.push({
        rewardTitle: campaign.rewardTitle,
        status: 'unredeemed',
        unlockedAt: new Date()
      });
      rewardUnlocked = true;
    }

    await user.save();

    // Create Checkin record representing this stamp
    await Checkin.create({
      customerId: user._id,
      businessId: business._id,
      campaignId,
      billNumber: cleanedBillNumber,
      amount: parseFloat(amount),
      pointsAwarded: 0,
      streakAtCheckin: 0,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      }
    });

    return res.json({
      success: true,
      rewardUnlocked,
      currentStamps: enrollment.totalCheckins % target === 0 && enrollment.totalCheckins > 0 ? target : enrollment.totalCheckins % target,
      totalStamps: enrollment.totalCheckins,
      requiredStamps: target
    });
  } catch (error) {
    console.error('Visit Stamp API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
