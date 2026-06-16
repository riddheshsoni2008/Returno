import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Reward from '@/lib/models/Reward';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await dbConnect();
    const { rewardId } = await request.json();

    if (!rewardId) {
      return NextResponse.json({ error: 'Missing reward reference' }, { status: 400 });
    }

    // Authenticate customer session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return NextResponse.json({ error: 'Reward record not found' }, { status: 404 });
    }

    // Confirm ownership
    if (reward.customerId.toString() !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized access to reward record' }, { status: 403 });
    }

    if (reward.status !== 'unredeemed') {
      return NextResponse.json({ error: `Reward is already in ${reward.status} state` }, { status: 400 });
    }

    // Set reward status to pending
    reward.status = 'pending';
    await reward.save();

    return NextResponse.json({ success: true, message: 'Redemption requested. Hand your device to the store staff.' });

  } catch (error) {
    console.error('Reward Redeem Request API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
