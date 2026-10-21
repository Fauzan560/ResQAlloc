import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Ambulance, Building2, Flame, AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'responder') navigate('/responder');
      else if (loggedUser.role === 'hospital_staff') navigate('/hospital-staff');
      else if (loggedUser.role === 'admin') navigate('/admin');
      else navigate('/responder');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role) => {
    try {
      setQuickLoading(true);
      setError('');
      const loggedUser = await quickLogin(role);
      if (role === 'responder') navigate('/responder');
      else if (role === 'hospital_staff') navigate('/hospital-staff');
      else if (role === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 p-0.5 shadow-glow-red mx-auto flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Sign In to ResQAlloc
          </h1>
          <p className="text-xs text-slate-400">
            Emergency Dispatch & Hospital Resource Allocation Network
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Demo Login Shortcuts */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <span>⚡ Instant Demo Evaluation</span>
            <span className="text-[10px] text-slate-500 lowercase font-normal">no password needed</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={quickLoading}
              onClick={() => handleQuick('responder')}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-blue-500/80 text-center transition-all flex flex-col items-center gap-1 group"
            >
              <Ambulance className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-white leading-tight">Paramedic</span>
              <span className="text-[9px] text-slate-400">Responder</span>
            </button>

            <button
              type="button"
              disabled={quickLoading}
              onClick={() => handleQuick('hospital_staff')}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/80 text-center transition-all flex flex-col items-center gap-1 group"
            >
              <Building2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-white leading-tight">Staff</span>
              <span className="text-[9px] text-slate-400">NIMS Dept</span>
            </button>

            <button
              type="button"
              disabled={quickLoading}
              onClick={() => handleQuick('admin')}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-purple-500/80 text-center transition-all flex flex-col items-center gap-1 group"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-white leading-tight">Admin</span>
              <span className="text-[9px] text-slate-400">Executive</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-slate-500 text-[10px] uppercase tracking-wider">or sign in with email</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@resqalloc.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || quickLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-red transition-all flex items-center justify-center gap-2"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Public SOS link */}
        <div className="pt-2 text-center space-y-2 border-t border-slate-800/80">
          <Link
            to="/emergency-sos"
            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            Citizen Emergency? Report without login <ArrowRight className="w-3 h-3" />
          </Link>
          <div className="text-[11px] text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:underline font-semibold">
              Register here
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
