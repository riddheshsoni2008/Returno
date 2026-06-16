import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import { verifyToken } from '@/lib/auth';
import SettingsHub from './SettingsHub';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect('/auth');
  }

  await dbConnect();
  const user = await User.findById(decoded.id);
  const business = await Business.findOne({ ownerId: user._id });

  if (!business) {
    redirect('/auth');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Shop Configurations</h1>
        <p className="text-slate-400 mt-1">Configure Geofences, redemption validation keys, and billing plans.</p>
      </div>

      <SettingsHub initialBusiness={JSON.parse(JSON.stringify(business))} />
    </div>
  );
}
