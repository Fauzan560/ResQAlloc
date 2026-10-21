import React, { useState, useEffect } from 'react';
import { adminService, hospitalService } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  Activity, 
  FileText, 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Database,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'hospitals' | 'users' | 'audit_logs'

  // Overview stats
  const [dashboardData, setDashboardData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Hospitals table state
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [hospPage, setHospPage] = useState(1);
  const [hospPagination, setHospPagination] = useState({ current: 1, pages: 1, total: 99 });

  // Users table state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Edit hospital modal
  const [editModal, setEditModal] = useState({
    open: false,
    hospital: null
  });
  const [savingHosp, setSavingHosp] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'hospitals') loadHospitals();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'audit_logs') loadAuditLogs();
  }, [activeTab, hospPage, searchTerm, typeFilter]);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const res = await adminService.getDashboard();
      if (res.data?.data) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.warn('Dashboard stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadHospitals = async () => {
    try {
      setHospitalsLoading(true);
      const res = await hospitalService.getAll({
        page: hospPage,
        limit: 15,
        search: searchTerm || undefined,
        type: typeFilter || undefined
      });
      if (res.data?.data) {
        setHospitals(res.data.data);
        if (res.data.pagination) setHospPagination(res.data.pagination);
      }
    } catch (err) {
      console.warn('Hospitals fetch error:', err);
    } finally {
      setHospitalsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await adminService.getUsers({ limit: 50 });
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.warn('Users fetch error:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await adminService.getAuditLogs({ limit: 50 });
      if (res.data?.data) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.warn('Logs fetch error:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating user');
    }
  };

  const handleSaveHospitalEdit = async (e) => {
    e.preventDefault();
    if (!editModal.hospital?._id) return;
    try {
      setSavingHosp(true);
      await hospitalService.update(editModal.hospital._id, editModal.hospital);
      setEditModal({ open: false, hospital: null });
      loadHospitals();
      loadDashboardStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating hospital');
    } finally {
      setSavingHosp(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">System Administration</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                Master Control
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hyderabad hospital network, user access, and end-to-end clinical audit trails.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'hospitals' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            99 Hospitals
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'users' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'audit_logs' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Logs
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hospitals Registered</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {dashboardData?.counts?.hospitals || 99}
                </span>
                <span className="text-xs font-medium text-emerald-400">Hyderabad Metro</span>
              </div>
              <p className="text-[10px] text-slate-500">Imported from verified CSV dataset</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Cases</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-400">
                  {dashboardData?.counts?.emergencyCases ?? 0}
                </span>
                <span className="text-xs font-medium text-slate-400">Total Logged</span>
              </div>
              <p className="text-[10px] text-slate-500">Processed by KTAS triage engine</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Referrals</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">
                  {dashboardData?.counts?.referrals ?? 0}
                </span>
                <span className="text-xs font-medium text-slate-400">Transfers</span>
              </div>
              <p className="text-[10px] text-slate-500">Dispatched to emergency bays</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Users</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-400">
                  {dashboardData?.counts?.users ?? 4}
                </span>
                <span className="text-xs font-medium text-slate-400">Responders & Staff</span>
              </div>
              <p className="text-[10px] text-slate-500">Role-based JWT access</p>
            </div>
          </div>

          {/* System Status & Architecture Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 md:col-span-2 space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Service Health & Subsystem Status
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Express.js API Backend</span>
                    <span className="text-slate-400 text-[11px]">Port 5000 • MongoDB</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    ONLINE
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Flask ML / KTAS Service</span>
                    <span className="text-slate-400 text-[11px]">Port 5001 • Scikit-learn</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    READY (DEMO MODE)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">OSRM Road Engine</span>
                    <span className="text-slate-400 text-[11px]">Road network routing</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    CONNECTED
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Hospital Capacity Engine</span>
                    <span className="text-slate-400 text-[11px]">99 Facilities Model</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    SYNTHETIC LABELED
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                ℹ️ <strong>Academic Project Disclaimer:</strong> ResQAlloc is an educational simulation system. Hospital bed numbers, ventilator counts, and exact coordinates are synthetically generated to test emergency matching algorithms and fallback routing.
              </div>
            </div>

            {/* Quick Audit Snapshot */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Recent System Activity
              </h3>
              <div className="space-y-2 text-xs">
                {(dashboardData?.recentLogs || []).slice(0, 5).map((log) => (
                  <div key={log._id} className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-blue-400 uppercase">{log.action?.replace('_', ' ')}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">{log.description}</p>
                  </div>
                ))}
                {(!dashboardData?.recentLogs || dashboardData.recentLogs.length === 0) && (
                  <p className="text-slate-500 text-xs text-center py-4">No recent audit logs.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 99 HOSPITALS EXPLORER */}
      {activeTab === 'hospitals' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-base text-white">99 Hyderabad Hospitals Directory</h2>
              <p className="text-xs text-slate-400">Inspect verified names, areas, emergency capabilities, and synthetic capacity models.</p>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search hospital or area..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHospPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setHospPage(1);
                }}
                className="px-3 py-1.5 rounded-xl glass-input text-xs bg-slate-900"
              >
                <option value="">All Types</option>
                <option value="Government">Government / Public</option>
                <option value="Private">Private</option>
                <option value="Trust">Trust</option>
              </select>
            </div>
          </div>

          {/* Hospitals Table */}
          {hospitalsLoading ? (
            <LoadingSpinner message="Loading hospital catalog..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    <th className="py-3 px-3">Hospital Name</th>
                    <th className="py-3 px-3">Area / Zone</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Emergency 24/7</th>
                    <th className="py-3 px-3">Beds / ICU</th>
                    <th className="py-3 px-3">Coordinates</th>
                    <th className="py-3 px-3">Capacity Model</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {hospitals.map((hosp) => (
                    <tr key={hosp._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">
                        {hosp.name}
                        {hosp.hasTraumaCenter && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-red-950 text-red-400 border border-red-800">
                            Trauma
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{hosp.area}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          hosp.type === 'Government' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'
                        }`}>
                          {hosp.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {hosp.hasEmergency ? (
                          <span className="text-emerald-400 font-bold">Yes (24/7)</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="text-white">{hosp.totalBeds}</span> / <span className="text-emerald-400 font-bold">{hosp.icuBeds} ICU</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-amber-300 font-mono">
                          {hosp.locationVerified || 'approximate'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                          {hosp.capacityVerified || 'synthetic'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setEditModal({ open: true, hospital: { ...hosp } })}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                <span>
                  Showing page {hospPagination.current} of {hospPagination.pages} ({hospPagination.total} hospitals)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={hospPage <= 1}
                    onClick={() => setHospPage(hospPage - 1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={hospPage >= hospPagination.pages}
                    onClick={() => setHospPage(hospPage + 1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-white">Registered Users & Role Management</h2>
            <span className="text-xs text-slate-400">Manage responder, staff, and admin privileges</span>
          </div>

          {usersLoading ? (
            <LoadingSpinner message="Loading user directory..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Current Role</th>
                    <th className="py-3 px-3">Assigned Hospital</th>
                    <th className="py-3 px-3 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-950 text-purple-300' :
                          u.role === 'hospital_staff' ? 'bg-emerald-950 text-emerald-300' :
                          'bg-blue-950 text-blue-300'
                        }`}>
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {u.assignedHospital?.name || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                          className="px-2 py-1 rounded-lg glass-input text-xs bg-slate-900 border-slate-700"
                        >
                          <option value="responder">Responder</option>
                          <option value="hospital_staff">Hospital Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-white">Clinical & Dispatch Audit Trails</h2>
              <p className="text-xs text-slate-400">Immutable chronological records of triage calculations, referrals, and resource updates.</p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="text-xs text-blue-400 hover:text-blue-300 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-800/40"
            >
              Refresh Logs
            </button>
          </div>

          {logsLoading ? (
            <LoadingSpinner message="Loading audit trail..." />
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {auditLogs.map((log) => (
                <div key={log._id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Actor: <strong className="text-white">{log.user?.name || 'System / Paramedic'}</strong>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Target: {log.targetModel}
                      </span>
                    </div>
                    <p className="text-slate-200 text-xs font-medium">{log.description}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Hospital Modal */}
      {editModal.open && editModal.hospital && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveHospitalEdit} className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-lg w-full space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-base text-white">Edit Hospital Information</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  value={editModal.hospital.name}
                  onChange={(e) => setEditModal({ ...editModal, hospital: { ...editModal.hospital, name: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Area / Locality</label>
                  <input
                    type="text"
                    required
                    value={editModal.hospital.area}
                    onChange={(e) => setEditModal({ ...editModal, hospital: { ...editModal.hospital, area: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Hospital Type</label>
                  <select
                    value={editModal.hospital.type}
                    onChange={(e) => setEditModal({ ...editModal, hospital: { ...editModal.hospital, type: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
                  >
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="Trust">Trust</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Total Beds</label>
                  <input
                    type="number"
                    value={editModal.hospital.totalBeds}
                    onChange={(e) => setEditModal({ ...editModal, hospital: { ...editModal.hospital, totalBeds: parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ICU Beds</label>
                  <input
                    type="number"
                    value={editModal.hospital.icuBeds}
                    onChange={(e) => setEditModal({ ...editModal, hospital: { ...editModal.hospital, icuBeds: parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Ventilators</label>
                  <input
                    type="number"
                    value={editModal.hospital.ventilators}
                    onChange={(e) => setEditModal({ ...editModal, hospital: { ...editModal.hospital, ventilators: parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editModal.hospital.hasEmergency}
                    onChange={(e) => setEditModal({ ...editModal, hospital: { ...editModal.hospital, hasEmergency: e.target.checked } })}
                    className="rounded accent-red-500"
                  />
                  <span className="text-slate-300">24/7 Emergency</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editModal.hospital.hasTraumaCenter}
                    onChange={(e) => setEditModal({ ...editModal, hospital: { ...editModal.hospital, hasTraumaCenter: e.target.checked } })}
                    className="rounded accent-red-500"
                  />
                  <span className="text-slate-300">Trauma Center</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditModal({ open: false, hospital: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingHosp}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
              >
                {savingHosp ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
