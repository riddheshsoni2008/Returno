import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import Campaign from '@/lib/models/Campaign';
import Reward from '@/lib/models/Reward';
import RewardRedemption from '@/lib/models/RewardRedemption';
import AuditLog from '@/lib/models/AuditLog';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await dbConnect();
    const { rewardId, verificationCode } = await request.json();

    if (!rewardId || !verificationCode) {
      return NextResponse.json({ error: 'Missing reward reference or verification code' }, { status: 400 });
    }

    // Authenticate merchant session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'business' && decoded.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await User.findById(decoded.id);
    const business = await Business.findOne({ ownerId: user._id });
    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 400 });
    }

    // Verify confirmation code/PIN
    if (business.verificationCode !== verificationCode.trim()) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Find the reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return NextResponse.json({ error: 'Reward record not found' }, { status: 404 });
    }

    if (reward.status === 'redeemed') {
      return NextResponse.json({ error: 'Reward already redeemed' }, { status: 400 });
    }

    // Validate that the campaign belongs to this business
    const campaign = await Campaign.findById(reward.campaignId);
    if (!campaign || campaign.businessId.toString() !== business._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized campaign access' }, { status: 403 });
    }

    // Mark reward as redeemed
    reward.status = 'redeemed';
    reward.redeemedAt = new Date();
    await reward.save();

    // Create redemption ledger audit record
    await RewardRedemption.create({
      rewardId: reward._id,
      customerId: reward.customerId,
      businessId: business._id,
      confirmedByOwnerId: user._id,
      redeemedAt: new Date()
    });

    // Create security audit logs
    await AuditLog.create({
      actorId: user._id,
      action: 'REWARD_REDEMPTION_APPROVE',
      details: `Approved reward "${reward.rewardTitle}" (ID: ${reward._id}) for customer ID: ${reward.customerId}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      severity: 'info'
    });

    return NextResponse.json({ success: true, message: 'Reward successfully verified and redeemed' });

  } catch (error) {
    console.error('Reward Approval API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
