import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import Campaign from '@/lib/models/Campaign';
import Visit from '@/lib/models/Visit';
import Reward from '@/lib/models/Reward';
import AuditLog from '@/lib/models/AuditLog';
import { getDistance } from '@/lib/geofence';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await dbConnect();
    const { campaignId, billNumber, amount, lat, lng, deviceFingerprint } = await request.json();

    if (!campaignId || !billNumber || !amount) {
      return NextResponse.json({ error: 'Missing stamp request parameters' }, { status: 400 });
    }

    // Authenticate customer session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required. Please login first.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Find the campaign and business profile
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.isActive) {
      return NextResponse.json({ error: 'Campaign is inactive or does not exist' }, { status: 404 });
    }

    const business = await Business.findById(campaign.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // ANTI-FRAUD CHECK 1: Bill Number Uniqueness
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
      return NextResponse.json({ error: 'This bill number has already been used to claim a stamp.' }, { status: 400 });
    }

    // ANTI-FRAUD CHECK 2: Geofence Verification
    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Location verification is required to award stamps.' }, { status: 400 });
    }

    const shopLng = business.location.coordinates[0];
    const shopLat = business.location.coordinates[1];
    const distance = getDistance(parseFloat(lat), parseFloat(lng), shopLat, shopLng);

    if (distance > business.geofenceRadius) {
      // Log critical location spoofing/fraud attempt
      await AuditLog.create({
        actorId: user._id,
        action: 'STAMP_CLAIM_FAILED_GEOFENCE',
        details: `Geofence check failed. Customer coordinate: [${lat}, ${lng}]. Shop coordinate: [${shopLat}, ${shopLng}]. Distance: ${distance.toFixed(1)}m. Limit: ${business.geofenceRadius}m.`,
        ipAddress: clientIp,
        deviceFingerprint,
        severity: 'critical'
      });
      return NextResponse.json({ 
        error: `Location check failed. You must scan within ${business.geofenceRadius}m of the counter. Current: ${distance.toFixed(0)}m.` 
      }, { status: 400 });
    }

    // ANTI-FRAUD CHECK 3: Velocity Limit (1 scan per 5 mins per shop)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentVisit = await Visit.findOne({
      customerId: user._id,
      campaignId,
      createdAt: { $gte: fiveMinsAgo }
    });

    if (recentVisit) {
      return NextResponse.json({ 
        error: 'Scan rate limit exceeded. Please wait 5 minutes between loyalty claims.' 
      }, { status: 429 });
    }

    // Connect visit
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

    // Calculate Reward Progress
    const totalStamps = await Visit.countDocuments({ customerId: user._id, campaignId });
    const target = campaign.requiredStamps;
    
    const targetRewardVolume = Math.floor(totalStamps / target);
    const existingRewardsCount = await Reward.countDocuments({ customerId: user._id, campaignId });

    let rewardUnlocked = false;
    if (targetRewardVolume > existingRewardsCount) {
      // Unlock a new reward!
      await Reward.create({
        customerId: user._id,
        campaignId,
        rewardTitle: campaign.rewardTitle,
        status: 'unredeemed',
        unlockedAt: new Date()
      });
      rewardUnlocked = true;
    }

    return NextResponse.json({
      success: true,
      rewardUnlocked,
      currentStamps: totalStamps % target === 0 && totalStamps > 0 ? target : totalStamps % target,
      totalStamps,
      requiredStamps: target
    });

  } catch (error) {
    console.error('Visit Stamp API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
