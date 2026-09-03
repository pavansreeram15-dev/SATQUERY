import React, { useState, useEffect } from 'react';
import { useMapContext } from '../../context/MapContext';
import { usePersona } from '../../context/PersonaContext';
import { SAMPLE_REGIONS } from '../../config/sampleRegions';
import { airQualityService, AirQualityData } from '../../services/airQualityService';
import {
  Crosshair,
  Square,
  Pentagon,
  Trash2,
  Sparkles,
  MapPin,
  Wind,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Activity
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
  } = useMapContext();

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);

  const safeRegion = activeRegion || SAMPLE_REGIONS[0];
  const currentBBox = drawnBBox || safeRegion.bbox || [80.27, 13.07, 80.34, 13.14];

  const minLon = typeof currentBBox[0] === 'number' ? currentBBox[0] : 80.27;
  const minLat = typeof currentBBox[1] === 'number' ? currentBBox[1] : 13.07;
  const maxLon = typeof currentBBox[2] === 'number' ? currentBBox[2] : 80.34;
  const maxLat = typeof currentBBox[3] === 'number' ? currentBBox[3] : 13.14;

  const cLat = (minLat + maxLat) / 2.0;
  const cLon = (minLon + maxLon) / 2.0;

  const meanLatRad = (cLat * Math.PI) / 180.0;
  const dLatKm = Math.abs(maxLat - minLat) * 111.139;
  const dLonKm = Math.abs(maxLon - minLon) * 111.32 * Math.cos(meanLatRad);
  const approxAreaKm2 = (dLatKm * dLonKm).toFixed(2);

  // Fetch live Open-Meteo European CAMS Air Quality Telemetry
  useEffect(() => {
    let isMounted = true;
    airQualityService.getAirQuality(cLat, cLon).then((data) => {
      if (isMounted) setAirQuality(data);
    });
    return () => {
      isMounted = false;
    };
  }, [cLat, cLon]);

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
    window.dispatchEvent(
      new CustomEvent('satquery:analyze-aoi', {
        detail: {
          prompt: `Analyze high-resolution satellite imagery, land cover, water bodies, and atmospheric telemetry in this survey AOI (${approxAreaKm2} km²).`,
          bbox: currentBBox,
        },
      })
    );
  };

  const isCustomDrawn = Boolean(drawnBBox || drawnPolygon);

  return (
    <div className="absolute top-4 left-4 z-[400] select-none font-mono text-xs">
      <div className="bg-space-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 w-72 md:w-80 overflow-hidden flex flex-col transition-all">
        {/* Header Bar */}
        <div className="px-3 py-2 bg-space-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] tracking-wide">DRAW REGION & AOI</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isCustomDrawn ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                CUSTOM AOI
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-space-850 border border-slate-700 text-slate-400">
                DEFAULT
              </span>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-space-800 transition-colors"
              title={isOpen ? 'Collapse' : 'Expand'}
            >
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isOpen && (
          <div className="p-3 space-y-2.5">
            {/* Live Interactive Draw Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleStartDrawBox}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                  drawMode === 'box' && isDrawingBBox
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/30'
                    : 'bg-space-900 hover:bg-space-850 text-slate-200 border-slate-750'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>{drawMode === 'box' && isDrawingBBox ? 'CLICK 2 CORNERS' : 'DRAW BOX'}</span>
              </button>

              <button
                onClick={handleStartDrawPolygon}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                  drawMode === 'polygon' && isDrawingBBox
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/30'
                    : 'bg-space-900 hover:bg-space-850 text-slate-200 border-slate-750'
                }`}
              >
                <Pentagon className="w-3.5 h-3.5" />
                <span>{drawMode === 'polygon' && isDrawingBBox ? 'CLICK VERTICES' : 'DRAW POLYGON'}</span>
              </button>
            </div>

            {/* Active Drawing Guide Prompt */}
            {isDrawingBBox && (
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-[10px] text-cyan-200 animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>
                  {drawMode === 'box'
                    ? 'Click 2 points on the map to define the custom rectangle AOI.'
                    : 'Click points on the map to draw polygon. Double-click to complete.'}
                </span>
              </div>
            )}

            {/* AOI Metrics & Live Area */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-space-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>AOI Ground Footprint:</span>
              </div>
              <span className="font-bold text-cyan-300 text-xs">{approxAreaKm2} km²</span>
            </div>

            {/* Live Open-Meteo European CAMS Air Quality Telemetry Card */}
            {airQuality && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-space-900 to-space-850 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[10px]">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COPERNICUS AIR QUALITY</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                      airQuality.severity === 'LOW'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : airQuality.severity === 'MODERATE'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    AQI {airQuality.european_aqi} ({airQuality.category})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-300">
                  <div className="bg-space-950/80 p-1 rounded border border-slate-800">
                    <span className="text-slate-500 block">PM2.5</span>
                    <span className="font-bold text-slate-200">{airQuality.pollutants.pm2_5_ug_m3} µg</span>
                  </div>
                  <div className="bg-space-950/80 p-1 rounded border border-slate-800">
                    <span className="text-slate-500 block">PM10</span>
                    <span className="font-bold text-slate-200">{airQuality.pollutants.pm10_ug_m3} µg</span>
                  </div>
                  <div className="bg-space-950/80 p-1 rounded border border-slate-800">
                    <span className="text-slate-500 block">NO₂</span>
                    <span className="font-bold text-slate-200">{airQuality.pollutants.nitrogen_dioxide_ug_m3} µg</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
              {isCustomDrawn && (
                <button
                  onClick={clearDrawnAOI}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  title="Clear custom drawing"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              )}

              <button
                onClick={handleQuickAnalyze}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[10px] transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>ANALYZE REGION</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
