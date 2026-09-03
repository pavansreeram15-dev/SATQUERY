import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';

// Lazy load non-critical pages for instant app boot and low memory footprint
const LandingPage = lazy(() =>
  import('../pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const HistoryPage = lazy(() =>
  import('../pages/HistoryPage').then((m) => ({ default: m.HistoryPage }))
);
const AnalyticsPage = lazy(() =>
  import('../pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const AboutPage = lazy(() =>
  import('../pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

const RouteFallback: React.FC = () => (
  <div className="w-full h-screen bg-space-950 flex items-center justify-center font-mono text-cyan-400 text-xs">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
      <span>Loading Mission View...</span>
    </div>
  </div>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analysis" element={<DashboardPage />} />
        <Route path="/reports" element={<HistoryPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/settings" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
