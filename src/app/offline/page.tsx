"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-6 text-center">
      {/* CTK Logo placeholder */}
      <div className="w-20 h-20 rounded-full bg-[#b4040d] flex items-center justify-center mb-6 shadow-lg">
        <span className="text-white font-bold text-2xl">CTK</span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">You&apos;re Offline</h1>
      <p className="text-slate-400 text-sm mb-1">Christ the King Catholic School</p>
      <p className="text-slate-400 text-sm mb-8">Enrollment Management System</p>

      <div className="bg-[#16213e] border border-slate-700 rounded-xl px-6 py-5 max-w-sm w-full mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <p className="text-amber-400 text-sm font-medium">No internet connection</p>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">
          Please check your network connection and try again. Your enrollment data
          is safely stored and will sync automatically when you&apos;re back online.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="bg-[#b4040d] hover:bg-[#9a0309] text-white font-semibold px-8 py-2.5 rounded-lg text-sm transition-colors"
      >
        Try Again
      </button>

      <p className="text-slate-600 text-xs mt-8">
        CTK EnrollSys &middot; Olongapo City
      </p>
    </div>
  );
}
