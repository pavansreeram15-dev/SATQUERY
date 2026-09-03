import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Common/Navbar';
import { Footer } from '../components/Common/Footer';
import {
  Globe,
  ArrowRight,
  Satellite,
  ShieldAlert,
  GraduationCap,
  Layers,
  Cpu,
  Search,
  CheckCircle2,
  Database,
  Sliders,
  TrendingUp,
  Activity,
  Terminal,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-slate-800/80">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Live Telemetry Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-space-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider">Agentic Earth Observation Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400">
              ASK EARTH. <br />
              <span className="text-cyan-400">GET INTELLIGENCE.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              An agentic remote sensing assistant that transforms natural language questions into multi-spectral satellite intelligence, SAR flood modeling, and temporal change workflows.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 font-mono text-xs">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-space-900/80 hover:bg-space-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 text-sm transition-all"
              >
                <span>Explore Architecture</span>
              </Link>
            </div>

            {/* Strategic Tag */}
            <div className="pt-6 font-mono text-[11px] text-slate-400 tracking-widest uppercase flex items-center justify-center gap-3">
              <span className="text-cyan-400 font-bold">ONE PLATFORM</span> &bull;
              <span>SPACE INTELLIGENCE</span> &bull;
              <span>DISASTER RESPONSE</span> &bull;
              <span>PUBLIC RESEARCH</span>
            </div>
          </div>

          {/* Interactive Radar Visual Mockup */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-space-900/70 border border-cyan-500/30 p-2 sm:p-4 shadow-2xl backdrop-blur-xl relative group">
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-space-950 aspect-[16/9] relative flex flex-col justify-between p-6">
              {/* Header HUD */}
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 z-10">
                <div className="flex items-center gap-2 bg-space-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Satellite className="w-4 h-4 text-cyan-400" />
                  <span>TARGET: CHENNAI PORT HARBOR [80.30°E, 13.10°N]</span>
                </div>
                <div className="flex items-center gap-2 bg-space-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-emerald-400">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>18 CARGO SHIPS DETECTED (CONF: 92.4%)</span>
                </div>
              </div>

              {/* Grid Background with Radar Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0891b212_1px,transparent_1px),linear-gradient(to_bottom,#0891b212_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

              {/* Center Radar Circles */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 rounded-full border border-cyan-500/20 animate-pulse-slow" />
                <div className="w-[500px] h-[500px] rounded-full border border-cyan-500/10" />
                <div className="absolute w-full h-[1px] bg-cyan-500/20" />
                <div className="absolute h-full w-[1px] bg-cyan-500/20" />
              </div>

              {/* Live Query Bubble Preview */}
              <div className="z-10 max-w-lg mx-auto w-full bg-space-900/90 border border-cyan-500/40 p-4 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                  <span className="text-cyan-400 font-bold">NATURAL LANGUAGE WORKFLOW</span>
                  <span>ISRO / SPACE ANALYST</span>
                </div>
                <div className="text-slate-100 font-sans text-sm">
                  "Count all cargo ships in this harbor and highlight vessel footprints."
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Inference Complete &bull; 18 Targets &bull; 12.4 km² Surveyed &bull; EPSG:4326</span>
                </div>
              </div>

              {/* Footer Telemetry */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 z-10">
                <span>SENSOR: Sentinel-2 MSI 10m Optical</span>
                <span>INTEGRITY: Authenticated Server Pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Operational Personas Section */}
      <section className="py-20 border-b border-slate-800/80 bg-space-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
              Role-Aware Intelligence Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-100">
              TAILORED MISSION PERSONAS
            </h2>
            <p className="text-slate-400 text-sm">
              One platform dynamically adapting tools, map layers, and export protocols to the operator's clearance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ISRO Analyst */}
            <div className="rounded-2xl bg-space-950/80 border border-cyan-500/30 p-6 space-y-4 hover:border-cyan-500/60 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
                <Satellite className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-mono text-slate-100">ISRO / SPACE ANALYST</h3>
                <p className="text-xs text-cyan-400 font-mono">Strategic Earth Observation</p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Full-spectrum optical and C-SAR radar analysis, YOLOv8 infrastructure detection, multi-temporal urban expansion, and raw GeoTIFF export.
              </p>
              <ul className="space-y-1.5 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> YOLO-OBB Vessel Detection</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 2022-2026 Change Differencing</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> ISRO Bhuvan LULC 50K WMS</li>
              </ul>
            </div>

            {/* NDRF Disaster Officer */}
            <div className="rounded-2xl bg-space-950/80 border border-amber-500/30 p-6 space-y-4 hover:border-amber-500/60 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-mono text-slate-100">NDRF / DISASTER OFFICER</h3>
                <p className="text-xs text-amber-400 font-mono">Emergency Situational Awareness</p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Rapid flood inundation modeling, SAR water extent mapping, evacuation zone overlays, and automated disaster impact reports.
              </p>
              <ul className="space-y-1.5 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> SAR Inundation Thresholding</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Before/After Flood Split Slider</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Operational Disaster Report Generation</li>
              </ul>
            </div>

            {/* Public Researcher */}
            <div className="rounded-2xl bg-space-950/80 border border-emerald-500/30 p-6 space-y-4 hover:border-emerald-500/60 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-mono text-slate-100">PUBLIC / RESEARCH USER</h3>
                <p className="text-xs text-emerald-400 font-mono">Open Remote Sensing & Ecology</p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Public Sentinel-2 reflectance, vegetation health canopy indices (NDVI), surface water boundaries (NDWI), and open research GeoJSON export.
              </p>
              <ul className="space-y-1.5 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> (NIR-RED)/(NIR+RED) Band Math</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Open Water Bodies Detection</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> GeoJSON & CSV Research Downloads</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section className="py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
              Autonomous Intelligence Execution
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-100">
              FROM NATURAL LANGUAGE TO SATELLITE GIS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
            <div className="p-5 rounded-xl bg-space-900/60 border border-slate-800 space-y-2.5">
              <div className="text-cyan-400 font-bold text-sm">01 // INTENT PARSING</div>
              <p className="text-slate-300 font-sans text-xs">
                Extracts intent, spatial bounds, temporal years, and target objects from conversational English.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-space-900/60 border border-slate-800 space-y-2.5">
              <div className="text-cyan-400 font-bold text-sm">02 // DATA ROUTING</div>
              <p className="text-slate-300 font-sans text-xs">
                Routes request dynamically to Sentinel Hub, Google Earth Engine, ISRO Bhuvan, or Local Engine.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-space-900/60 border border-slate-800 space-y-2.5">
              <div className="text-cyan-400 font-bold text-sm">03 // AI & SPECTRAL MATH</div>
              <p className="text-slate-300 font-sans text-xs">
                Executes YOLO object detection, SAR Otsu thresholding, NDVI spectral formulas, or SSIM difference.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-space-900/60 border border-slate-800 space-y-2.5">
              <div className="text-cyan-400 font-bold text-sm">04 // GIS VECTORIZATION</div>
              <p className="text-slate-300 font-sans text-xs">
                Derives WGS84 GeoJSON polygons, calculates ground area km², renders map overlays, and writes audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-b from-space-950 to-space-900">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-extrabold font-mono text-slate-100">
            EXPERIENCE MISSION CONTROL INTELLIGENCE
          </h2>
          <p className="text-slate-300 text-sm font-sans max-w-xl mx-auto">
            Ready to query Earth observation footprints with natural language? Launch the full workstation dashboard.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold font-mono text-sm transition-all shadow-xl shadow-cyan-500/30"
          >
            <span>Enter Operational Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
