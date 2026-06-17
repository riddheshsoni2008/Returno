import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import Business from '../models/Business.js';
import CustomerCampaign from '../models/CustomerCampaign.js';
import Checkin from '../models/Checkin.js';
import QrSession from '../models/QrSession.js';
import Reward from '../models/Reward.js';
import AuditLog from '../models/AuditLog.js';

// Helper: check if two dates are the same calendar day (IST)
const isSameDay = (d1, d2) => {
  const toIST = (d) => {
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 5.5 * 3600000);
  };
  const a = toIST(d1);
  const b = toIST(d2);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
};

// Helper: check if d1 is exactly the day before d2 (IST)
const isYesterday = (d1, d2) => {
  const toIST = (d) => {
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 5.5 * 3600000);
  };
  const a = toIST(d1);
  const b = toIST(d2);
  // Set both to midnight
  const aMidnight = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bMidnight = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const diffMs = bMidnight.getTime() - aMidnight.getTime();
  return diffMs === 86400000; // exactly 1 day
};

// Helper to format business for frontend
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

// =============================================
// POST /api/checkin/join/:campaignId
// Customer joins a campaign
// =============================================
export const joinCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(401).json({ error: 'Customer not found' });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ error: 'Campaign not found or inactive' });
    }

    const business = await Business.findById(campaign.businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if already enrolled
    const existing = await CustomerCampaign.findOne({
      customerId: customer._id,
      campaignId: campaign._id
    });

    if (existing) {
      return res.json({
        success: true,
        alreadyJoined: true,
        message: 'You are already enrolled in this campaign',
        enrollment: existing,
        campaign,
        business: formatBusinessForFE(business)
      });
    }

    // Create enrollment
    const enrollment = await CustomerCampaign.create({
      customerId: customer._id,
      campaignId: campaign._id
    });

    return res.status(201).json({
      success: true,
      alreadyJoined: false,
      message: 'Successfully joined the campaign!',
      enrollment,
      campaign,
      business: formatBusinessForFE(business)
    });
  } catch (error) {
    console.error('Join Campaign API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// =============================================
// POST /api/checkin/validate
// Validate dynamic QR token and process check-in
// =============================================
export const validateCheckin = async (req, res) => {
  try {
    const { token, lat, lng } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Check-in token is required' });
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(401).json({ error: 'Customer not found' });
    }

    // 1. Find QR session by token
    const qrSession = await QrSession.findOne({ token });
    if (!qrSession) {
      return res.status(400).json({ error: 'Invalid or expired QR code. Please ask the shop to generate a new one.' });
    }

    // 2. Check token expiry
    const now = new Date();
    if (now > qrSession.expiresAt || qrSession.isExpired) {
      return res.status(400).json({ error: 'This QR code has expired. Ask the shop staff to generate a fresh one.' });
    }

    // 3. Prevent replay — check if customer already used this token
    if (qrSession.usedBy.some(id => id.toString() === customer._id.toString())) {
      return res.status(400).json({ error: 'You have already used this QR code.' });
    }

    // 4. Get campaign
    const campaign = await Campaign.findById(qrSession.campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ error: 'Campaign is inactive or does not exist' });
    }

    // 5. Check customer is enrolled
    const enrollment = await CustomerCampaign.findOne({
      customerId: customer._id,
      campaignId: campaign._id
    });

    if (!enrollment) {
      return res.status(400).json({
        error: 'You have not joined this campaign yet. Please scan the campaign join QR first.',
        notEnrolled: true,
        campaignId: campaign._id
      });
    }

    // 6. Check if already checked in today
    if (enrollment.lastCheckinDate && isSameDay(enrollment.lastCheckinDate, now)) {
      return res.json({
        success: true,
        alreadyClaimed: true,
        message: "Today's streak already claimed! Come back tomorrow.",
        currentStreak: enrollment.currentStreak,
        longestStreak: enrollment.longestStreak,
        totalPoints: enrollment.totalPoints,
        totalCheckins: enrollment.totalCheckins
      });
    }

    // 7. Calculate streak
    let newStreak = 1; // Default: first check-in or reset
    if (enrollment.lastCheckinDate) {
      if (isYesterday(enrollment.lastCheckinDate, now)) {
        // Consecutive day — extend streak
        newStreak = Math.min(enrollment.currentStreak + 1, campaign.maxStreak);
      }
      // Else: gap > 1 day, reset to 1
    }

    // 8. Calculate points
    const pointsAwarded = campaign.pointsPerCheckin * newStreak * campaign.streakBonusMultiplier;

    // 9. Update enrollment
    enrollment.currentStreak = newStreak;
    enrollment.longestStreak = Math.max(enrollment.longestStreak, newStreak);
    enrollment.totalPoints += pointsAwarded;
    enrollment.totalCheckins += 1;
    enrollment.lastCheckinDate = now;
    await enrollment.save();

    // 10. Create check-in record
    const checkin = await Checkin.create({
      customerId: customer._id,
      campaignId: campaign._id,
      qrSessionId: qrSession._id,
      pointsAwarded,
      streakAtCheckin: newStreak,
      location: (lat !== undefined && lng !== undefined) ? {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      } : undefined
    });

    // 11. Mark token as used by this customer
    qrSession.usedBy.push(customer._id);
    await qrSession.save();

    // 12. Check reward milestone
    let rewardUnlocked = false;
    const target = campaign.requiredStamps;
    const targetRewardVolume = Math.floor(enrollment.totalCheckins / target);
    const existingRewardsCount = await Reward.countDocuments({ customerId: customer._id, campaignId: campaign._id });

    if (targetRewardVolume > existingRewardsCount) {
      await Reward.create({
        customerId: customer._id,
        campaignId: campaign._id,
        rewardTitle: campaign.rewardTitle,
        status: 'unredeemed',
        unlockedAt: new Date()
      });
      rewardUnlocked = true;
    }

    // 13. Audit log
    await AuditLog.create({
      actorId: customer._id,
      actorType: 'Customer',
      action: 'CHECKIN_SUCCESS',
      details: `Checked in to campaign "${campaign.title}" (ID: ${campaign._id}). Streak: ${newStreak}, Points: +${pointsAwarded}`,
      severity: 'info'
    });

    return res.json({
      success: true,
      alreadyClaimed: false,
      rewardUnlocked,
      pointsAwarded,
      currentStreak: newStreak,
      longestStreak: enrollment.longestStreak,
      totalPoints: enrollment.totalPoints,
      totalCheckins: enrollment.totalCheckins,
      currentStamps: enrollment.totalCheckins % target === 0 && enrollment.totalCheckins > 0 ? target : enrollment.totalCheckins % target,
      requiredStamps: target,
      campaignTitle: campaign.title,
      rewardTitle: campaign.rewardTitle
    });
  } catch (error) {
    console.error('Validate Checkin API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// =============================================
// GET /api/checkin/history/:campaignId
// Get check-in history for a campaign
// =============================================
export const getCheckinHistory = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(401).json({ error: 'Customer not found' });
    }

    const checkins = await Checkin.find({
      customerId: customer._id,
      campaignId
    }).sort({ createdAt: -1 }).limit(30);

    return res.json({ success: true, checkins });
  } catch (error) {
    console.error('Checkin History API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// =============================================
// GET /api/checkin/streak/:campaignId
// Get current streak info for a campaign
// =============================================
export const getStreakInfo = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(401).json({ error: 'Customer not found' });
    }

    const enrollment = await CustomerCampaign.findOne({
      customerId: customer._id,
      campaignId
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Not enrolled in this campaign' });
    }

    // Check if streak is still active (last check-in was today or yesterday)
    const now = new Date();
    let streakActive = false;
    if (enrollment.lastCheckinDate) {
      streakActive = isSameDay(enrollment.lastCheckinDate, now) || isYesterday(enrollment.lastCheckinDate, now);
    }

    return res.json({
      success: true,
      currentStreak: streakActive ? enrollment.currentStreak : 0,
      longestStreak: enrollment.longestStreak,
      totalPoints: enrollment.totalPoints,
      totalCheckins: enrollment.totalCheckins,
      lastCheckinDate: enrollment.lastCheckinDate,
      streakActive
    });
  } catch (error) {
    console.error('Streak Info API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
