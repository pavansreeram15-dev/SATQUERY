import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PersonaSwitcher } from '../Persona/PersonaSwitcher';
import { PersonaBadge } from '../Persona/PersonaBadge';
import { RegionSelector } from './RegionSelector';
import { LocationSearchBar } from './LocationSearchBar';
import { AuditTrailDrawer } from './AuditTrailDrawer';
import { ProviderHealthModal } from './ProviderHealthModal';
import { useAuth } from '../../context/AuthContext';
import { useMapContext } from '../../context/MapContext';
import {
  Globe,
  Compass,
  Activity,
  History,
  BarChart2,
  Info,
  LogOut,
  User,
  Shield,
  Layers,
  Radio
} from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { setProviderHealthModalOpen } = useMapContext();
  const [auditOpen, setAuditOpen] = useState<boolean>(false);

  const navLinks = [
    { label: 'Mission Dashboard', path: '/dashboard', icon: Compass },
    { label: 'Query History', path: '/history', icon: History },
    { label: 'Analytics', path: '/analytics', icon: BarChart2 },
    { label: 'About', path: '/about', icon: Info },
  ];

  return (
    <>
      <header className="h-14 bg-space-950/95 border-b border-slate-800/80 px-4 flex items-center justify-between font-mono text-xs text-slate-200 z-40 backdrop-blur-xl shadow-md">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-cyan-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <div className="w-full h-full bg-space-950 rounded-[7px] flex items-center justify-center">
                <Globe className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform duration-500" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-slate-100 group-hover:text-cyan-300 transition-colors">
                SATQUERY<span className="text-cyan-400">.AI</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                    isActive
                      ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold'
                      : 'hover:bg-space-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Global Location Search & Region Selector */}
        <div className="hidden lg:flex items-center gap-2">
          <LocationSearchBar />
          <RegionSelector />
        </div>

        {/* Right: Data Health, Persona Switcher, Audit Trail, User Session */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setProviderHealthModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-space-900 hover:bg-space-850 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 transition-all font-mono text-xs"
            title="Inspect Data Provider Health (Planetary Computer, CDSE, USGS, FIRMS, Open-Meteo)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline font-semibold">Providers</span>
          </button>

          <PersonaSwitcher />

          <button
            onClick={() => setAuditOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-space-900 hover:bg-space-850 border border-slate-700/80 text-slate-300 hover:text-cyan-300 transition-all"
            title="Open Immutable Audit Trail"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-semibold">Audit</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-space-850 border border-slate-700 flex items-center justify-center text-cyan-300 font-bold">
                {user.fullName.charAt(0)}
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-space-900 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Audit Drawer Component */}
      <AuditTrailDrawer isOpen={auditOpen} onClose={() => setAuditOpen(false)} />

      {/* Provider Health Modal */}
      <ProviderHealthModal />
    </>
  );
};
