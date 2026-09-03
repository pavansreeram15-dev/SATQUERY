import React, { useState, useEffect, useRef } from 'react';
import { useMapContext } from '../../context/MapContext';
import { queryService } from '../../services/queryService';
import { LocationSearchResult } from '../../types/query';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';

export const LocationSearchBar: React.FC = () => {
  const { setViewportBBox, setSearchLocation, setDrawnBBox, setQueryResult } = useMapContext();
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await queryService.searchLocations(query, 5);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (loc: LocationSearchResult) => {
    setSearchLocation(loc);
    setViewportBBox(loc.bbox);
    setDrawnBBox(loc.bbox);
    setQueryResult(null);
    setQuery(loc.display_name.split(',')[0]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setSearchLocation(null);
  };

  return (
    <div ref={wrapperRef} className="relative w-64 md:w-80 font-mono text-xs z-50">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search global city, region, or lat, lon..."
          className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-space-900/90 border border-slate-700/80 hover:border-cyan-500/50 focus:border-cyan-400 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/40 shadow-inner backdrop-blur-md transition-all font-sans"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 w-3.5 h-3.5 text-cyan-400 animate-spin" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-space-950/95 border border-slate-700/90 rounded-xl shadow-2xl backdrop-blur-xl max-h-64 overflow-y-auto z-50 py-1 divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
          {suggestions.map((loc) => (
            <button
              key={loc.place_id}
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-3 py-2 hover:bg-space-900/80 flex items-start gap-2.5 transition-colors group"
            >
              <MapPin className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-100 text-xs truncate group-hover:text-cyan-300 font-sans">
                  {loc.display_name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                  <span className="text-cyan-400/90">
                    {loc.lat.toFixed(4)}°, {loc.lon.toFixed(4)}°
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-space-850 text-slate-300">
                    {loc.type || 'place'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
