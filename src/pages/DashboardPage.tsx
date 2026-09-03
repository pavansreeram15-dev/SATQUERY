import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Dashboard/Header';
import { TelemetryBar } from '../components/Dashboard/TelemetryBar';
import { SatelliteMap } from '../components/Map/SatelliteMap';
import { AssistantPanel } from '../components/AI/AssistantPanel';
import { ErrorBoundary } from '../components/Common/ErrorBoundary';
import { GripVertical } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  // Resizable AI Assistant panel width (persisted in localStorage)
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('satquery_assistant_panel_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 320 && parsed <= 900) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 460;
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResize = useCallback(() => {
    if (isDraggingRef.current) {
      setIsDragging(false);
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem('satquery_assistant_panel_width', String(panelWidth));
      } catch {
        // ignore
      }
    }
  }, [panelWidth]);

  const onMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const maxWidth = Math.min(950, window.innerWidth * 0.65);
    const minWidth = 320;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, window.innerWidth - clientX));
    setPanelWidth(newWidth);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', stopResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', stopResize);
    };
  }, [onMouseMove, stopResize]);

  // Double-click toggle between standard (460px) and wide analysis mode (680px)
  const handleTogglePreset = () => {
    const nextWidth = panelWidth > 550 ? 460 : 700;
    setPanelWidth(nextWidth);
    try {
      localStorage.setItem('satquery_assistant_panel_width', String(nextWidth));
    } catch {
      // ignore
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Mission Control Dashboard">
      <div className="h-screen w-screen flex flex-col bg-space-950 text-slate-100 overflow-hidden font-sans select-none">
        {/* Top Application Header */}
        <Header />

        {/* Live System Telemetry Bar */}
        <TelemetryBar />

        {/* Main Mission Workspace */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Primary Geospatial Interactive Map */}
          <div className="flex-1 h-[60vh] lg:h-full relative overflow-hidden">
            <ErrorBoundary fallbackTitle="Geospatial Map Canvas">
              <SatelliteMap />
            </ErrorBoundary>
          </div>

          {/* Interactive Drag Splitter (Desktop) */}
          <div
            onMouseDown={startResize}
            onTouchStart={startResize}
            onDoubleClick={handleTogglePreset}
            className={`hidden lg:flex w-2 bg-space-950 hover:bg-cyan-500/20 active:bg-cyan-500/40 border-l border-slate-800 transition-colors cursor-col-resize items-center justify-center group select-none relative z-20 ${
              isDragging ? 'bg-cyan-500/30' : ''
            }`}
            title="Drag to resize AI Assistant panel (Double-click to expand/restore)"
          >
            <div className="w-0.5 h-8 bg-slate-700 group-hover:bg-cyan-400 group-hover:h-12 transition-all rounded-full flex items-center justify-center">
              <GripVertical className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* AI Remote Sensing Assistant Panel (Resizable) */}
          <aside
            style={{ width: `${panelWidth}px` }}
            className="w-full lg:w-auto h-[40vh] lg:h-full flex-shrink-0 relative z-10 shadow-2xl transition-[width] duration-75 ease-out"
          >
            <ErrorBoundary fallbackTitle="AI Assistant Panel">
              <AssistantPanel />
            </ErrorBoundary>
          </aside>
        </main>
      </div>
    </ErrorBoundary>
  );
};
