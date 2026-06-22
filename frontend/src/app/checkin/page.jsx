"use client";

import { Suspense } from 'react';
import CheckinClient from './CheckinClient';

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-text-secondary font-medium">Processing check-in...</p>
        </div>
      </div>
    }>
      <CheckinClient />
    </Suspense>
  );
}
