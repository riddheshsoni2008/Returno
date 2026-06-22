import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MerchantCustomersHub from './MerchantCustomersHub';

export default async function MerchantCustomersPage() {
 const cookieStore = await cookies();
 const token = cookieStore.get('token')?.value;

 if (!token) {
 redirect('/merchant/auth');
 }

 const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
 let metrics = null;

 try {
 const metRes = await fetch(`${backendUrl}/business/metrics`, {
 headers: { 'Cookie': `token=${token}` },
 cache: 'no-store'
 });
 
 if (metRes.ok) {
 const metData = await metRes.json();
 if (metData.success) {
 metrics = metData.metrics;
 }
 }
 } catch (error) {
 console.error('Error fetching customers metrics:', error);
 }

 if (!metrics) {
 metrics = {
 recentStamps: [],
 uniqueCustomers: 0,
 joinedCustomers: []
 };
 }

 const { recentStamps, joinedCustomers = [] } = metrics;

 return (
 <MerchantCustomersHub
 initialJoinedCustomers={joinedCustomers}
 initialRecentStamps={recentStamps}
 />
 );
}
