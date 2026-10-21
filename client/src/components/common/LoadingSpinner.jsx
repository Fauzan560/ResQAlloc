import React from 'react';
import { Activity } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Processing clinical parameters...', subtext = '' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-4">
        {/* Pulsing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 animate-ping absolute inset-0"></div>
        {/* Rotating ring */}
        <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-red-500 border-r-blue-500 animate-spin"></div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-200">{message}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1 max-w-xs">{subtext}</p>}
    </div>
  );
};

export default LoadingSpinner;
