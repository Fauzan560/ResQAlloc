import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/api';
import { EmergencyMap } from '../components/Map/EmergencyMap';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Activity, 
  Layers, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const HospitalsDirectoryPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [hasEmergencyOnly, setHasEmergencyOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 99 });
  const [selectedHospForMap, setSelectedHospForMap] = useState(null);

  useEffect(() => {
    loadHospitals();
  }, [page, search, selectedArea, selectedType, hasEmergencyOnly]);

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search: search || undefined,
        area: selectedArea || undefined,
        type: selectedType || undefined,
        hasEmergency: hasEmergencyOnly ? true : undefined
      };
      const res = await hospitalService.getAll(params);
      if (res.data?.data) {
        setHospitals(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.warn('Error loading hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Hyderabad Healthcare Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            99 Hyderabad Hospital Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified emergency departments, trauma centers, and simulated critical-care bed capacities.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Total Facilities: <strong className="text-white">{pagination.total}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-300">
            Synthetic Capacity Labeled
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by hospital name or area..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
          >
            <option value="">All Hospital Types</option>
            <option value="Government">Government / Public</option>
            <option value="Private">Private</option>
            <option value="Trust">Trust</option>
          </select>

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card border border-slate-800 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={hasEmergencyOnly}
              onChange={(e) => {
                setHasEmergencyOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded accent-red-500"
            />
            <span>24/7 Emergency Only</span>
          </label>
        </div>
      </div>

      {/* Map Overview Section */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            Hyderabad Geographical Distribution (99 Facilities)
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Approximate coordinates preserved</span>
        </div>

        <EmergencyMap
          patientLocation={null}
          allHospitals={hospitals}
          recommendedHospitals={selectedHospForMap ? [selectedHospForMap] : []}
          selectedHospitalId={selectedHospForMap?._id}
          height="320px"
        />
      </div>

      {/* Hospitals Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Querying 99 Hyderabad hospitals..." />
      ) : hospitals.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 text-xs">
          No hospitals found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitals.map((hosp) => (
            <div
              key={hosp._id}
              onClick={() => setSelectedHospForMap(hosp)}
              className="glass-card-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1.5 ${
                      hosp.type === 'Government' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {hosp.type}
                    </span>
                    <h3 className="font-bold text-sm text-white leading-snug">{hosp.name}</h3>
                  </div>
                  {hosp.hasTraumaCenter && (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                      Trauma
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                  {hosp.area}, Hyderabad
                </p>

                {hosp.specialties && hosp.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {hosp.specialties.slice(0, 3).map((sp, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {sp}
                      </span>
                    ))}
                    {hosp.specialties.length > 3 && (
                      <span className="text-[10px] px-1 py-0.5 text-slate-500">
                        +{hosp.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bed metrics */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Total Beds</span>
                  <span className="font-mono font-bold text-white">{hosp.totalBeds}</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">ICU Beds</span>
                  <span className="font-mono font-bold text-emerald-400">{hosp.icuBeds}</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Ventilators</span>
                  <span className="font-mono font-bold text-cyan-400">{hosp.ventilators}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
        <span>
          Showing page {pagination.current} of {pagination.pages} ({pagination.total} hospitals)
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-medium"
          >
            Previous
          </button>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-medium"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
};

export default HospitalsDirectoryPage;
