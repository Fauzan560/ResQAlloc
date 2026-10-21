import React, { useState } from 'react';
import { emergencyService } from '../services/api';
import { HYDERABAD_ZONES } from '../data/hyderabadLocations';
import { 
  Flame, 
  MapPin, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle2, 
  HeartHandshake, 
  ShieldAlert, 
  Compass, 
  Clock, 
  ChevronRight,
  LifeBuoy
} from 'lucide-react';

export const PublicEmergencyPage = () => {
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    category: 'Cardiac',
    description: '',
    contactPhone: '',
    latitude: 17.4156,
    longitude: 78.4354,
    address: 'Banjara Hills (Road No. 12), Hyderabad'
  });

  const [loading, setLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const emergencyCategories = [
    { id: 'Cardiac', label: 'Heart Attack / Chest Pain', icon: '❤️', color: 'border-red-500 bg-red-950/40 text-red-300' },
    { id: 'Trauma', label: 'Severe Road Accident / Trauma', icon: '💥', color: 'border-orange-500 bg-orange-950/40 text-orange-300' },
    { id: 'Breathing', label: 'Severe Breathing Trouble / Choking', icon: '🫁', color: 'border-amber-500 bg-amber-950/40 text-amber-300' },
    { id: 'Stroke', label: 'Stroke / Facial Droop / Paralysis', icon: '🧠', color: 'border-purple-500 bg-purple-950/40 text-purple-300' },
    { id: 'Pregnancy', label: 'Labor / Pregnancy Emergency', icon: '🤰', color: 'border-pink-500 bg-pink-950/40 text-pink-300' },
    { id: 'Burn', label: 'Severe Burn / Fire Injury', icon: '🔥', color: 'border-rose-500 bg-rose-950/40 text-rose-300' },
    { id: 'Other', label: 'Other Critical Emergency', icon: '🚨', color: 'border-blue-500 bg-blue-950/40 text-blue-300' },
  ];

  const handleZoneSelect = (zone) => {
    setFormData(prev => ({
      ...prev,
      latitude: zone.latitude,
      longitude: zone.longitude,
      address: `${zone.name}, Hyderabad`
    }));
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: `GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        }));
      },
      (err) => {
        setLocating(false);
        console.warn('GPS error, using default Hyderabad location:', err.message);
        // Default to central Hyderabad
        setFormData(prev => ({
          ...prev,
          latitude: 17.3850,
          longitude: 78.4867,
          address: 'Central Hyderabad (Near Abids)'
        }));
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.chiefComplaint) {
      setError('Please provide a brief description of the medical emergency.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        chiefComplaint: `[${formData.category}] ${formData.chiefComplaint}`,
        description: formData.description,
        contactPhone: formData.contactPhone,
        location: {
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address
        }
      };

      const res = await emergencyService.submitPublicReport(payload);
      if (res.data?.success) {
        setSubmittedReport(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Emergency Header Alert */}
      <div className="glass-panel border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 mb-8 text-center relative overflow-hidden shadow-glow-red">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
          <Flame className="w-4 h-4 text-red-500" />
          Hyderabad Public Emergency Portal
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Report a Medical Emergency
        </h1>
        <p className="text-slate-300 text-sm max-w-xl mx-auto mt-2 leading-relaxed">
          Request immediate dispatch support or notify nearby Hyderabad emergency hospitals.
        </p>

        {/* Immediate Call to Action */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <a
            href="tel:108"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-base shadow-lg hover:shadow-glow-red transition-all scale-100 hover:scale-105"
          >
            <PhoneCall className="w-5 h-5 animate-bounce" />
            <span>Call 108 (Ambulance)</span>
          </a>
          <a
            href="tel:112"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-base transition-all"
          >
            <PhoneCall className="w-5 h-5 text-amber-400" />
            <span>Call 112 (National SOS)</span>
          </a>
        </div>
      </div>

      {submittedReport ? (
        /* Submission Success & Guidance View */
        <div className="glass-panel rounded-3xl p-8 border border-emerald-500/50 shadow-2xl animate-in zoom-in-95">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-glow-emerald">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Emergency Report Registered!</h2>
            <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-amber-300">
              Reference Case ID: <strong className="text-white">{submittedReport.caseId}</strong>
            </div>
            <p className="text-slate-300 text-sm mt-3 max-w-md mx-auto">
              Our nearest emergency response unit and 99 Hyderabad network hospitals have been alerted.
            </p>
          </div>

          {/* First Aid Guidance While Waiting */}
          <div className="border-t border-slate-800 pt-6 mt-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <HeartHandshake className="w-5 h-5 text-red-400" />
              Critical Life-Saving Steps While Help Arrives:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="glass-card p-4 rounded-xl border border-slate-700/80">
                <span className="font-bold text-red-300 block text-sm mb-1">1. Cardiac Arrest / Unresponsive</span>
                <p className="text-slate-400 leading-relaxed">
                  If patient is unconscious and not breathing normally, place heel of hand in center of chest and push hard and fast (100–120 beats/min).
                </p>
              </div>

              <div className="glass-card p-4 rounded-xl border border-slate-700/80">
                <span className="font-bold text-amber-300 block text-sm mb-1">2. Severe Bleeding</span>
                <p className="text-slate-400 leading-relaxed">
                  Apply firm, direct pressure over the wound using a clean cloth. Do not remove soaked cloths; place more on top. Elevate if possible.
                </p>
              </div>

              <div className="glass-card p-4 rounded-xl border border-slate-700/80">
                <span className="font-bold text-blue-300 block text-sm mb-1">3. Airway / Breathing Difficulty</span>
                <p className="text-slate-400 leading-relaxed">
                  Loosen tight clothing around neck and waist. Keep patient in a comfortable seated posture. Do NOT give water to a choking patient.
                </p>
              </div>

              <div className="glass-card p-4 rounded-xl border border-slate-700/80">
                <span className="font-bold text-purple-300 block text-sm mb-1">4. Seizure / Convulsions</span>
                <p className="text-slate-400 leading-relaxed">
                  Clear surrounding hard objects. Protect their head with something soft. Do NOT place anything inside their mouth. Turn onto side once convulsions stop.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setSubmittedReport(null);
                setFormData(prev => ({ ...prev, chiefComplaint: '', description: '' }));
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        /* Emergency Form */
        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. What is the nature of the emergency? *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {emergencyCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    formData.category === cat.id
                      ? `${cat.color} border-2 shadow-lg scale-[1.02]`
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="font-semibold leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Chief Complaint & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                2. Describe the patient's symptoms / emergency *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Severe chest pain, fainting, difficulty breathing, road accident..."
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Age, conscious/unconscious, landmarks, active bleeding..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* 3. Location Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Incident Location (Hyderabad) *
              </label>
              <button
                type="button"
                onClick={handleUseGPS}
                disabled={locating}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-800/40 transition-colors"
              >
                <Compass className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Detecting GPS...' : 'Use My Live GPS'}
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter area or select a quick landmark below"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            {/* Quick Landmark Presets */}
            <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Quick Hyderabad Landmarks:</div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {HYDERABAD_ZONES.slice(0, 10).map((zone, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleZoneSelect(zone)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                    formData.latitude === zone.latitude && formData.longitude === zone.longitude
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200 font-semibold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {zone.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Contact Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              4. Contact Phone Number (For Ambulance Callbacks)
            </label>
            <input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-glow-red transition-all flex items-center justify-center gap-2"
            >
              <Flame className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Transmitting Emergency Report...' : 'Transmit Emergency Alert Now'}
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            * In case of severe, life-threatening symptoms, dial <strong className="text-white">108</strong> immediately without waiting.
          </div>

        </form>
      )}

    </div>
  );
};

export default PublicEmergencyPage;
