import React, { ReactNode } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { PersonaProvider } from '../../context/PersonaContext';
import { MapProvider } from '../../context/MapContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <PersonaProvider>
        <MapProvider>
          {children}
        </MapProvider>
      </PersonaProvider>
    </AuthProvider>
  );
}
