import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SettingsHub from './SettingsHub';

export default async function MerchantSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/merchant/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  let business = null;

  try {
    const res = await fetch(`${backendUrl}/business`, {
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      business = data.business;
    }
  } catch (error) {
    console.error('Settings fetch error:', error);
  }

  if (!business) {
    redirect('/merchant/auth');
  }

  return (
    <div className="space-y-8 text-slate-800 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Configuration Hub</h1>
        <p className="text-sm text-slate-500 mt-1">Configure shop metadata, address, and regional location parameters.</p>
      </div>

      <SettingsHub initialBusiness={business} />
    </div>
  );
}
