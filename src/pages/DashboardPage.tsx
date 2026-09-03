import React from 'react';
import { Header } from '../components/Dashboard/Header';
import { TelemetryBar } from '../components/Dashboard/TelemetryBar';
import { SatelliteMap } from '../components/Map/SatelliteMap';
import { AssistantPanel } from '../components/AI/AssistantPanel';
import { ErrorBoundary } from '../components/Common/ErrorBoundary';

export const DashboardPage: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Mission Control Dashboard">
      <div className="h-screen w-screen flex flex-col bg-space-950 text-slate-100 overflow-hidden font-sans select-none">
        {/* Top Application Header */}
        <Header />

        {/* Live System Telemetry Bar */}
        <TelemetryBar />

        {/* Main Mission Workspace: 70% Map / 30% AI Assistant */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Primary Geospatial Interactive Map (70%) */}
          <div className="flex-1 h-[60vh] lg:h-full relative overflow-hidden">
            <ErrorBoundary fallbackTitle="Geospatial Map Canvas">
              <SatelliteMap />
            </ErrorBoundary>
          </div>

          {/* AI Remote Sensing Assistant Panel (30%) */}
          <aside className="w-full lg:w-[420px] xl:w-[480px] h-[40vh] lg:h-full flex-shrink-0 relative z-10 shadow-2xl">
            <ErrorBoundary fallbackTitle="AI Assistant Panel">
              <AssistantPanel />
            </ErrorBoundary>
          </aside>
        </main>
      </div>
    </ErrorBoundary>
  );
};
