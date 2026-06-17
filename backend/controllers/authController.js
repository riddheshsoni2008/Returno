import User from '../models/User.js';
import Business from '../models/Business.js';
import { hashPassword, generateToken, hashOtp, verifyPassword, verifyToken } from '../utils/auth.js';
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

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userRole = role === 'business' ? 'business' : 'customer';
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role: userRole,
      passwordHash
    });

    if (userRole === 'business') {
      await Business.create({
        ownerId: user._id,
        name: `${name}'s Business`,
        category: 'Cafe',
        address: 'Set Shop Address',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760] // Mumbai default
        },
        verificationCode: Math.floor(1000 + Math.random() * 9000).toString()
      });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Account uses OAuth. Please login via Google or OTP.' });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Please use OTP login.' });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    return res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !name || !googleId) {
      return res.status(400).json({ error: 'Missing Google profile details' });
    }

    const cleanedEmail = email.toLowerCase().trim();
    let user = await User.findOne({
      $or: [{ googleId }, { email: cleanedEmail }]
    });

    if (!user) {
      user = await User.create({ name, email: cleanedEmail, googleId, role: 'customer' });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    return res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Google OAuth API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[OTP Send] Request received for email: "${email}"`);

    if (!email) {
      console.warn('[OTP Send] Warning: Email address is required but not provided');
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanedEmail = email.toLowerCase().trim();
    console.log(`[OTP Send] Cleaned email: "${cleanedEmail}"`);

    let user = await User.findOne({ email: cleanedEmail });
    if (!user) {
      console.log(`[OTP Send] User not found. Creating a new customer user for: "${cleanedEmail}"`);
      user = await User.create({
        name: `Customer ${cleanedEmail.split('@')[0]}`,
        email: cleanedEmail,
        role: 'customer'
      });
    }

    const now = new Date();
    if (user.otp && user.otp.lastSentAt) {
      const elapsedSeconds = Math.floor((now - new Date(user.otp.lastSentAt)) / 1000);
      if (elapsedSeconds < 30) {
        console.warn(`[OTP Send] Rate limited (cooldown): Wait ${30 - elapsedSeconds}s for: "${cleanedEmail}"`);
        return res.status(429).json({ error: `Please wait ${30 - elapsedSeconds} seconds before requesting another OTP.` });
      }
    }

    const limitWindowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 15;
    let requestCount = user.otp?.requestCount || 0;
    let windowStart = user.otp?.windowStart ? new Date(user.otp.windowStart) : now;

    if (now - windowStart > limitWindowMs) {
      windowStart = now;
      requestCount = 0;
    }

    if (requestCount >= maxRequests) {
      const nextResetTime = new Date(windowStart.getTime() + limitWindowMs);
      const waitMinutes = Math.ceil((nextResetTime - now) / (60 * 1000));
      console.warn(`[OTP Send] Rate limited (max requests): Wait ${waitMinutes}m for: "${cleanedEmail}"`);
      return res.status(429).json({ error: `Too many OTP requests. Please try again in ${waitMinutes} minutes.` });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[OTP Send] Generated OTP Code: "${otpCode}" for "${cleanedEmail}"`);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedCode = hashOtp(otpCode, cleanedEmail);

    user.otp = {
      hashedCode,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      requestCount: requestCount + 1,
      windowStart
    };
    await user.save();
    console.log(`[OTP Send] OTP metadata saved in MongoDB for user: "${cleanedEmail}"`);

    console.log(`[OTP Send] Attempting to deliver email...`);
    const deliveryResult = await sendOtpEmail(cleanedEmail, otpCode);

    if (!deliveryResult || !deliveryResult.success) {
      console.error(`[OTP Send] Email delivery failed: ${deliveryResult?.error}`);
      console.log(`\n==================================================`);
      console.log(`[DEV FALLBACK] Active OTP code for "${cleanedEmail}": ${otpCode}`);
      console.log(`==================================================\n`);

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          success: true,
          message: `[Dev Mode] Email failed but OTP generated! Check backend console.`
        });
      }

      return res.status(502).json({ error: `Failed to deliver OTP: ${deliveryResult?.error || 'Provider communication failure'}` });
    }

    console.log(`[OTP Send] OTP successfully delivered to "${cleanedEmail}"`);
    return res.json({ success: true, message: 'OTP verification code sent successfully to your email!' });
  } catch (error) {
    console.error('[OTP Send] Fatal Controller Error:', error.stack || error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) return res.status(400).json({ error: 'Email address and verification code are required' });

    const cleanedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanedEmail });

    if (!user || !user.otp || !user.otp.hashedCode) {
      return res.status(400).json({ error: 'No active OTP verification session found' });
    }

    if (user.otp.attempts >= 5) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({ error: 'Too many failed verification attempts. Please request a new OTP.' });
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const inputHash = hashOtp(code.trim(), cleanedEmail);
    if (user.otp.hashedCode !== inputHash) {
      const currentAttempts = (user.otp.attempts || 0) + 1;
      if (currentAttempts >= 5) {
        user.otp = undefined;
        await user.save();
        return res.status(400).json({ error: 'Too many failed verification attempts. This OTP has been invalidated. Please request a new one.' });
      }

      user.otp.attempts = currentAttempts;
      await user.save();
      return res.status(400).json({ error: `Invalid verification code. You have ${5 - currentAttempts} attempts remaining.` });
    }

    user.otp = undefined;
    await user.save();

    const token = generateToken(user);
    setTokenCookie(res, token);

    return res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('OTP Verify API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const me = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) return res.json({ user: null });

    const decoded = verifyToken(token);
    if (!decoded) return res.json({ user: null });

    const user = await User.findById(decoded.id).select('-passwordHash -otp');
    if (!user) return res.json({ user: null });

    const userObj = user.toObject();

    if (user.role === 'business') {
      const business = await Business.findOne({ ownerId: user._id });
      userObj.business = business || null;
    }

    return res.json({ success: true, user: userObj });
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
