import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'returno-enterprise-secure-jwt-key-2026';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id.toString(), 
      email: user.email, 
      role: user.role, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function hashOtp(otp, phone) {
  const secret = process.env.JWT_SECRET || 'returno-enterprise-secure-jwt-key-2026';
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`${otp}-${phone}-${secret}`).digest('hex');
}

