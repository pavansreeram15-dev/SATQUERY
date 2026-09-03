import React from 'react';
import { Navbar } from '../components/Common/Navbar';
import { Footer } from '../components/Common/Footer';
import {
  Satellite,
  Layers,
  Cpu,
  ShieldCheck,
  Database,
  Radio,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Title */}
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            Platform Architecture & Scientific Methodology
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-mono text-slate-100">
            THE SCIENCE OF SATQUERY AI
          </h1>
          <p className="text-slate-400 text-sm font-normal leading-relaxed">
            A technical breakdown of how natural language queries are converted into rigorous remote sensing workflows, spectral indices, and PostGIS vector geometries.
          </p>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 font-mono text-xs text-cyan-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>OPERATIONAL INTEGRITY & ROLE-AWARE ARCHITECTURE</span>
          </div>
          <p className="font-sans text-xs text-slate-300 leading-relaxed">
            SATQUERY AI adapts analysis workflows and data visibility to operational personas while maintaining server-side authorization for real deployments. Access to external services and datasets depends on the credentials, permissions, availability, and capabilities of the configured providers.
          </p>
        </div>

        {/* Core Sections */}
        <div className="space-y-10 font-mono text-xs">
          {/* Section 1: Remote Sensing Physics & Band Math */}
          <div className="p-6 rounded-2xl bg-space-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
              <Satellite className="w-5 h-5" />
              <span>01 // REMOTE SENSING SPECTRAL MATHEMATICS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-slate-300">
              <div className="p-4 rounded-xl bg-space-950 border border-slate-850 space-y-2">
                <div className="text-cyan-300 font-bold">Normalized Difference Vegetation Index (NDVI)</div>
                <div className="p-2 rounded bg-space-900 border border-slate-800 text-center text-cyan-400 font-bold">
                  NDVI = (NIR - RED) / (NIR + RED)
                </div>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">
                  Measures chlorophyll absorption in the Red band (Sentinel-2 Band 4: 665nm) versus high mesophyll cell scattering in Near-Infrared (Band 8: 842nm). Values &gt; 0.45 signify dense healthy canopy.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-space-950 border border-slate-850 space-y-2">
                <div className="text-blue-300 font-bold">Normalized Difference Water Index (NDWI)</div>
                <div className="p-2 rounded bg-space-900 border border-slate-800 text-center text-blue-400 font-bold">
                  NDWI = (GREEN - NIR) / (GREEN + NIR)
                </div>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">
                  Delineates open water bodies by leveraging high Green reflectance (Band 3: 560nm) and total NIR absorption by water molecules.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: SAR Inundation & Change Detection */}
          <div className="p-6 rounded-2xl bg-space-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Radio className="w-5 h-5" />
              <span>02 // SYNTHETIC APERTURE RADAR (SAR) & TEMPORAL SSIM DIFF</span>
            </div>

            <div className="space-y-3 text-slate-300 font-sans text-xs leading-relaxed">
              <p>
                <strong>Sentinel-1 C-SAR Backscatter:</strong> Operating at 5.405 GHz with dual-polarization (VV + VH), radar pulses penetrate monsoonal cloud cover and heavy precipitation. Smooth open floodwaters act as specular reflectors, scattering radar pulses away from the antenna and creating distinct dark low-decibel returns (Otsu thresholding &lt; -18 dB).
              </p>
              <p>
                <strong>Temporal Change Differencing:</strong> Compares baseline satellite matrices against current acquisitions using Structural Similarity Index (SSIM) and Normalized Difference Built-up Index (NDBI) to isolate new construction, vegetation loss, and flood inundation.
              </p>
            </div>
          </div>

          {/* Section 3: Data Source Router & Honesty Architecture */}
          <div className="p-6 rounded-2xl bg-space-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
              <Database className="w-5 h-5" />
              <span>03 // DATA SOURCE ROUTING & TRANSPARENCY</span>
            </div>

            <div className="space-y-3 text-slate-300 font-sans text-xs leading-relaxed">
              <p>
                SATQUERY AI maintains a strict <strong>Data Honesty Standard</strong>:
              </p>
              <ul className="space-y-1.5 list-disc list-inside font-mono text-[11px] text-slate-300">
                <li>Never fabricate fake external satellite API success responses.</li>
                <li>When credentials are absent or in development mode, route to the calibrated Local Processing Engine and explicitly label the result with <code className="text-cyan-300 bg-space-950 px-1 py-0.5 rounded">Source: Local Processing</code>.</li>
                <li>Keep service accounts, private keys, and OAuth2 credentials strictly backend-only.</li>
                <li>All vector layers and polygons strictly adhere to WGS84 (EPSG:4326) [longitude, latitude] GeoJSON standards.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
