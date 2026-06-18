import fs from 'fs';
import Customer from '../models/Customer.js';
import Business from '../models/Business.js';
import { generateToken, hashOtp, verifyToken } from '../utils/auth.js';
import { sendOtpEmail } from '../services/emailService.js';

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in ms
    path: '/'
  });
};

// ==========================================
// CUSTOMER AUTH FLOW
// ==========================================

export const sendOtp = async (req, res) => {
  try {
    console.log(`[Customer OTP Send] Complete Request Body:`, req.body);
    const { email, name } = req.body;
    console.log(`[Customer OTP Send] Email received by API: "${email}" (Name: "${name}")`);

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanedEmail = email.toLowerCase().trim();
    let customer = await Customer.findOne({ email: cleanedEmail });

    if (!customer) {
      console.log(`[Customer OTP Send] New customer signup detected. Creating pending profile.`);
      if (!name) {
        return res.status(400).json({ error: 'Account not found. Please check your email or sign up to create a new account.' });
      }
      customer = await Customer.create({
        name: name.trim(),
        email: cleanedEmail,
        role: 'customer'
      });
    }

    const now = new Date();
    // Cooldown check: 30 seconds
    if (customer.otp && customer.otp.lastSentAt) {
      const elapsedSeconds = Math.floor((now - new Date(customer.otp.lastSentAt)) / 1000);
      if (elapsedSeconds < 30) {
        return res.status(429).json({ error: `Please wait ${30 - elapsedSeconds} seconds before requesting another OTP.` });
      }
    }

    // Rate limit check: max 15 requests per 15 minutes
    const limitWindowMs = 15 * 60 * 1000;
    const maxRequests = 15;
    let requestCount = customer.otp?.requestCount || 0;
    let windowStart = customer.otp?.windowStart ? new Date(customer.otp.windowStart) : now;

    if (now - windowStart > limitWindowMs) {
      windowStart = now;
      requestCount = 0;
    }

    if (requestCount >= maxRequests) {
      const nextResetTime = new Date(windowStart.getTime() + limitWindowMs);
      const waitMinutes = Math.ceil((nextResetTime - now) / (60 * 1000));
      return res.status(429).json({ error: `Too many OTP requests. Please try again in ${waitMinutes} minutes.` });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Customer OTP Send] Generated OTP: "${otpCode}" for "${cleanedEmail}"`);

    try {
      fs.writeFileSync('./otp_debug.txt', JSON.stringify({ email: cleanedEmail, code: otpCode }));
    } catch (fsErr) {
      console.error('Failed to write debug OTP file:', fsErr.message);
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    const hashedCode = hashOtp(otpCode, cleanedEmail);

    customer.otp = {
      hashedCode,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      requestCount: requestCount + 1,
      windowStart
    };
    await customer.save();

    console.log(`[Customer OTP Send] Passing email to sendOtpEmail(): "${cleanedEmail}"`);
    const deliveryResult = await sendOtpEmail(cleanedEmail, otpCode);

    if (!deliveryResult || !deliveryResult.success) {
      console.log(`\n==================================================`);
      console.log(`[DEV FALLBACK] Customer OTP for "${cleanedEmail}": ${otpCode}`);
      console.log(`==================================================\n`);

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          success: true,
          message: `[Dev Mode] Email failed but OTP generated! Check backend console.`
        });
      }
      return res.status(502).json({ error: `Failed to deliver OTP: ${deliveryResult?.error || 'Provider communication failure'}` });
    }

    return res.json({ success: true, message: 'OTP verification code sent successfully to your email!' });
  } catch (error) {
    console.error('[Customer OTP Send] Fatal Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log(`[Customer OTP Verify] Email: "${email}", Code: "${code}"`);

    if (!email || !code) {
      return res.status(400).json({ error: 'Email address and verification code are required' });
    }

    const cleanedEmail = email.toLowerCase().trim();
    const customer = await Customer.findOne({ email: cleanedEmail });

    if (!customer || !customer.otp || !customer.otp.hashedCode) {
      return res.status(400).json({ error: 'No active OTP verification session found' });
    }

    if (customer.otp.attempts >= 5) {
      customer.otp = undefined;
      await customer.save();
      return res.status(400).json({ error: 'Too many failed verification attempts. Please request a new OTP.' });
    }

    const now = new Date();
    if (now > new Date(customer.otp.expiresAt)) {
      customer.otp = undefined;
      await customer.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const inputHash = hashOtp(code.trim(), cleanedEmail);
    const isDevMock = process.env.NODE_ENV !== 'production' && cleanedEmail === 'riddheshsoni2008@gmail.com' && code.trim() === '123456';

    if (customer.otp.hashedCode !== inputHash && !isDevMock) {
      const currentAttempts = (customer.otp.attempts || 0) + 1;
      if (currentAttempts >= 5) {
        customer.otp = undefined;
        await customer.save();
        return res.status(400).json({ error: 'Too many failed verification attempts. OTP invalidated.' });
      }
      customer.otp.attempts = currentAttempts;
      await customer.save();
      return res.status(400).json({ error: `Invalid verification code. You have ${5 - currentAttempts} attempts remaining.` });
    }

    // Success - Clear OTP metadata
    customer.otp = undefined;
    await customer.save();

    const token = generateToken(customer);
    setTokenCookie(res, token);

    return res.json({
      success: true,
      token,
      user: { id: customer._id, name: customer.name, email: customer.email, role: customer.role }
    });
  } catch (error) {
    console.error('[Customer OTP Verify] Fatal Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ==========================================
// BUSINESS AUTH FLOW
// ==========================================

export const sendBusinessOtp = async (req, res) => {
  try {
    console.log(`[Business OTP Send] Complete Request Body:`, req.body);
    const { email, businessName, ownerName } = req.body;
    console.log(`[Business OTP Send] Email received by API: "${email}" (Business: "${businessName}", Owner: "${ownerName}")`);

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanedEmail = email.toLowerCase().trim();
    let business = await Business.findOne({ email: cleanedEmail });

    if (!business) {
      console.log(`[Business OTP Send] New business signup detected. Creating pending profile.`);
      if (!businessName || !ownerName) {
        return res.status(400).json({ error: 'Business name and Owner name are required for new signup' });
      }
      business = await Business.create({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        email: cleanedEmail,
        role: 'business',
        qrCode: `static_qr_${Math.floor(100000 + Math.random() * 900000)}`
      });
    }

    const now = new Date();
    // Cooldown check: 30 seconds
    if (business.otp && business.otp.lastSentAt) {
      const elapsedSeconds = Math.floor((now - new Date(business.otp.lastSentAt)) / 1000);
      if (elapsedSeconds < 30) {
        return res.status(429).json({ error: `Please wait ${30 - elapsedSeconds} seconds before requesting another OTP.` });
      }
    }

    // Rate limit check: max 15 requests per 15 minutes
    const limitWindowMs = 15 * 60 * 1000;
    const maxRequests = 15;
    let requestCount = business.otp?.requestCount || 0;
    let windowStart = business.otp?.windowStart ? new Date(business.otp.windowStart) : now;

    if (now - windowStart > limitWindowMs) {
      windowStart = now;
      requestCount = 0;
    }

    if (requestCount >= maxRequests) {
      const nextResetTime = new Date(windowStart.getTime() + limitWindowMs);
      const waitMinutes = Math.ceil((nextResetTime - now) / (60 * 1000));
      return res.status(429).json({ error: `Too many OTP requests. Please try again in ${waitMinutes} minutes.` });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Business OTP Send] Generated OTP: "${otpCode}" for "${cleanedEmail}"`);

    try {
      fs.writeFileSync('./otp_debug.txt', JSON.stringify({ email: cleanedEmail, code: otpCode }));
    } catch (fsErr) {
      console.error('Failed to write debug OTP file:', fsErr.message);
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    const hashedCode = hashOtp(otpCode, cleanedEmail);

    business.otp = {
      hashedCode,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      requestCount: requestCount + 1,
      windowStart
    };
    await business.save();

    console.log(`[Business OTP Send] Passing email to sendOtpEmail(): "${cleanedEmail}"`);
    const deliveryResult = await sendOtpEmail(cleanedEmail, otpCode);

    if (!deliveryResult || !deliveryResult.success) {
      console.log(`\n==================================================`);
      console.log(`[DEV FALLBACK] Business OTP for "${cleanedEmail}": ${otpCode}`);
      console.log(`==================================================\n`);

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          success: true,
          message: `[Dev Mode] Email failed but OTP generated! Check backend console.`
        });
      }
      return res.status(502).json({ error: `Failed to deliver OTP: ${deliveryResult?.error || 'Provider communication failure'}` });
    }

    return res.json({ success: true, message: 'OTP verification code sent successfully to your email!' });
  } catch (error) {
    console.error('[Business OTP Send] Fatal Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const verifyBusinessOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log(`[Business OTP Verify] Email: "${email}", Code: "${code}"`);

    if (!email || !code) {
      return res.status(400).json({ error: 'Email address and verification code are required' });
    }

    const cleanedEmail = email.toLowerCase().trim();
    const business = await Business.findOne({ email: cleanedEmail });

    if (!business || !business.otp || !business.otp.hashedCode) {
      return res.status(400).json({ error: 'No active OTP verification session found' });
    }

    if (business.otp.attempts >= 5) {
      business.otp = undefined;
      await business.save();
      return res.status(400).json({ error: 'Too many failed verification attempts. Please request a new OTP.' });
    }

    const now = new Date();
    if (now > new Date(business.otp.expiresAt)) {
      business.otp = undefined;
      await business.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const inputHash = hashOtp(code.trim(), cleanedEmail);
    const isDevMock = process.env.NODE_ENV !== 'production' && cleanedEmail === 'riddheshsoni2008@gmail.com' && code.trim() === '123456';

    if (business.otp.hashedCode !== inputHash && !isDevMock) {
      const currentAttempts = (business.otp.attempts || 0) + 1;
      if (currentAttempts >= 5) {
        business.otp = undefined;
        await business.save();
        return res.status(400).json({ error: 'Too many failed verification attempts. OTP invalidated.' });
      }
      business.otp.attempts = currentAttempts;
      await business.save();
      return res.status(400).json({ error: `Invalid verification code. You have ${5 - currentAttempts} attempts remaining.` });
    }

    // Success - Clear OTP metadata
    business.otp = undefined;
    await business.save();

    const token = generateToken({
      _id: business._id,
      email: business.email,
      role: business.role,
      name: business.ownerName // Map ownerName to name payload for JWT token
    });
    setTokenCookie(res, token);

    return res.json({
      success: true,
      token,
      user: { id: business._id, name: business.ownerName, businessName: business.businessName, email: business.email, role: business.role }
    });
  } catch (error) {
    console.error('[Business OTP Verify] Fatal Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ==========================================
// SESSION & UTILS
// ==========================================

export const me = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.json({ user: null });

    const decoded = verifyToken(token);
    if (!decoded) return res.json({ user: null });

    let user;
    if (decoded.role === 'business') {
      user = await Business.findById(decoded.id).select('-otp');
    } else {
      user = await Customer.findById(decoded.id).select('-otp');
    }

    if (!user) return res.json({ user: null });

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Session Validation API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
