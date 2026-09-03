import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPersona } from '../types/persona';
import { Globe, Lock, Mail, ArrowRight, Shield, Satellite } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('analyst@isro.gov.in');
  const [password, setPassword] = useState<string>('satquery-demo');
  const [persona, setPersona] = useState<UserPersona>('ISRO_ANALYST');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await login(email, password, persona);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex items-center justify-center p-4 font-mono text-xs">
      <div className="max-w-md w-full rounded-2xl bg-space-900/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
            <Globe className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-xl font-extrabold tracking-wider text-slate-100">
            SATQUERY<span className="text-cyan-400">.AI</span>
          </h1>
          <p className="text-slate-400 text-xs font-sans">Mission Control Access & Operator Authentication</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 uppercase">Operator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-space-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 uppercase">Security Token / Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-space-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 uppercase">Initial Mission Persona</label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as UserPersona)}
              className="w-full bg-space-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ISRO_ANALYST">ISRO / SPACE ANALYST</option>
              <option value="NDRF_OFFICER">NDRF / DISASTER OFFICER</option>
              <option value="PUBLIC_RESEARCHER">PUBLIC / RESEARCH USER</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-space-800 text-black font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-slate-500 text-[11px]">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Register New Operator
          </Link>
        </div>
      </div>
    </div>
  );
};
