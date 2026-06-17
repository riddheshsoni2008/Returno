import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const business = await Business.findOne({ ownerId: decoded.id });
    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, business });

  } catch (error) {
    console.error('Business Get API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, category, address, longitude, latitude, geofenceRadius, verificationCode } = await request.json();

    let business = await Business.findOne({ ownerId: decoded.id });
    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Update details
    if (name) business.name = name;
    if (category) business.category = category;
    if (address) business.address = address;
    if (verificationCode) business.verificationCode = verificationCode.trim().slice(0, 4);
    if (geofenceRadius) business.geofenceRadius = parseInt(geofenceRadius);
    
    if (longitude !== undefined && latitude !== undefined) {
      business.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    await business.save();

    return NextResponse.json({ success: true, business });

  } catch (error) {
    console.error('Business Save API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
