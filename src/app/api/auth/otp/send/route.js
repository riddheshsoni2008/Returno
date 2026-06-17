import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { hashOtp } from '@/lib/auth';
import { getSmsProvider } from '@/lib/services/sms';

export async function POST(request) {
  try {
    await dbConnect();
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Clean phone number (digits only)
    let cleanedPhone = phone.replace(/\D/g, '');

    // Prepend default Indian country code (91) if it's a standard 10-digit number without CC
    if (cleanedPhone.length === 10) {
      const defaultCc = process.env.DEFAULT_COUNTRY_CODE || '91';
      cleanedPhone = defaultCc + cleanedPhone;
    }

    // Validate phone length (E.164 length is usually 11-15 digits after prefix)
    if (cleanedPhone.length < 11 || cleanedPhone.length > 15) {
      return NextResponse.json({ error: 'Invalid phone number format. Please enter a valid mobile number.' }, { status: 400 });
    }

    // Find user or create customer profile on the fly (frictionless loyalty scan login)
    let user = await User.findOne({ phone: cleanedPhone });
    if (!user) {
      user = await User.create({
        name: `Customer ${cleanedPhone.slice(-4)}`,
        email: `${cleanedPhone}@returno.local`, // placeholder unique email
        phone: cleanedPhone,
        role: 'customer'
      });
    }

    const now = new Date();

    // 1. Cooldown Period Check (60 seconds)
    if (user.otp && user.otp.lastSentAt) {
      const lastSent = new Date(user.otp.lastSentAt);
      const elapsedSeconds = Math.floor((now - lastSent) / 1000);
      if (elapsedSeconds < 60) {
        const waitTime = 60 - elapsedSeconds;
        return NextResponse.json({ 
          error: `Please wait ${waitTime} seconds before requesting another OTP.` 
        }, { status: 429 });
      }
    }

    // 2. Rate Limiting Check (Max 5 requests per hour)
    const limitWindowMs = 60 * 60 * 1000; // 1 hour window
    const maxRequests = 5;

    let requestCount = user.otp?.requestCount || 0;
    let windowStart = user.otp?.windowStart ? new Date(user.otp.windowStart) : now;

    // If window has expired, reset count and window start
    if (now - windowStart > limitWindowMs) {
      windowStart = now;
      requestCount = 0;
    }

    if (requestCount >= maxRequests) {
      const nextResetTime = new Date(windowStart.getTime() + limitWindowMs);
      const waitMinutes = Math.ceil((nextResetTime - now) / (60 * 1000));
      return NextResponse.json({ 
        error: `Too many OTP requests. Please try again in ${waitMinutes} minutes.` 
      }, { status: 429 });
    }

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
    const hashedCode = hashOtp(otpCode, cleanedPhone);

    // Update OTP properties on user
    user.otp = {
      hashedCode,
      expiresAt,
      attempts: 0, // Reset verification attempts
      lastSentAt: now,
      requestCount: requestCount + 1,
      windowStart: windowStart
    };
    await user.save();

    // Send OTP using Swappable SMS Provider
    const smsProvider = getSmsProvider();
    const message = `Your Returno verification code is ${otpCode}. Valid for 5 minutes.`;
    const deliveryResult = await smsProvider.send(cleanedPhone, message);

    if (!deliveryResult || !deliveryResult.success) {
      return NextResponse.json({ 
        error: `Failed to deliver OTP: ${deliveryResult?.error || 'Provider communication failure'}` 
      }, { status: 502 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP verification code sent successfully!' 
    });

  } catch (error) {
    console.error('OTP Send API Error:', error);
    if (error.message && (error.message.includes('SMS_PROVIDER') || error.message.includes('credentials') || error.message.includes('gateway'))) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
