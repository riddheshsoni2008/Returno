import Campaign from '../models/Campaign.js';
import Business from '../models/Business.js';
import QrCode from '../models/QrCode.js';
import crypto from 'crypto';

export const createCampaign = async (req, res) => {
  try {
    const { title, description, requiredStamps, rewardTitle } = req.body;

    if (!title || !description || !requiredStamps || !rewardTitle) {
      return res.status(400).json({ error: 'Missing required campaign parameters' });
    }

    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(400).json({ error: 'Business profile not found' });
    }

    const campaign = await Campaign.create({
      businessId: business._id,
      title,
      description,
      requiredStamps: parseInt(requiredStamps),
      rewardTitle,
      isActive: true
    });

    const qrToken = crypto.randomBytes(16).toString('hex');
    await QrCode.create({
      campaignId: campaign._id,
      businessId: business._id,
      qrType: 'static',
      token: qrToken
    });

    return res.status(201).json({ success: true, campaign });
  } catch (error) {
    console.error('Campaign Create API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(400).json({ error: 'Business profile not found' });
    }

    const campaigns = await Campaign.find({ businessId: business._id }).sort({ createdAt: -1 });
    return res.json({ success: true, campaigns });
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

    return res.json({ success: true, campaign, business });
  } catch (error) {
    console.error('Campaign GetById API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
