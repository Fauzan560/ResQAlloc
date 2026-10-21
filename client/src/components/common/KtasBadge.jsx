import React from 'react';
import { AlertCircle, Clock, Zap, ShieldAlert, HeartPulse } from 'lucide-react';

export const KTAS_LEVEL_CONFIG = {
  1: {
    level: 1,
    label: 'Resuscitation',
    shortLabel: 'L1 - Resuscitation',
    color: 'border-red-500 bg-red-500/20 text-red-200 shadow-glow-red',
    badgeColor: 'bg-red-500 text-white',
    maxWait: 'Immediate (< 0 min)',
    desc: 'Threat to life or limb requiring immediate aggressive intervention.',
    icon: Zap
  },
  2: {
    level: 2,
    label: 'Emergent',
    shortLabel: 'L2 - Emergent',
    color: 'border-orange-500 bg-orange-500/20 text-orange-200',
    badgeColor: 'bg-orange-500 text-white',
    maxWait: '< 15 mins',
    desc: 'Potential threat to life, limb, or organ function requiring rapid medical care.',
    icon: AlertCircle
  },
  3: {
    level: 3,
    label: 'Urgent',
    shortLabel: 'L3 - Urgent',
    color: 'border-yellow-500 bg-yellow-500/20 text-yellow-200',
    badgeColor: 'bg-yellow-500 text-slate-900',
    maxWait: '< 30 mins',
    desc: 'Condition could progress to a serious problem requiring emergency intervention.',
    icon: ShieldAlert
  },
  4: {
    level: 4,
    label: 'Less Urgent',
    shortLabel: 'L4 - Less Urgent',
    color: 'border-emerald-500 bg-emerald-500/20 text-emerald-200',
    badgeColor: 'bg-emerald-500 text-white',
    maxWait: '< 60 mins',
    desc: 'Conditions related to patient age, distress, or potential for complications.',
    icon: HeartPulse
  },
  5: {
    level: 5,
    label: 'Non-Urgent',
    shortLabel: 'L5 - Non-Urgent',
    color: 'border-blue-500 bg-blue-500/20 text-blue-200',
    badgeColor: 'bg-blue-500 text-white',
    maxWait: '< 120 mins',
    desc: 'Non-urgent conditions that may be acute but do not require immediate emergency care.',
    icon: Clock
  }
};

export const KtasBadge = ({ level = 3, size = 'md', showDetails = false }) => {
  const config = KTAS_LEVEL_CONFIG[level] || KTAS_LEVEL_CONFIG[3];
  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${level <= 2 ? 'animate-ping' : ''} bg-current`} />
        KTAS {level}: {config.label}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`p-4 rounded-xl border-2 ${config.color} backdrop-blur-md`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${config.badgeColor}`}>
              L{level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-lg text-white">KTAS Level {level}: {config.label}</h4>
                {level === 1 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-red-600 text-white animate-pulse">
                    CRITICAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{config.desc}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Max Wait</span>
            <span className="font-mono font-bold text-sm text-white">{config.maxWait}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${config.color}`}>
      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${config.badgeColor}`}>
        {level}
      </span>
      <div className="flex flex-col">
        <span className="text-xs font-bold tracking-tight">KTAS {level} — {config.label}</span>
        {showDetails && (
          <span className="text-[10px] opacity-80 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Target: {config.maxWait}
          </span>
        )}
      </div>
    </div>
  );
};

export default KtasBadge;
