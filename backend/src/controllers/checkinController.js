import Customer from "../models/Customer.js";
import Business from "../models/Business.js";
import Checkin from "../models/Checkin.js";
import QrSession from "../models/QrSession.js";
import AuditLog from "../models/AuditLog.js";

// Helper: check if two dates are the same calendar day (IST)
const isSameDay = (d1, d2) => {
  const toIST = (d) => {
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 5.5 * 3600000);
  };
  const a = toIST(d1);
  const b = toIST(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
    obj.city = obj.loyaltyConfiguration.city || "";
    obj.state = obj.loyaltyConfiguration.state || "";
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
    const campaignId = req.params.campaignId || req.params.id;

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(401).json({ error: "Customer not found" });
    }

    const business = await Business.findOne({ "campaigns._id": campaignId });
    if (!business) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const campaign = business.campaigns.id(campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ error: "Campaign not found or inactive" });
    }

    // Check if already enrolled
    const existingIndex = customer.joinedCampaigns.findIndex(
      (jc) => jc.campaignId.toString() === campaignId,
    );

    if (existingIndex !== -1) {
      return res.json({
        success: true,
        alreadyJoined: true,
        message: "You are already enrolled in this campaign",
        enrollment: customer.joinedCampaigns[existingIndex],
        campaign,
        business: formatBusinessForFE(business),
      });
    }

    // Create enrollment
    const enrollment = {
      campaignId: campaign._id,
      businessId: business._id,
      campaignName: campaign.title,
      rewards: [],
    };

    customer.joinedCampaigns.push(enrollment);
    await customer.save();

    // Get the newly pushed enrollment
    const newEnrollment =
      customer.joinedCampaigns[customer.joinedCampaigns.length - 1];

    return res.status(201).json({
      success: true,
      alreadyJoined: false,
      message: "Successfully joined the campaign!",
      enrollment: newEnrollment,
      campaign,
      business: formatBusinessForFE(business),
    });
  } catch (error) {
    console.error("Join Campaign API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// =============================================
// POST /api/checkin/validate
// Validate dynamic QR token and process check-in
// =============================================
export const validateCheckin = async (req, res) => {
  try {
    const { token, lat, lng } = req.body;

    console.log(`[Check-in Controller] validateCheckin called.`);
    console.log(`- Token parameter: ${token}`);
    console.log(`- User ID from JWT: ${req.user.id}`);
    console.log(`- Location coordinates: lat=${lat}, lng=${lng}`);

    if (!token) {
      console.warn(`- Validation failed: Missing token.`);
      return res.status(400).json({ error: "Check-in token is required" });
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      console.warn(
        `- Validation failed: Customer not found in database for ID ${req.user.id}`,
      );
      return res.status(401).json({ error: "Customer not found" });
    }

    // 1. Find the QR session regardless of expiry to check for replay
    const now = new Date();
    const existingSession = await QrSession.findOne({ token });

    if (!existingSession) {
      return res.status(400).json({
        error: "This QR code is invalid. Please ask the shop for a fresh one.",
      });
    }

    // Find the business and campaign using existingSession
    const business = await Business.findOne({ "campaigns._id": existingSession.campaignId });
    if (!business) {
      return res.status(404).json({ error: "Campaign business not found" });
    }

    const campaign = business.campaigns.id(existingSession.campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ error: "Campaign is inactive or does not exist" });
    }

    // Check if customer needs to restart
    const enrollmentCheck = customer.joinedCampaigns.find(
      (jc) => jc.campaignId && jc.campaignId.toString() === campaign._id.toString()
    );

    if (enrollmentCheck && enrollmentCheck.totalCheckins > 0 && enrollmentCheck.totalCheckins % campaign.requiredStamps === 0) {
      const completedCycles = Math.floor(enrollmentCheck.totalCheckins / campaign.requiredStamps);
      const refreshedCycles = enrollmentCheck.cyclesRefreshed || 0;
      if (completedCycles > refreshedCycles) {
        return res.json({
          success: false,
          needsRestart: true,
          message: "You have completed this campaign! Please restart to begin a new stamp card.",
          campaignId: campaign._id
        });
      }
    }

    // Check if THIS specific customer already scanned THIS specific QR token
    if (
      existingSession.usedBy &&
      existingSession.usedBy.includes(customer._id)
    ) {
      // Return "already check in" equivalent
      const business = await Business.findOne({
        "campaigns._id": existingSession.campaignId,
      });
      let currentStreak = 0,
        longestStreak = 0,
        totalPoints = 0,
        totalCheckins = 0;

      if (business) {
        const enrollment = customer.joinedCampaigns.find(
          (jc) =>
            jc.campaignId &&
            jc.campaignId.toString() === existingSession.campaignId.toString(),
        );
        if (enrollment) {
          currentStreak = enrollment.currentStreak;
          longestStreak = enrollment.longestStreak;
          totalPoints = enrollment.totalPoints;
          totalCheckins = enrollment.totalCheckins;
        }
      }

      return res.json({
        success: true,
        alreadyClaimed: true,
        message: "Already checked in with this QR code!",
        currentStreak,
        longestStreak,
        totalPoints,
        totalCheckins,
      });
    }

    // Now attempt to claim it if it hasn't been expired/claimed by others
    const qrSession = await QrSession.findOneAndUpdate(
      {
        token,
        isExpired: false,
        expiresAt: { $gt: now },
      },
      {
        $set: { isExpired: true },
        $push: { usedBy: customer._id },
      },
      { returnDocument: "after" }, // Return updated doc to ensure we have the correct campaignId
    );

    if (!qrSession) {
      console.warn(
        `- Validation failed: QR Session was either already used, expired, or invalid.`,
      );
      return res.status(400).json({
        error:
          "This QR code is expired or has already been scanned. Please ask the shop for a fresh one.",
      });
    }

    console.log(
      `- QR session successfully claimed: Session ID=${qrSession._id}, Campaign ID=${qrSession.campaignId}, Type=${qrSession.type}`,
    );

    // 4. Find the business and campaign
    const business = await Business.findOne({
      "campaigns._id": qrSession.campaignId,
    });
    if (!business) {
      return res.status(404).json({ error: "Campaign business not found" });
    }

    const campaign = business.campaigns.id(qrSession.campaignId);
    if (!campaign || !campaign.isActive) {
      return res
        .status(404)
        .json({ error: "Campaign is inactive or does not exist" });
    }

    // 5. Check customer is enrolled, if not, AUTO-JOIN them!
    let enrollment = customer.joinedCampaigns.find(
      (jc) =>
        jc.campaignId && jc.campaignId.toString() === campaign._id.toString(),
    );

    if (!enrollment) {
      console.log(
        `- Customer not enrolled. Auto-enrolling Customer ${customer._id} to Campaign ${campaign._id} under Business ${business._id}`,
      );
      // Automatically enroll the user into the campaign
      customer.joinedCampaigns.push({
        campaignId: campaign._id,
        businessId: business._id,
        campaignName: campaign.title,
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        totalCheckins: 0,
        lastCheckinDate: null,
      });
      // Get reference to the newly created enrollment subdocument
      enrollment =
        customer.joinedCampaigns[customer.joinedCampaigns.length - 1];
    }

    // 7. Calculate streak
    let newStreak = 1; // Default: first check-in or reset
    if (enrollment.lastCheckinDate) {
      if (isSameDay(enrollment.lastCheckinDate, now)) {
        // Same day check-in with a different QR code: do not increment streak, just keep current
        newStreak = enrollment.currentStreak || 1;
      } else if (isYesterday(enrollment.lastCheckinDate, now)) {
        // Consecutive day — extend streak
        newStreak = Math.min(enrollment.currentStreak + 1, campaign.maxStreak);
      }
      // Else: gap > 1 day, reset to 1
    }

    // 8. Calculate points
    const pointsAwarded =
      campaign.pointsPerCheckin * newStreak * campaign.streakBonusMultiplier;

    // 9. Update enrollment progress
    enrollment.currentStreak = newStreak;
    enrollment.longestStreak = Math.max(enrollment.longestStreak, newStreak);
    enrollment.totalPoints += pointsAwarded;
    enrollment.totalCheckins += 1;
    enrollment.lastCheckinDate = now;

    // 10. Check reward milestone
    let rewardUnlocked = false;
    const target = campaign.requiredStamps;
    const targetRewardVolume = Math.floor(enrollment.totalCheckins / target);
    const existingRewardsCount = enrollment.rewards.length;

    if (targetRewardVolume > existingRewardsCount) {
      enrollment.rewards.push({
        rewardTitle: campaign.rewardTitle,
        status: "unredeemed",
        unlockedAt: new Date(),
      });
      rewardUnlocked = true;
    }

    await customer.save();

    // 11. Create check-in record
    const checkin = await Checkin.create({
      customerId: customer._id,
      businessId: business._id,
      campaignId: campaign._id,
      qrSessionId: qrSession._id,
      pointsAwarded,
      streakAtCheckin: newStreak,
      location:
        lat !== undefined && lng !== undefined
          ? {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            }
          : undefined,
    });

    // (Token was already marked expired and used atomically at the start of the request)

    // 13. Audit log
    await AuditLog.create({
      actorId: customer._id,
      actorType: "Customer",
      action: "CHECKIN_SUCCESS",
      details: `Checked in to campaign "${campaign.title}" (ID: ${campaign._id}). Streak: ${newStreak}, Points: +${pointsAwarded}`,
      severity: "info",
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
      currentStamps:
        enrollment.totalCheckins % target === 0 && enrollment.totalCheckins > 0
          ? target
          : enrollment.totalCheckins % target,
      requiredStamps: target,
      campaignTitle: campaign.title,
      rewardTitle: campaign.rewardTitle,
    });
  } catch (error) {
    console.error("Validate Checkin API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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
      return res.status(401).json({ error: "Customer not found" });
    }

    const checkins = await Checkin.find({
      customerId: customer._id,
      campaignId,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({ success: true, checkins });
  } catch (error) {
    console.error("Checkin History API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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
      return res.status(401).json({ error: "Customer not found" });
    }

    const enrollment = customer.joinedCampaigns.find(
      (jc) => jc.campaignId.toString() === campaignId,
    );

    if (!enrollment) {
      return res.status(404).json({ error: "Not enrolled in this campaign" });
    }

    // Check if streak is still active (last check-in was today or yesterday)
    const now = new Date();
    let streakActive = false;
    if (enrollment.lastCheckinDate) {
      streakActive =
        isSameDay(enrollment.lastCheckinDate, now) ||
        isYesterday(enrollment.lastCheckinDate, now);
    }

    return res.json({
      success: true,
      currentStreak: streakActive ? enrollment.currentStreak : 0,
      longestStreak: enrollment.longestStreak,
      totalPoints: enrollment.totalPoints,
      totalCheckins: enrollment.totalCheckins,
      lastCheckinDate: enrollment.lastCheckinDate,
      streakActive,
    });
  } catch (error) {
    console.error("Streak Info API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// =============================================
// POST /api/checkin/restart/:campaignId
// Restart a completed campaign to continue collecting stamps
// =============================================
export const restartCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const customer = await Customer.findById(req.user.id);
    
    if (!customer) {
      return res.status(401).json({ error: "Customer not found" });
    }

    const enrollment = customer.joinedCampaigns.find(
      (jc) => jc.campaignId && jc.campaignId.toString() === campaignId.toString()
    );

    if (!enrollment) {
      return res.status(404).json({ error: "Not enrolled in this campaign" });
    }

    enrollment.cyclesRefreshed = (enrollment.cyclesRefreshed || 0) + 1;
    await customer.save();

    return res.json({ success: true, message: "Campaign restarted successfully!" });
  } catch (error) {
    console.error("Restart Campaign API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
