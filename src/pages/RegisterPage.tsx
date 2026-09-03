import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPersona } from '../types/persona';
import { Globe, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [persona, setPersona] = useState<UserPersona>('PUBLIC_RESEARCHER');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    await register(email, password, fullName, persona);
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
          <p className="text-slate-400 text-xs font-sans">Register Geospatial Operator / Research Profile</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 uppercase">Full Name / Operator ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma"
                required
                className="w-full bg-space-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 uppercase">Institutional / Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@organization.org"
                required
                className="w-full bg-space-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 uppercase">Password</label>
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
            <label className="text-[11px] text-slate-400 uppercase">Primary Mission Persona</label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as UserPersona)}
              className="w-full bg-space-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="PUBLIC_RESEARCHER">PUBLIC / RESEARCH USER</option>
              <option value="ISRO_ANALYST">ISRO / SPACE ANALYST</option>
              <option value="NDRF_OFFICER">NDRF / DISASTER OFFICER</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-space-800 text-black font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Registering...' : 'Create Account & Access'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-slate-500 text-[11px]">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
