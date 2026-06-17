import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SettingsHub from './SettingsHub';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  try {
    const res = await fetch(`${backendUrl}/business`, {
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      redirect('/auth');
    }

    const data = await res.json();
    if (!data.success || !data.business) {
      redirect('/auth');
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Shop Configurations</h1>
          <p className="text-slate-400 mt-1">Configure Geofences, redemption validation keys, and billing plans.</p>
        </div>

        <SettingsHub initialBusiness={data.business} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching settings:', error);
    redirect('/auth');
  }
}
