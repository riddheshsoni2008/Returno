import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import WalletHub from './WalletHub';

export default async function WalletPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  // Fetch from the new Express backend using full URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  let data = null;
  let redirectPath = null;
  
  try {
    const res = await fetch(`${backendUrl}/wallet`, {
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 404) {
        redirectPath = '/auth';
      } else {
        throw new Error('Failed to fetch wallet data');
      }
    } else {
      data = await res.json();
      if (!data.success) {
        redirectPath = '/auth';
      }
    }
  } catch (error) {
    console.error('Error loading wallet:', error);
    redirectPath = '/auth';
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  const { user, walletCards, rewards } = data;

  return (
    <main className="min-h-screen bg-dark-950 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <WalletHub 
          user={user} 
          initialCards={walletCards} 
          initialRewards={rewards} 
        />
      </div>
    </main>
  );
}
