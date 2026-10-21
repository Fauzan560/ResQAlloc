import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  Activity, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  LogOut, 
  User, 
  ChevronDown, 
  Zap, 
  Ambulance, 
  Flame,
  Layers
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleDemoSwitch = async (role) => {
    try {
      setSwitchingRole(true);
      setDemoMenuOpen(false);
      await quickLogin(role);
      if (role === 'responder') navigate('/responder');
      else if (role === 'hospital_staff') navigate('/hospital-staff');
      else if (role === 'admin') navigate('/admin');
    } catch (err) {
      console.error('Demo switch error:', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-0.5 shadow-glow-red group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-red-500 group-hover:animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    ResQ<span className="text-red-500">Alloc</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 bg-red-950/80 text-red-400 border border-red-800/60 rounded">
                    Hyderabad
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 tracking-wide font-medium -mt-0.5">
                  Emergency Medical Dispatch & Triage
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/emergency-sos"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive('/emergency-sos')
                    ? 'bg-red-600 text-white shadow-glow-red'
                    : 'text-red-400 hover:bg-red-950/50 hover:text-red-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                Public SOS
              </Link>

              <Link
                to="/responder"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive('/responder')
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Ambulance className="w-3.5 h-3.5" />
                Paramedic Triage
              </Link>

              <Link
                to="/hospital-staff"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive('/hospital-staff')
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Hospital Staff
              </Link>

              <Link
                to="/hospitals"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive('/hospitals')
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                99 Hospitals
              </Link>

              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive('/admin')
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                disabled={switchingRole}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-red-600/20 border border-amber-500/40 text-amber-200 text-xs font-semibold hover:border-amber-400 transition-all"
                title="Instant Demo Role Switching"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{switchingRole ? 'Switching...' : 'Demo Login'}</span>
                <ChevronDown className="w-3 h-3 text-amber-400/80" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    ⚡ 1-Click Role Switcher
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('responder')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/90 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Ambulance className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Emergency Responder</div>
                      <div className="text-[10px] text-slate-400">responder@resqalloc.demo</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('hospital_staff')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/90 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Hospital Staff (NIMS)</div>
                      <div className="text-[10px] text-slate-400">staff@resqalloc.demo</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('admin')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/90 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">System Administrator</div>
                      <div className="text-[10px] text-slate-400">admin@resqalloc.demo</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Auth status & User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 border border-slate-700/60 transition-all text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-[11px] text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-semibold text-slate-200 leading-tight">{user?.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-panel rounded-xl border border-slate-700 shadow-xl py-1.5 z-50">
                    <div className="px-3 py-1.5 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-glow-red transition-all"
                >
                  Register
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
