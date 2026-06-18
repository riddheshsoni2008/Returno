import Customer from '../models/Customer.js';
import Business from '../models/Business.js';
import AuditLog from '../models/AuditLog.js';

export const requestRedeem = async (req, res) => {
  try {
    const { rewardId } = req.body;

    if (!rewardId) {
      return res.status(400).json({ error: 'Missing reward reference' });
    }

    // Find the customer that has the reward subdocument
    const customer = await Customer.findOne({ "joinedCampaigns.rewards._id": rewardId });
    if (!customer) {
      return res.status(404).json({ error: 'Reward record not found' });
    }

    if (customer._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to reward record' });
    }

    // Locate the reward in joinedCampaigns
    let reward = null;
    for (const jc of customer.joinedCampaigns) {
      const r = jc.rewards.id(rewardId);
      if (r) {
        reward = r;
        break;
      }
    }

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    if (reward.status !== 'unredeemed') {
      return res.status(400).json({ error: `Reward is already in ${reward.status} state` });
    }

    reward.status = 'pending';
    await customer.save();

    return res.json({ success: true, message: 'Redemption requested. Hand your device to the store staff.' });
  } catch (error) {
    console.error('Reward Redeem Request API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const approveRedeem = async (req, res) => {
  try {
    const { rewardId } = req.body;

    if (!rewardId) {
      return res.status(400).json({ error: 'Missing reward reference' });
    }

    if (req.user.role !== 'business' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const business = await Business.findById(req.user.id);
    if (!business) {
      return res.status(400).json({ error: 'Business profile not found' });
    }

    const customer = await Customer.findOne({ "joinedCampaigns.rewards._id": rewardId });
    if (!customer) {
      return res.status(404).json({ error: 'Reward record not found' });
    }

    // Locate the reward and the corresponding campaignId
    let reward = null;
    let enrollment = null;
    for (const jc of customer.joinedCampaigns) {
      const r = jc.rewards.id(rewardId);
      if (r) {
        reward = r;
        enrollment = jc;
        break;
      }
    }

    if (!reward || !enrollment) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    if (reward.status === 'redeemed') {
      return res.status(400).json({ error: 'Reward already redeemed' });
    }

    // Verify this business owns the campaign
    const campaign = business.campaigns.id(enrollment.campaignId);
    if (!campaign) {
      return res.status(403).json({ error: 'Unauthorized campaign access' });
    }

    reward.status = 'redeemed';
    reward.redeemedAt = new Date();
    await customer.save();

    await AuditLog.create({
      actorId: business._id,
      actorType: 'Business',
      action: 'REWARD_REDEMPTION_APPROVE',
      details: `Approved reward "${reward.rewardTitle}" (ID: ${reward._id}) for customer ID: ${customer._id}`,
      ipAddress: req.ip || '127.0.0.1',
      severity: 'info'
    });

    return res.json({ success: true, message: 'Reward successfully verified and redeemed' });
  } catch (error) {
    console.error('Reward Approval API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
