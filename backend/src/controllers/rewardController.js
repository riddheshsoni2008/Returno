import Customer from '../models/Customer.js';
import Business from '../models/Business.js';
import Campaign from '../models/Campaign.js';
import Reward from '../models/Reward.js';
import RewardRedemption from '../models/RewardRedemption.js';
import AuditLog from '../models/AuditLog.js';

export const requestRedeem = async (req, res) => {
  try {
    const { rewardId } = req.body;

    if (!rewardId) {
      return res.status(400).json({ error: 'Missing reward reference' });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ error: 'Reward record not found' });
    }

    if (reward.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to reward record' });
    }

    if (reward.status !== 'unredeemed') {
      return res.status(400).json({ error: `Reward is already in ${reward.status} state` });
    }

    reward.status = 'pending';
    await reward.save();

    return res.json({ success: true, message: 'Redemption requested. Hand your device to the store staff.' });
  } catch (error) {
    console.error('Reward Redeem Request API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const approveRedeem = async (req, res) => {
  try {
    const { rewardId, verificationCode } = req.body;

    if (!rewardId || !verificationCode) {
      return res.status(400).json({ error: 'Missing reward reference or verification code' });
    }

    if (req.user.role !== 'business' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(400).json({ error: 'Business profile not found' });
    }

    const pin = business.loyaltyConfiguration?.verificationCode || '1234';
    if (pin !== verificationCode.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ error: 'Reward record not found' });
    }

    if (reward.status === 'redeemed') {
      return res.status(400).json({ error: 'Reward already redeemed' });
    }

    const campaign = await Campaign.findById(reward.campaignId);
    if (!campaign || campaign.businessId.toString() !== business._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized campaign access' });
    }

    reward.status = 'redeemed';
    reward.redeemedAt = new Date();
    await reward.save();

    await RewardRedemption.create({
      rewardId: reward._id,
      customerId: reward.customerId,
      businessId: business._id,
      confirmedByOwnerId: business._id,
      redeemedAt: new Date()
    });

    await AuditLog.create({
      actorId: business._id,
      actorType: 'Business',
      action: 'REWARD_REDEMPTION_APPROVE',
      details: `Approved reward "${reward.rewardTitle}" (ID: ${reward._id}) for customer ID: ${reward.customerId}`,
      ipAddress: req.ip || '127.0.0.1',
      severity: 'info'
    });

    return res.json({ success: true, message: 'Reward successfully verified and redeemed' });
  } catch (error) {
    console.error('Reward Approval API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
