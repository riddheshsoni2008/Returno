import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await dbConnect();
    const user = await User.findById(decoded.id).select('-passwordHash -otp');

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userObj = user.toObject();

    // Attach business details if user is a business owner
    if (user.role === 'business') {
      const business = await Business.findOne({ ownerId: user._id });
      userObj.business = business || null;
    }

    return NextResponse.json({ success: true, user: userObj });

  } catch (error) {
    console.error('Session Validation API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear session cookie
    cookieStore.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return NextResponse.json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
