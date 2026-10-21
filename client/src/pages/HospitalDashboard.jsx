import React, { useState, useEffect } from 'react';
import { referralService, resourceService, hospitalService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KtasBadge } from '../components/common/KtasBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  Building2, 
  Bed, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Save, 
  RefreshCw, 
  Layers, 
  Sliders, 
  ShieldAlert, 
  UserCheck, 
  Flame,
  PhoneCall
} from 'lucide-react';

export const HospitalDashboard = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Referrals
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(true);

  // Resources
  const [resources, setResources] = useState({
    icuBedsAvailable: 8,
    totalBedsAvailable: 45,
    ventilatorsAvailable: 4,
    oxygenCylindersAvailable: 25,
    bloodUnitsAvailable: 18,
    emergencyOTAvailable: true,
    cathLabAvailable: true,
    ctScanAvailable: true
  });
  const [resourceLoading, setResourceLoading] = useState(false);
  const [savingResources, setSavingResources] = useState(false);
  const [resourceSaveMessage, setResourceSaveMessage] = useState('');

  // Referral response modal
  const [responseModal, setResponseModal] = useState({
    open: false,
    referralId: null,
    action: 'accept',
    notes: ''
  });
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospitalId) {
      loadHospitalDetails(selectedHospitalId);
      loadReferrals(selectedHospitalId);
      loadResources(selectedHospitalId);
    }
  }, [selectedHospitalId]);

  const loadHospitals = async () => {
    try {
      const res = await hospitalService.getAll({ limit: 100 });
      if (res.data?.data) {
        setHospitals(res.data.data);
        // Default to assigned hospital or first hospital
        const defaultId = user?.assignedHospital?._id || user?.assignedHospital || res.data.data[0]?._id;
        setSelectedHospitalId(defaultId);
      }
    } catch (err) {
      console.error('Error loading hospitals:', err);
    }
  };

  const loadHospitalDetails = async (id) => {
    try {
      const res = await hospitalService.getById(id);
      if (res.data?.data) {
        setSelectedHospital(res.data.data);
      }
    } catch (err) {
      console.warn('Hospital detail fetch error:', err);
    }
  };

  const loadReferrals = async (hospId) => {
    try {
      setReferralsLoading(true);
      const res = await referralService.getReferrals();
      if (res.data?.data) {
        // Filter referrals for current hospital if not done by backend
        const filtered = res.data.data.filter(r => 
          (r.toHospital?._id || r.toHospital)?.toString() === hospId.toString()
        );
        setReferrals(filtered.length > 0 ? filtered : res.data.data.slice(0, 5));
      }
    } catch (err) {
      console.warn('Referrals fetch error:', err);
    } finally {
      setReferralsLoading(false);
    }
  };

  const loadResources = async (hospId) => {
    try {
      setResourceLoading(true);
      const res = await resourceService.getByHospital(hospId);
      if (res.data?.data) {
        const d = res.data.data;
        setResources({
          icuBedsAvailable: d.icuBedsAvailable ?? 8,
          totalBedsAvailable: d.totalBedsAvailable ?? 45,
          ventilatorsAvailable: d.ventilatorsAvailable ?? 4,
          oxygenCylindersAvailable: d.oxygenCylindersAvailable ?? 25,
          bloodUnitsAvailable: d.bloodUnitsAvailable ?? 18,
          emergencyOTAvailable: d.emergencyOTAvailable ?? true,
          cathLabAvailable: d.cathLabAvailable ?? true,
          ctScanAvailable: d.ctScanAvailable ?? true
        });
      }
    } catch (err) {
      // Default fallback resource values if none exist in DB yet
      setResources({
        icuBedsAvailable: 6,
        totalBedsAvailable: 35,
        ventilatorsAvailable: 3,
        oxygenCylindersAvailable: 20,
        bloodUnitsAvailable: 14,
        emergencyOTAvailable: true,
        cathLabAvailable: true,
        ctScanAvailable: true
      });
    } finally {
      setResourceLoading(false);
    }
  };

  const handleSaveResources = async () => {
    if (!selectedHospitalId) return;
    try {
      setSavingResources(true);
      setResourceSaveMessage('');
      const res = await resourceService.updateByHospital(selectedHospitalId, resources);
      if (res.data?.success) {
        setResourceSaveMessage('Resources updated and synchronized with dispatch engine!');
        setTimeout(() => setResourceSaveMessage(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving resources');
    } finally {
      setSavingResources(false);
    }
  };

  const handleOpenResponseModal = (referralId, action) => {
    setResponseModal({
      open: true,
      referralId,
      action,
      notes: action === 'accept' ? 'Trauma bay and ICU bed pre-alerted and reserved.' : 'ICU at full capacity. Divert to nearest secondary facility.'
    });
  };

  const handleConfirmResponse = async () => {
    try {
      setResponding(true);
      await referralService.respondReferral(
        responseModal.referralId,
        responseModal.action,
        responseModal.notes
      );
      setResponseModal({ open: false, referralId: null, action: 'accept', notes: '' });
      loadReferrals(selectedHospitalId);
    } catch (err) {
      alert(err.response?.data?.message || 'Error responding to referral');
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Hospital Staff Command Portal</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                Authorized Intake View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage incoming emergency patient referrals and update real-time bed/equipment availability.
            </p>
          </div>
        </div>

        {/* Hospital Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs text-slate-400 shrink-0 font-medium">Selected Hospital:</label>
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="w-full md:w-72 px-3 py-2 rounded-xl glass-input text-xs font-semibold bg-slate-900 border-slate-700 text-white"
          >
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name} ({h.area})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hospital Identity Card */}
      {selectedHospital && (
        <div className="glass-card p-4 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
              🏥
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{selectedHospital.name}</h3>
              <p className="text-slate-400 text-[11px]">{selectedHospital.area}, Hyderabad • Type: <strong className="text-slate-300">{selectedHospital.type}</strong></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
              Emergency 24/7: <strong className="text-emerald-400">{selectedHospital.hasEmergency ? 'Active' : 'No'}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
              Trauma Center: <strong className="text-emerald-400">{selectedHospital.hasTraumaCenter ? 'Yes' : 'No'}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
              Blood Bank: <strong className="text-emerald-400">{selectedHospital.hasBloodBank ? 'Yes' : 'No'}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40">
              Data: Synthetic Model
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Referrals Queue (Left) & Resource Availability Manager (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Referrals Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                <h2 className="font-bold text-sm text-white uppercase tracking-wider">
                  Incoming Emergency Referrals Queue
                </h2>
              </div>
              <button
                onClick={() => loadReferrals(selectedHospitalId)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Refresh referrals"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {referralsLoading ? (
              <LoadingSpinner message="Checking incoming dispatch referrals..." />
            ) : referrals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-60" />
                <p>No pending emergency referrals for this hospital right now.</p>
                <span className="text-[10px] text-slate-500">Dispatch alerts will appear here in real time.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((ref) => {
                  const ktasLvl = ref.emergencyCase?.severity?.ktasLevel || 3;
                  const isPending = ref.status === 'pending';

                  return (
                    <div
                      key={ref._id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPending
                          ? 'bg-red-950/20 border-red-500/40 shadow-glow-red'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-blue-400">
                              {ref.emergencyCase?.caseId || 'CASE-108'}
                            </span>
                            <KtasBadge level={ktasLvl} size="sm" />
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ref.priority === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {ref.priority} Priority
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white">
                            {ref.patientSummary?.chiefComplaint || ref.emergencyCase?.chiefComplaint || 'Emergency Admission'}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Referred By: <strong className="text-slate-200">{ref.createdBy?.name || 'Paramedic Unit'}</strong> • {new Date(ref.createdAt).toLocaleTimeString()}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${
                            ref.status === 'accepted' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            ref.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                          }`}>
                            {ref.status}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons if pending */}
                      {isPending && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenResponseModal(ref._id, 'reject')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Divert / Reject
                          </button>
                          <button
                            onClick={() => handleOpenResponseModal(ref._id, 'accept')}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Accept & Pre-Alert Trauma Bay
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Resource Availability Manager (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h2 className="font-bold text-sm text-white uppercase tracking-wider">
                  Live Resource Manager
                </h2>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                Staff Authorization
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Updates to these resources directly impact the ResQAlloc dispatch engine and hospital ranking.
            </p>

            {resourceSaveMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resourceSaveMessage}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              
              {/* Available ICU Beds */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Available ICU Beds</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">{resources.icuBedsAvailable}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={resources.icuBedsAvailable}
                  onChange={(e) => setResources({ ...resources, icuBedsAvailable: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Total Available Inpatient Beds */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Total Available Beds</span>
                  <span className="font-mono font-bold text-sm text-blue-400">{resources.totalBedsAvailable}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={resources.totalBedsAvailable}
                  onChange={(e) => setResources({ ...resources, totalBedsAvailable: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Available Ventilators */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Functioning Ventilators</span>
                  <span className="font-mono font-bold text-sm text-cyan-400">{resources.ventilatorsAvailable}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={resources.ventilatorsAvailable}
                  onChange={(e) => setResources({ ...resources, ventilatorsAvailable: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Oxygen Cylinders */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Oxygen Cylinders</span>
                  <span className="font-mono font-bold text-sm text-indigo-400">{resources.oxygenCylindersAvailable}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={resources.oxygenCylindersAvailable}
                  onChange={(e) => setResources({ ...resources, oxygenCylindersAvailable: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Critical Unit Readiness Toggles */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block">
                  Critical Department Readiness:
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Emergency OT Ready</span>
                  <button
                    type="button"
                    onClick={() => setResources({ ...resources, emergencyOTAvailable: !resources.emergencyOTAvailable })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      resources.emergencyOTAvailable
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    {resources.emergencyOTAvailable ? 'READY' : 'OCCUPIED'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Cardiac Cath Lab</span>
                  <button
                    type="button"
                    onClick={() => setResources({ ...resources, cathLabAvailable: !resources.cathLabAvailable })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      resources.cathLabAvailable
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    {resources.cathLabAvailable ? 'OPERATIONAL' : 'BUSY'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">CT Scanner Status</span>
                  <button
                    type="button"
                    onClick={() => setResources({ ...resources, ctScanAvailable: !resources.ctScanAvailable })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      resources.ctScanAvailable
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    {resources.ctScanAvailable ? 'OPERATIONAL' : 'DOWN'}
                  </button>
                </div>
              </div>

            </div>

            {/* Save Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveResources}
                disabled={savingResources}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-blue transition-all flex items-center justify-center gap-2"
              >
                <Save className={`w-4 h-4 ${savingResources ? 'animate-spin' : ''}`} />
                {savingResources ? 'Broadcasting Resource Update...' : 'Save & Broadcast Live Availability'}
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              * Broadcasted capacity triggers audit log entry and updates matching weights immediately.
            </p>

          </div>
        </div>

      </div>

      {/* Response Modal */}
      {responseModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-base text-white">
              {responseModal.action === 'accept' ? 'Accept Emergency Referral' : 'Divert Emergency Referral'}
            </h3>
            <p className="text-xs text-slate-300">
              {responseModal.action === 'accept' 
                ? 'Confirming this referral will notify the ambulance unit to proceed and reserve the emergency trauma bed.'
                : 'Please specify the clinical reason for diverting this patient to allow the dispatcher to redirect immediately.'}
            </p>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Response Notes / Directives:</label>
              <textarea
                rows={3}
                value={responseModal.notes}
                onChange={(e) => setResponseModal({ ...responseModal, notes: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResponseModal({ ...responseModal, open: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResponse}
                disabled={responding}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow ${
                  responseModal.action === 'accept' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {responding ? 'Transmitting...' : responseModal.action === 'accept' ? 'Confirm Acceptance' : 'Confirm Diversion'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HospitalDashboard;
