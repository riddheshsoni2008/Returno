import crypto from 'crypto';
import Business from '../models/Business.js';
import QrSession from '../models/QrSession.js';
import Customer from '../models/Customer.js';

// =============================================
// POST /api/qr/generate
// Generate a new dynamic QR session token (60s expiry)
// =============================================
export const generateQrSession = async (req, res) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const campaign = business.campaigns.id(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!campaign.isActive) {
      return res.status(400).json({ error: 'Campaign is not active' });
    }

    // Expire any existing active sessions for this campaign
    await QrSession.updateMany(
      { campaignId: campaign._id, isExpired: false },
      { $set: { isExpired: true } }
    );

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours (expires immediately upon scan)

    const session = await QrSession.create({
      campaignId: campaign._id,
      businessId: business._id,
      token,
      expiresAt
    });

    return res.json({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
      sessionId: session._id
    });
  } catch (error) {
    console.error('QR Generate API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// =============================================
// GET /api/qr/active/:campaignId
// Get the current active QR session for a campaign
// =============================================
export const getActiveQrSession = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const campaign = business.campaigns.id(campaignId);
    if (!campaign) {
      return res.status(403).json({ error: 'Unauthorized or campaign not found' });
    }

    const now = new Date();
    const activeSession = await QrSession.findOne({
      campaignId: campaign._id,
      isExpired: false,
      expiresAt: { $gt: now }
    }).sort({ createdAt: -1 });

    if (!activeSession) {
      return res.json({ success: true, session: null });
    }

    // Get check-in count for this session
    const checkinCount = activeSession.usedBy ? activeSession.usedBy.length : 0;

    return res.json({
      success: true,
      session: {
        token: activeSession.token,
        expiresAt: activeSession.expiresAt,
        sessionId: activeSession._id,
        checkinCount
      }
    });
  } catch (error) {
    console.error('QR Active Session API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// =============================================
// GET /api/qr/stats/:campaignId
// Get campaign QR & enrollment stats
// =============================================
export const getCampaignQrStats = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const campaign = business.campaigns.id(campaignId);
    if (!campaign) {
      return res.status(403).json({ error: 'Unauthorized or campaign not found' });
    }

    const totalEnrollments = await Customer.countDocuments({ "joinedCampaigns.campaignId": campaign._id });
    
    // Get active streakers (checked in today or yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const activeStreakers = await Customer.countDocuments({
      joinedCampaigns: {
        $elemMatch: {
          campaignId: campaign._id,
          lastCheckinDate: { $gte: yesterday },
          currentStreak: { $gte: 2 }
        }
      }
    });

    // Average streak among active users
    const streakAgg = await Customer.aggregate([
      { $unwind: "$joinedCampaigns" },
      { $match: { "joinedCampaigns.campaignId": campaign._id, "joinedCampaigns.currentStreak": { $gte: 1 } } },
      { $group: { _id: null, avgStreak: { $avg: '$joinedCampaigns.currentStreak' }, maxStreak: { $max: '$joinedCampaigns.longestStreak' } } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalEnrollments,
        activeStreakers,
        avgStreak: streakAgg[0]?.avgStreak ? Math.round(streakAgg[0].avgStreak * 10) / 10 : 0,
        maxStreak: streakAgg[0]?.maxStreak || 0
      }
    });
  } catch (error) {
    console.error('QR Stats API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
