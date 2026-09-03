import React, { Component, ErrorInfo, ReactNode } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { AppRoutes } from './app/routes';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SATQUERY ErrorBoundary] Uncaught runtime error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-space-950 flex flex-col items-center justify-center p-6 text-center font-mono text-slate-100">
          <div className="max-w-md p-6 rounded-2xl bg-space-900 border border-cyan-500/40 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-300 font-bold text-xl">
              🛰️
            </div>
            <h1 className="text-lg font-bold text-cyan-400">SATQUERY AI Workstation</h1>
            <p className="text-xs text-slate-400">
              The mission workstation encountered a runtime display exception. All telemetry feeds remain safe.
            </p>
            {this.state.error && (
              <div className="p-2 rounded-lg bg-space-950 border border-slate-800 text-[10px] text-amber-300 text-left font-mono overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-colors"
            >
              🔄 Reload Mission Workstation
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <Router>
          <AppRoutes />
        </Router>
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
