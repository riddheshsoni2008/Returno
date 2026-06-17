import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import Campaign from '@/lib/models/Campaign';
import QrCode from '@/lib/models/QrCode';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await dbConnect();
    const { title, description, requiredStamps, rewardTitle } = await request.json();

    if (!title || !description || !requiredStamps || !rewardTitle) {
      return NextResponse.json({ error: 'Missing required campaign parameters' }, { status: 400 });
    }

    // Authenticate session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    const business = await Business.findOne({ ownerId: user._id });
    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 400 });
    }

    // Create the loyalty campaign
    const campaign = await Campaign.create({
      businessId: business._id,
      title,
      description,
      requiredStamps: parseInt(requiredStamps),
      rewardTitle,
      isActive: true
    });

    // Auto-generate a unique QR Code record for this campaign
    const qrToken = crypto.randomBytes(16).toString('hex');
    await QrCode.create({
      campaignId: campaign._id,
      businessId: business._id,
      qrType: 'static',
      token: qrToken
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });

  } catch (error) {
    console.error('Campaign Create API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    
    // Authenticate session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    const business = await Business.findOne({ ownerId: user._id });
    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 400 });
    }

    const campaigns = await Campaign.find({ businessId: business._id }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, campaigns });

  } catch (error) {
    console.error('Campaign Get API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
