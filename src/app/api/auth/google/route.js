import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, name, googleId } = await request.json();

    if (!email || !name || !googleId) {
      return NextResponse.json({ error: 'Missing Google profile details' }, { status: 400 });
    }

    const cleanedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ 
      $or: [{ googleId }, { email: cleanedEmail }] 
    });

    if (!user) {
      // Create user as customer by default
      user = await User.create({
        name,
        email: cleanedEmail,
        googleId,
        role: 'customer'
      });
    } else if (!user.googleId) {
      // Link Google ID if user registered with email previously
      user.googleId = googleId;
      await user.save();
    }

    // Issue Session Token
    const token = generateToken(user);
    
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Google OAuth API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
