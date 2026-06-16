import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import { hashPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await dbConnect();
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    }, { status: 201 });

  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
