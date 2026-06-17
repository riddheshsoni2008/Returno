import PrintButton from './PrintButton';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';

export default async function QrCodesPage(props) {
  const searchParams = await props.searchParams;
  const campaignQueryId = searchParams.campaign;

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  let campaigns = [];
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
      const data = await res.json();
      if (!data.success) {
        redirectPath = '/auth';
      } else {
        campaigns = data.campaigns || [];
      }
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    redirectPath = '/auth';
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-20 bg-dark-900 border border-white/10 rounded-3xl space-y-6">
        <div className="text-5xl">🖨️</div>
        <h2 className="text-2xl font-bold">No Active Campaigns</h2>
        <p className="text-slate-400 max-w-sm mx-auto">You need to launch a loyalty campaign first before generating QR codes.</p>
        <Link
          href="/dashboard/campaigns"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold transition-all shadow-md"
        >
          ➕ Create Campaign
        </Link>
      </div>
    );
  }

  let selectedCampaign = campaigns[0];
  if (campaignQueryId) {
    const found = campaigns.find(c => c._id.toString() === campaignQueryId);
    if (found) {
      selectedCampaign = found;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const scanUrl = `${appUrl}/scan/${selectedCampaign._id}`;

  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 320,
    margin: 2,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff'
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">QR Codes Hub</h1>
        <p className="text-slate-400 mt-1">Download and print QR codes to display at checkouts and counters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-dark-900 border border-white/10 rounded-2xl p-6 h-fit space-y-4">
          <h3 className="font-bold text-slate-200">Select Campaign QR</h3>
          <div className="space-y-2">
            {campaigns.map((camp) => (
              <Link
                key={camp._id}
                href={`/dashboard/qrcodes?campaign=${camp._id}`}
                className={`block p-4 rounded-xl text-left border transition-all ${camp._id.toString() === selectedCampaign._id.toString()
                  ? 'bg-purple-600/10 border-purple-500 text-white shadow-lg'
                  : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
              >
                <div className="font-bold text-sm truncate">{camp.title}</div>
                <div className="text-[10px] opacity-75 mt-1 truncate">Unlocks: {camp.rewardTitle}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-dark-900 border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center">
          <div className="bg-white p-4 rounded-2xl shadow-2xl flex-shrink-0">
            <img
              src={qrDataUrl}
              alt={`QR Code for ${selectedCampaign.title}`}
              className="w-64 h-64 select-none pointer-events-none"
            />
          </div>

          <div className="space-y-6 flex-1 w-full text-center md:text-left">
            <div>
              <span className="text-[10px] font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20 uppercase tracking-wider">
                Print Assets Ready
              </span>
              <h3 className="text-2xl font-black text-slate-100 mt-3">{selectedCampaign.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Stickers on checkout counters, table tent cards, or receipt inserts are great places to put this QR code.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Target Scan Link</div>
              <div className="text-xs font-mono text-slate-300 break-all select-all select-none">{scanUrl}</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={qrDataUrl}
                download={`returno-qr-${selectedCampaign._id}.png`}
                className="flex-1 text-center py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
              >
                💾 Download QR Image
              </a>
              <PrintButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
