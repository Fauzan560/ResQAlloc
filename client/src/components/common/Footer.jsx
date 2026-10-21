import React from 'react';
import { Activity, ShieldAlert, Heart, PhoneCall, Code2, Database, Cpu } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="glass-panel border-t border-slate-800/80 mt-auto py-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/60">
          
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center">
                <Activity className="w-4 h-4 text-red-500" />
              </div>
              <span className="font-bold text-base text-white">ResQAlloc</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Intelligent emergency medical dispatch system integrating Korean Triage & Acuity Scale (KTAS) with multi-criteria hospital resource allocation across 99 Hyderabad healthcare facilities.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-amber-400/90 font-mono bg-amber-950/40 px-2 py-1 rounded border border-amber-900/50">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Academic Demonstration System</span>
            </div>
          </div>

          {/* Quick Helplines */}
          <div className="space-y-2">
            <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-400" /> Emergency Helplines
            </h5>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-300">National Emergency (All)</span>
                <span className="font-bold font-mono text-red-400">112</span>
              </li>
              <li className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-300">Ambulance Services</span>
                <span className="font-bold font-mono text-red-400">108</span>
              </li>
              <li className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-300">Pregnant Women & Infant</span>
                <span className="font-bold font-mono text-amber-400">102</span>
              </li>
              <li className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-300">Telangana Health Helpline</span>
                <span className="font-bold font-mono text-blue-400">104</span>
              </li>
            </ul>
          </div>

          {/* System Architecture */}
          <div className="space-y-2">
            <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> Pipeline Architecture
            </h5>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>Stage 1: KTAS Severity Classification</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Stage 2: Capability & Resource Filtering</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Stage 3: Multi-Criteria Ranked Matching</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Stage 4: OSRM Road Route & Travel Time</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>Stage 5: Relaxation & Fallback Strategy</span>
              </li>
            </ul>
          </div>

          {/* Dataset & Tech */}
          <div className="space-y-2">
            <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Dataset Notice
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Contains 99 verified Hyderabad hospitals with original names, areas, and emergency capabilities. Hospital bed capacities, ICU availability, and coordinates are synthetically generated for simulation and research modeling.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">React + Vite</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Express.js</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">MongoDB</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Flask KTAS</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">OSRM Road Engine</span>
            </div>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© 2026 ResQAlloc Project. Developed for emergency healthcare research and clinical resource allocation studies.</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              99 Hyderabad Hospitals Active
            </span>
            <span>•</span>
            <span>OSRM Road Engine Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
