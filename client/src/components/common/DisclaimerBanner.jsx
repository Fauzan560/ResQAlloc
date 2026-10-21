import React, { useState } from 'react';
import { AlertTriangle, PhoneCall, X, Info } from 'lucide-react';

export const DisclaimerBanner = () => {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/90 via-red-950/90 to-amber-950/90 border-b border-amber-500/30 text-amber-200 text-xs py-2 px-4 shadow-lg backdrop-blur-md relative z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="font-bold tracking-wider text-amber-300 uppercase px-1.5 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-[10px]">
            Academic Demo Notice
          </span>
          <span className="text-slate-300">
            ResQAlloc uses <strong className="text-amber-200 font-semibold">synthetic hospital capacity</strong> & <strong className="text-amber-200 font-semibold">approximate coordinates</strong> for 99 Hyderabad hospitals. Not approved for real-world clinical deployment.
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-red-900/40 border border-red-500/30 px-2 py-0.5 rounded-full text-red-200">
            <PhoneCall className="w-3.5 h-3.5 text-red-400" />
            <span className="font-medium">Real Emergency? Dial:</span>
            <a href="tel:108" className="font-bold text-white underline hover:text-red-300">108</a>
            <span>/</span>
            <a href="tel:112" className="font-bold text-white underline hover:text-red-300">112</a>
          </div>

          <button
            onClick={() => setClosed(true)}
            className="text-amber-400/80 hover:text-white transition-colors p-1 rounded-full hover:bg-amber-900/50"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
