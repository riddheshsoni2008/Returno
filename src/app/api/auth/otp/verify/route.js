import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { generateToken, hashOtp } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await dbConnect();
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and verification code are required' }, { status: 400 });
    }

    // Clean phone number (digits only)
    let cleanedPhone = phone.replace(/\D/g, '');

    // Prepend default Indian country code (91) if it's a standard 10-digit number without CC
    if (cleanedPhone.length === 10) {
      const defaultCc = process.env.DEFAULT_COUNTRY_CODE || '91';
      cleanedPhone = defaultCc + cleanedPhone;
    }

    const user = await User.findOne({ phone: cleanedPhone });

    if (!user || !user.otp || !user.otp.hashedCode) {
      return NextResponse.json({ error: 'No active OTP verification session found' }, { status: 400 });
    }

    // Check brute-force attempts lockout (max 5 attempts allowed)
    if (user.otp.attempts >= 5) {
      user.otp = undefined; // Destroy session
      await user.save();
      return NextResponse.json({ 
        error: 'Too many failed verification attempts. Please request a new OTP.' 
      }, { status: 400 });
    }

    // Check expiration (5 minutes validity)
    if (new Date() > new Date(user.otp.expiresAt)) {
      user.otp = undefined; // Clear expired session
      await user.save();
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Compare hashed OTPs
    const inputHash = hashOtp(code.trim(), cleanedPhone);
    if (user.otp.hashedCode !== inputHash) {
      // Increment attempt counter
      const currentAttempts = (user.otp.attempts || 0) + 1;
      
      if (currentAttempts >= 5) {
        user.otp = undefined; // Exceeded max attempts, destroy OTP session
        await user.save();
        return NextResponse.json({ 
          error: 'Too many failed verification attempts. This OTP has been invalidated. Please request a new one.' 
        }, { status: 400 });
      }

      user.otp.attempts = currentAttempts;
      await user.save();

      const remaining = 5 - currentAttempts;
      return NextResponse.json({ 
        error: `Invalid verification code. You have ${remaining} attempts remaining.` 
      }, { status: 400 });
    }

    // OTP verified successfully - clear OTP data to prevent reuse
    user.otp = undefined;
    await user.save();

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
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('OTP Verify API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
