import React, { useState, useEffect, useMemo } from 'react';
import { emergencyService, hospitalService } from '../services/api';
import { HYDERABAD_ZONES, CHIEF_COMPLAINT_PRESETS } from '../data/hyderabadLocations';
import { KtasBadge } from '../components/common/KtasBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmergencyMap } from '../components/Map/EmergencyMap';
import { 
  Ambulance, 
  HeartPulse, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Compass, 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  Building2, 
  Check, 
  ShieldCheck, 
  ChevronRight,
  ListFilter,
  Layers
} from 'lucide-react';

export const ResponderDashboard = () => {
  // Preset selector
  const [selectedPreset, setSelectedPreset] = useState('');

  // Patient Intake State
  const [patientData, setPatientData] = useState({
    name: 'Anonymous Patient',
    age: 45,
    gender: 'male',
    contactPhone: '+91 98765 43210'
  });

  const [chiefComplaint, setChiefComplaint] = useState(
    'Severe retrosternal chest pain radiating to left arm with diaphoresis'
  );
  const [symptomInput, setSymptomInput] = useState('');
  const [symptoms, setSymptoms] = useState(['Chest pain', 'Diaphoresis', 'Shortness of breath']);

  // Vitals State
  const [vitals, setVitals] = useState({
    heartRate: 118,
    systolicBP: 165,
    diastolicBP: 98,
    respiratoryRate: 24,
    oxygenSaturation: 93,
    temperature: 37.2,
    gcs: 15,
    painScale: 9
  });

  // Location State (Default: Banjara Hills)
  const [location, setLocation] = useState({
    latitude: 17.4156,
    longitude: 78.4354,
    address: 'Banjara Hills (Road No. 12), Hyderabad'
  });
  const [locating, setLocating] = useState(false);

  // Required capabilities toggles
  const [requiredCapabilities, setRequiredCapabilities] = useState([
    'ICU',
    'Ventilator',
    'Cath Lab',
    'Blood Bank'
  ]);

  // Matching & Results State
  const [isMatching, setIsMatching] = useState(false);
  const [matchResultData, setMatchResultData] = useState(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  // All 99 hospitals background reference
  const [allHospitals, setAllHospitals] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'active_cases'
  const [error, setError] = useState('');

  // Load all hospitals and existing cases on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [hospRes, casesRes] = await Promise.all([
        hospitalService.getAll({ limit: 100 }),
        emergencyService.getCases({ limit: 10 })
      ]);
      if (hospRes.data?.data) {
        setAllHospitals(hospRes.data.data);
      }
      if (casesRes.data?.data) {
        setMyCases(casesRes.data.data);
      }
    } catch (err) {
      console.warn('Initial data load warning:', err.message);
    }
  };

  // Real-time client-side KTAS acuity estimate
  const estimatedKtas = useMemo(() => {
    const { heartRate, systolicBP, oxygenSaturation, gcs, painScale, respiratoryRate } = vitals;
    
    // Level 1 criteria
    if (gcs <= 8 || oxygenSaturation < 85 || systolicBP < 75 || heartRate > 145 || respiratoryRate > 35) {
      return {
        level: 1,
        label: 'Resuscitation',
        confidence: 0.94,
        rationale: 'Critical hemodynamic instability / acute respiratory failure / severely compromised consciousness.'
      };
    }
    // Level 2 criteria
    if (gcs <= 13 || oxygenSaturation < 92 || systolicBP < 90 || systolicBP > 200 || heartRate > 125 || painScale >= 8) {
      return {
        level: 2,
        label: 'Emergent',
        confidence: 0.88,
        rationale: 'High acuity presentation with severe pain and abnormal physiological parameters.'
      };
    }
    // Level 3 criteria
    if (oxygenSaturation < 95 || heartRate > 105 || systolicBP > 160 || painScale >= 4) {
      return {
        level: 3,
        label: 'Urgent',
        confidence: 0.82,
        rationale: 'Significant distress requiring timely emergency interventions and continuous monitoring.'
      };
    }
    // Level 4
    if (painScale > 0 || heartRate > 90) {
      return {
        level: 4,
        label: 'Less Urgent',
        confidence: 0.79,
        rationale: 'Mild distress with stable vital signs, manageable within standard emergency timeframe.'
      };
    }
    // Level 5
    return {
      level: 5,
      label: 'Non-Urgent',
      confidence: 0.85,
      rationale: 'Stable baseline vitals with minor symptoms.'
    };
  }, [vitals]);

  // Load a realistic clinical preset
  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.label);
    setChiefComplaint(preset.chiefComplaint);
    setSymptoms(preset.symptoms);
    setVitals(preset.vitals);
    setRequiredCapabilities(preset.capabilities);
    setMatchResultData(null);
    setDispatchStatus(null);
  };

  const handleAddSymptom = (e) => {
    if (e.key === 'Enter' && symptomInput.trim()) {
      e.preventDefault();
      if (!symptoms.includes(symptomInput.trim())) {
        setSymptoms([...symptoms, symptomInput.trim()]);
      }
      setSymptomInput('');
    }
  };

  const handleRemoveSymptom = (item) => {
    setSymptoms(symptoms.filter(s => s !== item));
  };

  const toggleCapability = (cap) => {
    if (requiredCapabilities.includes(cap)) {
      setRequiredCapabilities(requiredCapabilities.filter(c => c !== cap));
    } else {
      setRequiredCapabilities([...requiredCapabilities, cap]);
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: `GPS Coordinate (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        });
      },
      (err) => {
        setLocating(false);
        console.warn('GPS failed, keeping default location:', err.message);
      },
      { timeout: 8000 }
    );
  };

  // Submit emergency case and trigger backend ML & hospital matching
  const handleRunMatching = async (e) => {
    e.preventDefault();
    try {
      setIsMatching(true);
      setError('');
      setDispatchStatus(null);

      const payload = {
        patient: {
          name: patientData.name,
          age: parseInt(patientData.age),
          gender: patientData.gender,
          contactPhone: patientData.contactPhone
        },
        chiefComplaint,
        symptoms,
        vitals: {
          heartRate: parseFloat(vitals.heartRate),
          systolicBP: parseFloat(vitals.systolicBP),
          diastolicBP: parseFloat(vitals.diastolicBP),
          respiratoryRate: parseFloat(vitals.respiratoryRate),
          oxygenSaturation: parseFloat(vitals.oxygenSaturation),
          temperature: parseFloat(vitals.temperature),
          gcs: parseInt(vitals.gcs),
          painScale: parseInt(vitals.painScale)
        },
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        },
        notes: `Required capabilities: ${requiredCapabilities.join(', ')}`
      };

      const res = await emergencyService.createCase(payload);
      if (res.data?.success) {
        setMatchResultData(res.data.data);
        if (res.data.data.emergencyCase?.recommendedHospital?._id) {
          setSelectedHospitalId(res.data.data.emergencyCase.recommendedHospital._id);
        } else if (res.data.data.emergencyCase?.matchResults?.[0]?.hospital?._id) {
          setSelectedHospitalId(res.data.data.emergencyCase.matchResults[0].hospital._id);
        }
        // Refresh active cases
        loadInitialData();
      }
    } catch (err) {
      console.error('Matching error:', err);
      setError(err.response?.data?.message || err.message || 'Error running hospital matching');
    } finally {
      setIsMatching(false);
    }
  };

  // Select hospital & dispatch ambulance
  const handleDispatchAmbulance = async (hospitalId) => {
    if (!matchResultData?.emergencyCase?._id) return;
    try {
      setDispatchLoading(true);
      const targetId = hospitalId || selectedHospitalId;
      const res = await emergencyService.selectHospital(matchResultData.emergencyCase._id, targetId);
      if (res.data?.success) {
        setDispatchStatus({
          dispatched: true,
          hospitalName: res.data.data?.emergencyCase?.recommendedHospital?.name || 'Selected Hospital',
          timestamp: new Date().toLocaleTimeString(),
          referralId: res.data.data?.referral?._id
        });
        loadInitialData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch ambulance.');
    } finally {
      setDispatchLoading(false);
    }
  };

  const allCapabilitiesList = [
    'ICU',
    'Ventilator',
    'Blood Bank',
    'Cath Lab',
    'Stroke Unit',
    'Trauma Center',
    'Trauma OT',
    'Pediatric ICU',
    'Burn Unit',
    'CT Scanner',
    'MRI'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-glow-red">
            <Ambulance className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Paramedic Triage & Dispatch</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Hyderabad Live 108 Network
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              KTAS acuity triage & automated resource matching across 99 Hyderabad hospitals.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'triage'
                ? 'bg-blue-600 text-white shadow-glow-blue'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Intake & Triage
          </button>
          <button
            onClick={() => setActiveTab('active_cases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'active_cases'
                ? 'bg-blue-600 text-white shadow-glow-blue'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Active Cases ({myCases.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/60 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'triage' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Intake & Triage Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Quick Simulation Presets */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick Clinical Simulation Presets:
                </span>
                <span className="text-[10px] text-slate-500">1-click realistic demo cases</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CHIEF_COMPLAINT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                      selectedPreset === preset.label
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-semibold shadow'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    ⚡ {preset.label.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRunMatching} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              
              {/* Patient Basic Info */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  1. Patient Demographics & Incident Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Patient Name / ID</label>
                    <input
                      type="text"
                      value={patientData.name}
                      onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={patientData.age}
                      onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Gender</label>
                    <select
                      value={patientData.gender}
                      onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Unknown</option>
                    </select>
                  </div>
                </div>

                {/* Location Picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      Incident GPS Location (Hyderabad)
                    </label>
                    <button
                      type="button"
                      onClick={handleUseGPS}
                      disabled={locating}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                    >
                      <Compass className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                      {locating ? 'Locating...' : 'Use My GPS'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => setLocation({ ...location, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                  {/* Preset Zones */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {HYDERABAD_ZONES.slice(0, 6).map((z, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLocation({ latitude: z.latitude, longitude: z.longitude, address: `${z.name}, Hyderabad` })}
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          location.latitude === z.latitude && location.longitude === z.longitude
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {z.name.split('(')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chief Complaint & Symptoms */}
              <div className="border-t border-slate-800 pt-5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  2. Chief Complaint & Clinical Presentation
                </h3>
                <input
                  type="text"
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Severe chest pain, suspected myocardial infarction..."
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs mb-2.5"
                />

                {/* Symptoms Chips */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {symptoms.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => handleRemoveSymptom(s)}
                          className="hover:text-red-400 text-slate-400 ml-0.5 text-xs font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={handleAddSymptom}
                    placeholder="Type symptom and press Enter..."
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              {/* Vitals Grid */}
              <div className="border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                    3. Objective Vital Signs (KTAS Inputs)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Updates triage score live</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Heart Rate */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                      <span>Heart Rate</span>
                      <span className="text-slate-500">bpm</span>
                    </div>
                    <input
                      type="number"
                      value={vitals.heartRate}
                      onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                      className="w-full font-mono font-bold text-sm text-white bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* BP */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                      <span>Blood Pressure</span>
                      <span className="text-slate-500">mmHg</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="Sys"
                        value={vitals.systolicBP}
                        onChange={(e) => setVitals({ ...vitals, systolicBP: e.target.value })}
                        className="w-12 font-mono font-bold text-sm text-white bg-transparent focus:outline-none"
                      />
                      <span className="text-slate-500">/</span>
                      <input
                        type="number"
                        placeholder="Dia"
                        value={vitals.diastolicBP}
                        onChange={(e) => setVitals({ ...vitals, diastolicBP: e.target.value })}
                        className="w-12 font-mono font-bold text-sm text-white bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                      <span>SpO2 Oxygen</span>
                      <span className="text-slate-500">%</span>
                    </div>
                    <input
                      type="number"
                      value={vitals.oxygenSaturation}
                      onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                      className="w-full font-mono font-bold text-sm text-white bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Respiratory Rate */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                      <span>Resp. Rate</span>
                      <span className="text-slate-500">/min</span>
                    </div>
                    <input
                      type="number"
                      value={vitals.respiratoryRate}
                      onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                      className="w-full font-mono font-bold text-sm text-white bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Temperature */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                      <span>Body Temp</span>
                      <span className="text-slate-500">°C</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={vitals.temperature}
                      onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      className="w-full font-mono font-bold text-sm text-white bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Glasgow Coma Scale */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                      <span>GCS (3-15)</span>
                      <span className="text-slate-500">score</span>
                    </div>
                    <input
                      type="number"
                      min={3}
                      max={15}
                      value={vitals.gcs}
                      onChange={(e) => setVitals({ ...vitals, gcs: e.target.value })}
                      className="w-full font-mono font-bold text-sm text-white bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Pain Score */}
                  <div className="col-span-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                      <span>Pain Severity: <strong className="text-white">{vitals.painScale} / 10</strong></span>
                      <span className="text-slate-500">{vitals.painScale >= 8 ? 'Severe' : vitals.painScale >= 4 ? 'Moderate' : 'Mild'}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={vitals.painScale}
                      onChange={(e) => setVitals({ ...vitals, painScale: parseInt(e.target.value) })}
                      className="w-full accent-red-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Required Capabilities Selection */}
              <div className="border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    4. Required Hospital Resources & Capabilities
                  </h3>
                  <span className="text-[10px] text-slate-500">Matching filter</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allCapabilitiesList.map((cap) => {
                    const active = requiredCapabilities.includes(cap);
                    return (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => toggleCapability(cap)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-blue-400" />}
                        {cap}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Triage & Matching Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isMatching}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-glow-red transition-all flex items-center justify-center gap-2"
                >
                  <Activity className={`w-5 h-5 ${isMatching ? 'animate-spin' : ''}`} />
                  {isMatching ? 'Running AI Severity & Hospital Matching...' : 'Run KTAS Assessment & Match Hospitals'}
                </button>
              </div>

            </form>

          </div>

          {/* Right Column: Live Triage Preview, Recommendations & Routing Map (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live KTAS Triage Score Preview */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  Live KTAS Triage Engine
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-amber-300 font-mono">
                  Real-Time Computation
                </span>
              </div>

              <KtasBadge level={estimatedKtas.level} size="lg" showDetails={true} />

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Rationale:</span>
                <p className="leading-relaxed text-[11px] text-slate-300">{estimatedKtas.rationale}</p>
              </div>
            </div>

            {/* Matching Results & Map */}
            {isMatching ? (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800">
                <LoadingSpinner
                  message="Evaluating 99 Hyderabad Hospitals..."
                  subtext="Running capability filters, OSRM road travel calculations, and multi-criteria ranking."
                />
              </div>
            ) : matchResultData ? (
              <div className="space-y-6">
                
                {/* Fallback Warning Notice if fallback was triggered */}
                {matchResultData.matching?.usedFallback && (
                  <div className="p-4 rounded-2xl bg-amber-950/70 border-2 border-amber-500/80 text-amber-200 text-xs space-y-2 shadow-lg animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                      <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
                      <span>Fallback Selection Mechanism Activated</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {matchResultData.matching.fallbackExplanation || 
                        'No single hospital satisfied 100% of the requested capabilities with immediate bed availability. Secondary criteria relaxed to prioritize nearest emergency stabilization facility.'}
                    </p>
                    <div className="pt-1 text-[10px] text-amber-300/90 font-mono">
                      * Prioritizing patient survival & proximity over non-critical secondary resources.
                    </div>
                  </div>
                )}

                {/* Dispatch Confirmation Banner */}
                {dispatchStatus && (
                  <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 text-xs space-y-2 shadow-glow-emerald animate-in zoom-in-95">
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Ambulance Dispatched! Referral Logged.</span>
                    </div>
                    <p className="text-slate-200 text-xs">
                      Emergency unit assigned to <strong className="text-white">{dispatchStatus.hospitalName}</strong>. Hospital emergency department staff has received the incoming referral alert.
                    </p>
                    <div className="text-[11px] font-mono text-emerald-400 pt-1">
                      Dispatched at: {dispatchStatus.timestamp}
                    </div>
                  </div>
                )}

                {/* Leaflet Routing Map */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-blue-400" />
                      OSRM Road Routing & Recommended Hospitals
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">OpenStreetMap + OSRM</span>
                  </div>

                  <EmergencyMap
                    patientLocation={location}
                    recommendedHospitals={matchResultData.emergencyCase?.matchResults || []}
                    allHospitals={allHospitals}
                    selectedHospitalId={selectedHospitalId}
                    routePolyline={matchResultData.emergencyCase?.route?.geometry}
                    onSelectHospital={(hospId) => {
                      setSelectedHospitalId(hospId);
                      handleDispatchAmbulance(hospId);
                    }}
                    height="340px"
                  />
                </div>

                {/* Top Recommended Hospitals List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Ranked Hospital Matches ({matchResultData.emergencyCase?.matchResults?.length || 0})</span>
                    <span className="text-[10px] text-slate-500 font-normal">Click to dispatch</span>
                  </h4>

                  <div className="space-y-2.5">
                    {matchResultData.emergencyCase?.matchResults?.map((match, idx) => {
                      const hosp = match.hospital || {};
                      const isSelected = selectedHospitalId === hosp._id;
                      const rank = match.rank || idx + 1;

                      return (
                        <div
                          key={hosp._id || idx}
                          onClick={() => setSelectedHospitalId(hosp._id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 shadow-glow-blue'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                rank === 1 ? 'bg-emerald-500 text-white' : 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                              }`}>
                                #{rank}
                              </span>
                              <div>
                                <h5 className="font-bold text-sm text-white leading-tight">{hosp.name}</h5>
                                <p className="text-[11px] text-slate-400">{hosp.area}, Hyderabad • {hosp.type}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold font-mono text-xs text-emerald-400 block">
                                {match.estimatedTime ? `${Math.round(match.estimatedTime)} mins` : '15 min'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {match.distance ? `${match.distance.toFixed(1)} km` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Hospital Details Badges */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              ICU Beds: <strong className="text-emerald-400">{hosp.icuBeds || 'Synthetic'}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              Ventilators: <strong className="text-blue-400">{hosp.ventilators || 'Synthetic'}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                              Match Score: <strong className="text-white">{match.score ? `${Math.round(match.score)}%` : '90%'}</strong>
                            </span>
                          </div>

                          {/* Fallback / Reasons */}
                          {match.isFallback && (
                            <div className="mt-2 text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-900/40">
                              ⚠️ Fallback: {match.missingCapabilities?.join(', ') || 'Partial capability match'}
                            </div>
                          )}

                          {/* Dispatch Button */}
                          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispatchAmbulance(hosp._id);
                              }}
                              disabled={dispatchLoading}
                              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                            >
                              <Ambulance className="w-3.5 h-3.5" />
                              <span>{dispatchLoading && isSelected ? 'Dispatching...' : 'Dispatch to this Hospital'}</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              /* Idle state placeholder */
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                  <Navigation className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-white text-sm">Ready for Hospital Matching</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Enter patient vitals and click "Run KTAS Assessment & Match Hospitals" to generate live route calculations across all 99 Hyderabad hospitals.
                </p>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* Active Cases Tab */
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">Active Emergency Dispatches</h3>
            <span className="text-xs text-slate-400">Recent dispatches handled by your unit</span>
          </div>

          {myCases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No cases created yet.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {myCases.map((c) => (
                <div key={c._id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-400">{c.caseId}</span>
                      <KtasBadge level={c.severity?.ktasLevel || 3} size="sm" />
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">{c.chiefComplaint}</p>
                    <p className="text-[11px] text-slate-400">
                      Destination: <strong className="text-white">{c.recommendedHospital?.name || 'Triage Assessment'}</strong> • {new Date(c.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status !== 'completed' && (
                      <button
                        onClick={async () => {
                          const nextStatus = c.status === 'referred' ? 'in_transit' : c.status === 'in_transit' ? 'arrived' : 'completed';
                          await emergencyService.updateCaseStatus(c._id, { status: nextStatus });
                          loadInitialData();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 border border-blue-500/50 text-white text-xs font-semibold transition-all"
                      >
                        Advance Status ({c.status})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ResponderDashboard;
