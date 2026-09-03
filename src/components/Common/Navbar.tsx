import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-space-950/80 backdrop-blur-xl border-b border-slate-800/80 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-cyan-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
            <div className="w-full h-full bg-space-950 rounded-[11px] flex items-center justify-center">
              <Globe className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-500" />
            </div>
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-wider text-slate-100 group-hover:text-cyan-300 transition-colors">
              SATQUERY<span className="text-cyan-400">.AI</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans">Remote Sensing & Geospatial Intelligence</div>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-slate-300">
          <Link to="/" className={`hover:text-cyan-400 transition-colors ${location.pathname === '/' ? 'text-cyan-300 font-bold' : ''}`}>
            Home
          </Link>
          <Link to="/dashboard" className={`hover:text-cyan-400 transition-colors ${location.pathname === '/dashboard' ? 'text-cyan-300 font-bold' : ''}`}>
            Workspace
          </Link>
          <Link to="/analytics" className={`hover:text-cyan-400 transition-colors ${location.pathname === '/analytics' ? 'text-cyan-300 font-bold' : ''}`}>
            Intelligence Metrics
          </Link>
          <Link to="/history" className={`hover:text-cyan-400 transition-colors ${location.pathname === '/history' ? 'text-cyan-300 font-bold' : ''}`}>
            Audit Logs
          </Link>
          <Link to="/about" className={`hover:text-cyan-400 transition-colors ${location.pathname === '/about' ? 'text-cyan-300 font-bold' : ''}`}>
            Methodology & Physics
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
