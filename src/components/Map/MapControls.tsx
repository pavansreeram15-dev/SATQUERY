import React, { useState } from 'react';
import { useMapContext } from '../../context/MapContext';
import { usePersona } from '../../context/PersonaContext';
import { BASEMAP_TILES, BHUVAN_LAYERS_CONFIG } from '../../config/mapConfig';
import { BasemapType, ActiveLayerState } from '../../types/map';
import { cableApi } from '../../services/cableApi';
import {
  Layers,
  Crosshair,
  RotateCcw,
  Sliders,
  Radio,
  Search,
  X,
  Globe,
  Anchor,
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
    setViewportBBox,
  } = useMapContext();

  const { persona } = usePersona();
  const [panelOpen, setPanelOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'layers' | 'basemap'>('layers');
  const [showCableSearch, setShowCableSearch] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<{
    cables: Array<{ id: string; name: string; color?: string; owners?: string; length?: string }>;
    landing_points: Array<{ id: string; name: string; country?: string; coordinates?: [number, number] }>;
  }>({ cables: [], landing_points: [] });

  const basemaps: BasemapType[] = ['dark', 'satellite', 'street', 'topo'];

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    try {
      const res = await cableApi.search(searchInput.trim());
      setSearchResults({
        cables: res.cables || [],
        landing_points: res.landing_points || []
      });
    } catch (err) {
      console.warn('[MapControls] Cable search warning:', err);
      setSearchResults({ cables: [], landing_points: [] });
    }
  };

  const handleSelectLandingPoint = (coords: [number, number]) => {
    const span = 0.08;
    setViewportBBox([
      coords[0] - span,
      coords[1] - span,
      coords[0] + span,
      coords[1] + span,
    ]);
  };

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
        <div className="w-80 bg-space-950/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-3 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
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
            <div className="pt-2.5 space-y-2 max-h-80 overflow-y-auto pr-1">
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

              {/* Submarine Cables Layer Item */}
              <div className="p-1.5 rounded-lg border border-slate-800 bg-space-900/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="font-semibold text-slate-100">Submarine Fiber Optic Cables</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowCableSearch(!showCableSearch)}
                      className="p-1 rounded text-[10px] text-cyan-400 hover:bg-space-800"
                      title="Search Cables & Terminals"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggleLayer('submarineCables')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        layers.submarineCables ? 'bg-cyan-500 text-black' : 'bg-space-800 text-slate-400'
                      }`}
                    >
                      {layers.submarineCables ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Submarine Cable Search & Terminal Lookup Box */}
                {showCableSearch && (
                  <div className="pt-1.5 border-t border-slate-800 space-y-1.5 animate-in fade-in">
                    <form onSubmit={handleSearchSubmit} className="relative w-full">
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search cable, landing terminal, country..."
                        className="w-full pl-7 pr-6 py-1 rounded-lg bg-space-950 border border-slate-700 text-slate-200 placeholder-slate-500 text-[10px] focus:outline-none focus:border-cyan-500"
                      />
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                      {searchInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput('');
                            setSearchResults({ cables: [], landing_points: [] });
                          }}
                          className="absolute right-1.5 top-2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </form>

                    {((searchResults?.cables?.length ?? 0) > 0 || (searchResults?.landing_points?.length ?? 0) > 0) && (
                      <div className="p-1.5 rounded-lg bg-space-950 border border-slate-800 space-y-1 max-h-36 overflow-y-auto">
                        {searchResults.cables.length > 0 && (
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-cyan-400 font-bold uppercase">Cables ({searchResults.cables.length}):</div>
                            {searchResults.cables.map((c) => (
                              <div key={c.id} className="p-1 rounded bg-space-900 text-[10px] flex justify-between">
                                <span className="font-semibold text-slate-200">{c.name}</span>
                                <span className="text-[9px] text-slate-400">{c.length || 'Active'}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {searchResults.landing_points.length > 0 && (
                          <div className="space-y-0.5 pt-1 border-t border-slate-800">
                            <div className="text-[9px] text-sky-400 font-bold uppercase">Terminals ({searchResults.landing_points.length}):</div>
                            {searchResults.landing_points.map((lp) => (
                              <button
                                key={lp.id}
                                onClick={() => lp.coordinates && handleSelectLandingPoint(lp.coordinates)}
                                className="w-full text-left p-1 rounded hover:bg-space-850 flex justify-between text-[10px]"
                              >
                                <span className="font-semibold text-slate-200">{lp.name}</span>
                                <span className="text-[9px] text-sky-300">{lp.country || 'Terminal'}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
