import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { AppRoutes } from './app/routes';

export function App() {
  return (
    <AppProviders>
      <Router>
        <AppRoutes />
      </Router>
    </AppProviders>
  );
}

export default App;
