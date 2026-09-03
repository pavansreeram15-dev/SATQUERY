import React, { useState } from 'react';
import {
  Ship,
  Search,
  SlidersHorizontal,
  Radio,
  Layers,
  Link2,
  Anchor,
  Activity,
  X
} from 'lucide-react';
import { AISFilterState, AISStatusResponse, AISVessel } from '../../types/ais';
import { useMapContext } from '../../context/MapContext';

interface MaritimeControlBarProps {
  status: AISStatusResponse | null;
  vesselsCount: number;
  filters: AISFilterState;
  onFilterChange: (filters: AISFilterState) => void;
  onSearchVessel: (query: string) => void;
  searchResults: AISVessel[];
  onSelectVessel: (vessel: AISVessel) => void;
}

const SHIP_TYPES = ['Cargo', 'Tanker', 'Passenger', 'Fishing', 'Tug', 'Military', 'Pleasure', 'Other'];

export const MaritimeControlBar: React.FC<MaritimeControlBarProps> = ({
  status,
  vesselsCount,
  filters,
  onFilterChange,
  onSearchVessel,
  searchResults,
  onSelectVessel,
}) => {
  const { layers, toggleLayer, setViewportBBox } = useMapContext();
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');

  const handleTypeToggle = (type: string) => {
    let updated: string[];
    if (filters.selectedTypes.includes(type)) {
      updated = filters.selectedTypes.filter((t) => t !== type);
    } else {
      updated = [...filters.selectedTypes, type];
    }
    onFilterChange({ ...filters, selectedTypes: updated });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchVessel(searchInput);
  };

  const handleSelectSearchResult = (vessel: AISVessel) => {
    const span = 0.05;
    setViewportBBox([
      vessel.longitude - span,
      vessel.latitude - span,
      vessel.longitude + span,
      vessel.latitude + span,
    ]);
    onSelectVessel(vessel);
  };

  const getStatusBadge = () => {
    const st = status?.status || 'DISCONNECTED';
    if (st === 'CONNECTED') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AIS CONNECTED ({vesselsCount} Visible)</span>
        </span>
      );
    }
    if (st === 'CONNECTING' || st === 'RECONNECTING') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
          <Activity className="w-3 h-3 text-amber-400 animate-spin" />
          <span>{st} TO AISSTREAM...</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-400">
        <Radio className="w-3 h-3 text-slate-400" />
        <span>AIS {st}</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl bg-space-900/90 border border-slate-800 shadow-2xl backdrop-blur-md p-3 text-xs text-slate-100 space-y-3 font-mono">
      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <Ship className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
              <span>Global AIS Vessel Tracking</span>
            </div>
            <div className="text-[10px] text-slate-400">Live AISStream.io Telemetry</div>
          </div>
        </div>

        {getStatusBadge()}
      </div>

      {/* Layer Toggles & Search Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleLayer('liveAisVessels')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all border ${
              layers.liveAisVessels
                ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300 shadow-sm'
                : 'bg-space-850 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>🚢 AIS Vessels</span>
          </button>

          <button
            onClick={() => toggleLayer('aisSatelliteCorrelation')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-[10px] transition-all border ${
              layers.aisSatelliteCorrelation
                ? 'bg-purple-950/90 border-purple-500/50 text-purple-300 shadow-sm'
                : 'bg-space-850 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>🔗 AIS ↔ Sat Correlation</span>
          </button>

          <button
            onClick={() => toggleLayer('submarineCables')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-[10px] transition-all border ${
              layers.submarineCables
                ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300 shadow-sm'
                : 'bg-space-850 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Global Submarine Fiber Optic Cables (Gigawatt Map / TeleGeography — CC BY-NC-SA 3.0)"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>🌐 Submarine Cables</span>
          </button>

          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`p-1.5 rounded-lg border transition-all ${
              filterPanelOpen
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                : 'bg-space-850 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Vessel Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Global Vessel Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-xs">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search MMSI, Name, IMO..."
            className="w-full pl-8 pr-7 py-1 rounded-lg bg-space-950 border border-slate-700 text-slate-200 placeholder-slate-500 text-[11px] focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onFilterChange({ ...filters, searchQuery: '' });
              }}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Global Vessel Search Results Dropdown */}
      {searchResults && searchResults.length > 0 && (
        <div className="p-2 rounded-xl bg-space-950 border border-slate-700 space-y-1 max-h-40 overflow-y-auto animate-in fade-in">
          <div className="text-[10px] text-cyan-400 font-bold uppercase">Matched Vessels ({searchResults.length}):</div>
          {searchResults.map((v) => (
            <button
              key={v.mmsi}
              onClick={() => handleSelectSearchResult(v)}
              className="w-full text-left p-1.5 rounded-lg hover:bg-space-850 flex items-center justify-between text-[11px] transition-colors border border-transparent hover:border-slate-800"
            >
              <div>
                <span className="font-bold text-slate-200">{v.name}</span>
                <span className="text-[10px] text-slate-400 ml-2">MMSI: {v.mmsi}</span>
              </div>
              <div className="text-[10px] text-cyan-400 font-bold">{v.speed_knots} kn</div>
            </button>
          ))}
        </div>
      )}

      {/* Expandable Vessel Filter Panel */}
      {filterPanelOpen && (
        <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
          {/* Ship Type Checkboxes */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center justify-between">
              <span>Filter by Ship Type</span>
              <button
                onClick={() => onFilterChange({ ...filters, selectedTypes: [] })}
                className="text-slate-400 hover:text-white text-[9px] underline"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              {SHIP_TYPES.map((st) => {
                const checked = filters.selectedTypes.includes(st);
                return (
                  <label
                    key={st}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                        : 'bg-space-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTypeToggle(st)}
                      className="hidden"
                    />
                    <span>{st}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Speed & Nav Status Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Speed Range</label>
              <select
                value={filters.speedRange}
                onChange={(e) => onFilterChange({ ...filters, speedRange: e.target.value as any })}
                className="w-full p-1.5 rounded-lg bg-space-900 border border-slate-700 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Speeds</option>
                <option value="0-5">0 – 5 knots (At Anchor / Stationary)</option>
                <option value="5-10">5 – 10 knots (Slow Transit)</option>
                <option value="10-20">10 – 20 knots (Normal Cruising)</option>
                <option value="20+">20+ knots (High Speed)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Navigation Status</label>
              <select
                value={filters.navStatus}
                onChange={(e) => onFilterChange({ ...filters, navStatus: e.target.value })}
                className="w-full p-1.5 rounded-lg bg-space-900 border border-slate-700 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Navigation States</option>
                <option value="Under Way">Under Way</option>
                <option value="At Anchor">At Anchor</option>
                <option value="Moored">Moored</option>
                <option value="Restricted">Restricted Manoeuvrability</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
