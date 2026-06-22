import Business from "../models/Business.js";
import Customer from "../models/Customer.js";
import Checkin from "../models/Checkin.js";

// Helper to format business object for the frontend expectations
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
    obj.verificationCode = obj.loyaltyConfiguration.verificationCode;
  }
  obj.name = obj.businessName; // Map businessName to name
  return obj;
};

export const getBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: "Business profile not found" });
    }
    return res.json({ success: true, business: formatBusinessForFE(business) });
  } catch (error) {
    console.error("Business Get API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const {
      name,
      category,
      address,
      city,
      state,
      geofenceRadius,
      longitude,
      latitude,
    } = req.body;

    let business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: "Business profile not found" });
    }

    if (name) business.businessName = name;

    if (!business.loyaltyConfiguration) {
      business.loyaltyConfiguration = {};
    }

    if (category) business.loyaltyConfiguration.category = category;
    if (address) business.loyaltyConfiguration.address = address;
    if (city !== undefined) business.loyaltyConfiguration.city = city.trim();
    if (state !== undefined) business.loyaltyConfiguration.state = state.trim();
    if (geofenceRadius !== undefined)
      business.loyaltyConfiguration.geofenceRadius = parseInt(geofenceRadius);

    if (longitude !== undefined && latitude !== undefined) {
      business.loyaltyConfiguration.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    await business.save();
    return res.json({ success: true, business: formatBusinessForFE(business) });
  } catch (error) {
    console.error("Business Save API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMetrics = async (req, res) => {
  try {
    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: "Business profile not found" });
    }

    const campaignIds = (business.campaigns || []).map((c) => c._id);

    // 1. Total stamps (check-ins + visit stamps)
    const totalStamps = await Checkin.countDocuments({
      campaignId: { $in: campaignIds },
    });

    // 2. Unique customers
    const uniqueCustomers = await Checkin.distinct("customerId", {
      campaignId: { $in: campaignIds },
    });

    // 3. Open rewards (unredeemed)
    const openRewardsAgg = await Customer.aggregate([
      { $unwind: "$joinedCampaigns" },
      { $match: { "joinedCampaigns.campaignId": { $in: campaignIds } } },
      { $unwind: "$joinedCampaigns.rewards" },
      { $match: { "joinedCampaigns.rewards.status": "unredeemed" } },
      { $count: "count" },
    ]);
    const openRewardsCount = openRewardsAgg[0]?.count || 0;

    // 4. Pending redemptions & Joined customers list
    const customers = await Customer.find({
      "joinedCampaigns.campaignId": { $in: campaignIds },
    }).select("name email joinedCampaigns");

    const pendingRedemptions = [];
    const joinedCustomers = [];
    for (const cust of customers) {
      for (const jc of cust.joinedCampaigns) {
        if (
          campaignIds.some((id) => id.toString() === jc.campaignId.toString())
        ) {
          joinedCustomers.push({
            customerId: cust._id,
            name: cust.name,
            email: cust.email,
            campaignId: jc.campaignId,
            campaignName: jc.campaignName,
            currentStreak: jc.currentStreak,
            longestStreak: jc.longestStreak,
            totalPoints: jc.totalPoints,
            totalCheckins: jc.totalCheckins,
            cyclesRefreshed: jc.cyclesRefreshed || 0,
            rewards: jc.rewards.map((r) => ({
              _id: r._id,
              rewardTitle: r.rewardTitle,
              status: r.status,
              unlockedAt: r.unlockedAt,
              redeemedAt: r.redeemedAt,
            })),
          });

          for (const r of jc.rewards) {
            if (r.status === "pending") {
              pendingRedemptions.push({
                _id: r._id,
                rewardTitle: r.rewardTitle,
                status: r.status,
                unlockedAt: r.unlockedAt,
                updatedAt: r.updatedAt,
                customerId: {
                  _id: cust._id,
                  name: cust.name,
                  email: cust.email,
                },
                campaignId: jc.campaignId,
              });
            }
          }
        }
      }
    }
    pendingRedemptions.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    // 5. Recent stamps
    const recentStamps = await Checkin.find({
      campaignId: { $in: campaignIds },
    })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      metrics: {
        totalStamps,
        uniqueCustomers: uniqueCustomers.length,
        openRewardsCount,
        pendingRedemptions,
        joinedCustomers,
        recentStamps,
      },
    });
  } catch (error) {
    console.error("Business Metrics API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
