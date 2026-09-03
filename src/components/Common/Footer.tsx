import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Shield, Satellite, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-space-950 border-t border-slate-800/80 font-mono text-xs text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-extrabold text-sm text-slate-100 tracking-wider">
                SATQUERY<span className="text-cyan-400">.AI</span>
              </span>
            </div>
            <p className="text-slate-400 font-sans text-xs leading-relaxed max-w-md">
              Agentic remote sensing & geospatial intelligence platform. Translates natural language questions into satellite observation workflows for ISRO space analysts, NDRF disaster officers, and public environmental researchers.
            </p>
            <div className="text-[11px] text-slate-500 pt-2">
              Mission Control Datum: WGS84 / EPSG:4326 &bull; Strict Data Honesty Architecture
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Platform Modules</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/dashboard" className="hover:text-cyan-300 transition-colors">Mission Workspace</Link></li>
              <li><Link to="/analytics" className="hover:text-cyan-300 transition-colors">Intelligence Analytics</Link></li>
              <li><Link to="/history" className="hover:text-cyan-300 transition-colors">Immutable Audit Trail</Link></li>
              <li><Link to="/about" className="hover:text-cyan-300 transition-colors">Architecture & Physics</Link></li>
            </ul>
          </div>

          {/* Connectors */}
          <div className="space-y-2">
            <div className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Integrated Connectors</div>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li className="flex items-center gap-1.5"><Satellite className="w-3.5 h-3.5 text-cyan-400" /> Sentinel Hub Process API</li>
              <li className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-400" /> Google Earth Engine</li>
              <li className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-amber-400" /> ISRO Bhuvan WMS/WMTS</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> PostGIS Vector Storage</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} SATQUERY AI. Built for Smart India Hackathon & Open Geospatial Intelligence.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Subsystems Nominal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
