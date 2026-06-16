'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all border border-white/10"
    >
      🖨️ Print Stamp Card
    </button>
  );
}
