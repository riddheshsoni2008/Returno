import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CampaignsHub from './CampaignsHub';

export default async function CampaignsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  let data = null;
  let redirectPath = null;

  try {
    const res = await fetch(`${backendUrl}/campaigns`, {
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      redirectPath = '/auth';
    } else {
      data = await res.json();
      if (!data.success || !data.campaigns) {
        redirectPath = '/auth';
      }
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    redirectPath = '/auth';
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Campaign Manager</h1>
        <p className="text-slate-400 mt-1">Configure and manage active stamp reward cards for your customers.</p>
      </div>

      <CampaignsHub initialCampaigns={data.campaigns} />
    </div>
  );
}
