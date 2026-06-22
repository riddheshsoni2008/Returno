"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function QRScannerModal({ onClose }) {
 const [error, setError] = useState('');
 const scannerRef = useRef(null);
 const router = useRouter();

 useEffect(() => {
 const html5QrCode = new Html5Qrcode("qr-reader");

 const config = { fps: 10, qrbox: { width: 250, height: 250 } };

 html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
 // Handle the scanned code
 html5QrCode.stop().then(() => {
 // Parse the URL to find the route
 try {
 const url = new URL(decodedText);
 const pathname = url.pathname;
 const search = url.search;

 if (pathname.startsWith('/join') || pathname.startsWith('/checkin')) {
 router.push(pathname + search);
 } else {
 setError('Invalid QR code format. Please scan a valid Returno QR code.');
 }
 } catch (e) {
 // If it's not a valid URL but just a path
 if (decodedText.startsWith('/join') || decodedText.startsWith('/checkin')) {
 router.push(decodedText);
 } else {
 setError('Invalid QR code format. Please scan a valid Returno QR code.');
 }
 }
 }).catch((err) => {
 console.error("Failed to stop scanner", err);
 });
 }, (errorMessage) => {
 // parse errors, normally ignored
 }).catch((err) => {
 console.error("Error starting scanner", err);
 setError('Could not access camera. Please allow camera permissions.');
 });

 scannerRef.current = html5QrCode;

 return () => {
 if (scannerRef.current && scannerRef.current.isScanning) {
 scannerRef.current.stop().catch(console.error);
 }
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps 
 }, []);

 return (
 <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4">
 <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative overflow-hidden text-center space-y-4">
 <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Scan QR Code</h3>

 {error ? (
 <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold">
 {error}
 </div>
 ) : (
 <p className="text-xs text-text-secondary font-medium">Point your camera at the shop&apos;s QR code</p>
 )}

 <div className="mx-auto overflow-hidden rounded-2xl border-4 border-border-standard shadow-inner" style={{ width: '100%', maxWidth: '300px' }}>
 <div id="qr-reader" className="w-full"></div>
 </div>

 <button
 onClick={() => {
 if (scannerRef.current && scannerRef.current.isScanning) {
 scannerRef.current.stop().catch(console.error);
 }
 onClose();
 }}
 className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider mt-4"
 >
 Cancel
 </button>
 </div>
 </div>
 );
}
