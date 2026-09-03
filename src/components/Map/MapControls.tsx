import React, { useState } from 'react';
import { useMapContext } from '../../context/MapContext';
import { usePersona } from '../../context/PersonaContext';
import { BASEMAP_TILES, BHUVAN_LAYERS_CONFIG } from '../../config/mapConfig';
import { BasemapType, ActiveLayerState } from '../../types/map';
import {
  Layers,
  MapPin,
  Eye,
  EyeOff,
  Crosshair,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldAlert,
  Satellite,
  Compass,
  Sliders,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export const MapControls: React.FC = () => {
  const {
    layers,
    toggleLayer,
    setBasemap,
    resetMapToRegion,
    isDrawingBBox,
    setIsDrawingBBox,
    comparison,
    setComparison,
  } = useMapContext();

  const { persona, hasPermission } = usePersona();
  const [panelOpen, setPanelOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'layers' | 'basemap'>('layers');

  const basemaps: BasemapType[] = ['dark', 'satellite', 'street', 'topo'];

  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2 font-mono text-xs select-none">
      {/* Quick Action Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-space-950/90 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md">
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className={`p-2 rounded-lg transition-all ${
            panelOpen
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-300 hover:text-white hover:bg-space-800'
          }`}
          title="Toggle GIS Layer Stack"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsDrawingBBox(!isDrawingBBox)}
          className={`p-2 rounded-lg transition-all ${
            isDrawingBBox
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-space-800'
          }`}
          title="Draw Custom Survey BBOX"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={() => setComparison((prev) => ({ ...prev, enabled: !prev.enabled }))}
          className={`p-2 rounded-lg transition-all ${
            comparison.enabled
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-space-800'
          }`}
          title="Multi-Temporal Split Slider"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={resetMapToRegion}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-space-800 transition-all"
          title="Recenter to Region"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Layers & Basemaps Panel */}
      {panelOpen && (
        <div className="w-72 bg-space-950/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-3 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('layers')}
                className={`text-[11px] font-bold pb-0.5 transition-colors ${
                  activeTab === 'layers'
                    ? 'text-cyan-400 border-b border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                INTELLIGENCE LAYERS
              </button>
              <button
                onClick={() => setActiveTab('basemap')}
                className={`text-[11px] font-bold pb-0.5 transition-colors ${
                  activeTab === 'basemap'
                    ? 'text-cyan-400 border-b border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BASEMAP TILES
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">EPSG:4326</span>
          </div>

          {activeTab === 'layers' ? (
            <div className="pt-2.5 space-y-2 max-h-72 overflow-y-auto pr-1">
              <div className="text-[10px] font-bold uppercase text-slate-500">Live Earth & AI Overlays</div>

              <LayerToggleItem
                label="Live Disasters (USGS/NASA/GDACS)"
                active={layers.liveDisasters}
                color="#EF4444"
                onToggle={() => toggleLayer('liveDisasters')}
              />

              <LayerToggleItem
                label="Target Detections (YOLO-OBB)"
                active={layers.detections}
                color="#06B6D4"
                onToggle={() => toggleLayer('detections')}
              />

              <LayerToggleItem
                label="Flood Inundation (SAR)"
                active={layers.flood}
                color="#3B82F6"
                onToggle={() => toggleLayer('flood')}
              />

              <LayerToggleItem
                label="Vegetation Health (NDVI)"
                active={layers.ndvi}
                color="#10B981"
                onToggle={() => toggleLayer('ndvi')}
              />

              <LayerToggleItem
                label="Multi-Temporal Change Vectors"
                active={layers.change}
                color="#F59E0B"
                onToggle={() => toggleLayer('change')}
              />

              <div className="text-[10px] font-bold uppercase text-slate-500 pt-2 border-t border-slate-800/80">
                ISRO Bhuvan Thematic WMS
              </div>

              {BHUVAN_LAYERS_CONFIG.map((bLayer) => {
                const isAllowed = bLayer.allowedPersonas.includes(persona);
                const active = (layers as any)[bLayer.id];

                return (
                  <div
                    key={bLayer.id}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-[11px] transition-all ${
                      !isAllowed
                        ? 'opacity-40 border-slate-900 bg-space-950 cursor-not-allowed'
                        : active
                        ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200'
                        : 'border-slate-800/80 bg-space-900/60 hover:bg-space-850 text-slate-300'
                    }`}
                  >
                    <span className="truncate pr-2">{bLayer.name}</span>
                    {isAllowed ? (
                      <button
                        onClick={() => toggleLayer(bLayer.id as keyof ActiveLayerState)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          active ? 'bg-cyan-500 text-black' : 'bg-space-800 text-slate-400'
                        }`}
                      >
                        {active ? 'ON' : 'OFF'}
                      </button>
                    ) : (
                      <span className="text-[9px] text-amber-500 font-mono">LOCKED</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pt-2.5 space-y-1.5">
              {basemaps.map((bKey) => {
                const bInfo = BASEMAP_TILES[bKey];
                const isSelected = layers.basemap === bKey;

                return (
                  <button
                    key={bKey}
                    onClick={() => setBasemap(bKey)}
                    className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-semibold'
                        : 'bg-space-900/60 border-slate-800/80 hover:bg-space-850 text-slate-300'
                    }`}
                  >
                    <span>{bInfo.name}</span>
                    {isSelected && <span className="text-[10px] text-cyan-400">ACTIVE</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LayerToggleItem: React.FC<{
  label: string;
  active: boolean;
  color: string;
  onToggle: () => void;
}> = ({ label, active, color, onToggle }) => {
  return (
    <div
      className={`flex items-center justify-between p-1.5 rounded-lg border text-[11px] transition-all ${
        active
          ? 'border-slate-700 bg-space-900/80 text-slate-100'
          : 'border-slate-850 bg-space-950 text-slate-400 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          active ? 'bg-cyan-500 text-black' : 'bg-space-800 text-slate-400'
        }`}
      >
        {active ? 'ON' : 'OFF'}
      </button>
    </div>
  );
};
