import React from 'react';
import { useMapContext } from '../../context/MapContext';
import { usePersona } from '../../context/PersonaContext';
import { SAMPLE_REGIONS } from '../../config/sampleRegions';
import {
  Crosshair,
  Square,
  Pentagon,
  Trash2,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

export const BoundingBoxSelector: React.FC = () => {
  const {
    activeRegion,
    drawnBBox,
    drawnPolygon,
    drawMode,
    setDrawMode,
    isDrawingBBox,
    setIsDrawingBBox,
    clearDrawnAOI,
    setQueryResult,
  } = useMapContext();

  const { persona } = usePersona();
  const safeRegion = activeRegion || SAMPLE_REGIONS[0];
  const currentBBox = drawnBBox || safeRegion.bbox || [80.27, 13.07, 80.34, 13.14];

  const minLon = typeof currentBBox[0] === 'number' ? currentBBox[0] : 80.27;
  const minLat = typeof currentBBox[1] === 'number' ? currentBBox[1] : 13.07;
  const maxLon = typeof currentBBox[2] === 'number' ? currentBBox[2] : 80.34;
  const maxLat = typeof currentBBox[3] === 'number' ? currentBBox[3] : 13.14;

  const cLat = ((minLat + maxLat) / 2.0);
  const cLon = ((minLon + maxLon) / 2.0);

  const meanLatRad = (cLat * Math.PI) / 180.0;
  const dLatKm = Math.abs(maxLat - minLat) * 111.139;
  const dLonKm = Math.abs(maxLon - minLon) * 111.32 * Math.cos(meanLatRad);
  const approxAreaKm2 = (dLatKm * dLonKm).toFixed(2);

  const handleStartDrawBox = () => {
    if (drawMode === 'box' && isDrawingBBox) {
      setIsDrawingBBox(false);
      setDrawMode(null);
    } else {
      setDrawMode('box');
      setIsDrawingBBox(true);
    }
  };

  const handleStartDrawPolygon = () => {
    if (drawMode === 'polygon' && isDrawingBBox) {
      setIsDrawingBBox(false);
      setDrawMode(null);
    } else {
      setDrawMode('polygon');
      setIsDrawingBBox(true);
    }
  };

  const handleQuickAnalyze = () => {
    // Send standard query for this AOI
    window.dispatchEvent(
      new CustomEvent('satquery:analyze-aoi', {
        detail: {
          prompt: `Analyze satellite imagery, vegetation canopy, water bodies, and activity in this survey AOI (${approxAreaKm2} km²).`,
          bbox: currentBBox,
        },
      })
    );
  };

  const isCustomDrawn = Boolean(drawnBBox || drawnPolygon);

  return (
    <div className="bg-space-950/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-xs font-mono text-slate-200 space-y-3 w-80 animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] tracking-wider uppercase">Survey Region (AOI)</span>
        </div>
        {isCustomDrawn ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
            CUSTOM AOI
          </span>
        ) : (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-space-850 border border-slate-700 text-slate-400">
            DEFAULT REGION
          </span>
        )}
      </div>

      {/* Coordinate Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-slate-300">
        <div className="bg-space-900/80 p-2 rounded-lg border border-slate-800/80">
          <div className="text-[9px] text-slate-500 uppercase font-sans">Latitude Extent</div>
          <div className="font-bold text-cyan-300 text-[11px] mt-0.5">
            {minLat.toFixed(3)}°N &rarr; {maxLat.toFixed(3)}°N
          </div>
        </div>

        <div className="bg-space-900/80 p-2 rounded-lg border border-slate-800/80">
          <div className="text-[9px] text-slate-500 uppercase font-sans">Longitude Extent</div>
          <div className="font-bold text-cyan-300 text-[11px] mt-0.5">
            {minLon.toFixed(3)}°E &rarr; {maxLon.toFixed(3)}°E
          </div>
        </div>
      </div>

      {/* Ground Footprint Area & Centroid */}
      <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40">
        <div className="flex items-center gap-1.5 text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>Calculated Area:</span>
        </div>
        <span className="font-bold text-cyan-300 text-xs">{approxAreaKm2} km²</span>
      </div>

      {/* Interactive Drawing Controls */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
          Drawing & Selection Tools
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleStartDrawBox}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              drawMode === 'box' && isDrawingBBox
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/30'
                : 'bg-space-900 hover:bg-space-850 text-slate-200 border-slate-750'
            }`}
          >
            <Square className="w-3 h-3" />
            <span>{drawMode === 'box' && isDrawingBBox ? 'CLICK 2 CORNERS' : 'DRAW BOX'}</span>
          </button>

          <button
            onClick={handleStartDrawPolygon}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              drawMode === 'polygon' && isDrawingBBox
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/30'
                : 'bg-space-900 hover:bg-space-850 text-slate-200 border-slate-750'
            }`}
          >
            <Pentagon className="w-3 h-3" />
            <span>{drawMode === 'polygon' && isDrawingBBox ? 'CLICK POINTS' : 'DRAW POLYGON'}</span>
          </button>
        </div>
      </div>

      {/* Action Buttons: Clear Region & Analyze Region */}
      <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-2">
        {isCustomDrawn && (
          <button
            onClick={clearDrawnAOI}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[10px] font-semibold transition-colors"
            title="Reset to Region Default"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        )}

        <button
          onClick={handleQuickAnalyze}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[10px] transition-all shadow-md shadow-cyan-600/20"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
          <span>ANALYZE THIS REGION</span>
        </button>
      </div>
    </div>
  );
};
