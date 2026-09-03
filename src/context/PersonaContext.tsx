import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserPersona, PersonaConfig, PersonaPermissions } from '../types/persona';
import { PERSONA_CONFIGS } from '../config/personaConfig';

interface PersonaContextType {
  persona: UserPersona;
  setPersona: (persona: UserPersona) => void;
  config: PersonaConfig;
  permissions: PersonaPermissions;
  hasPermission: (key: keyof PersonaPermissions) => boolean;
  isLayerAllowed: (allowedPersonas: UserPersona[]) => boolean;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const STORAGE_KEY = 'satquery_active_persona';

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persona, setPersonaState] = useState<UserPersona>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'ISRO_ANALYST' || saved === 'NDRF_OFFICER' || saved === 'PUBLIC_RESEARCHER')) {
      return saved as UserPersona;
    }
    return 'PUBLIC_RESEARCHER'; // Default per Section 51
  });

  const config = PERSONA_CONFIGS[persona];
  const permissions = config.permissions;

  const setPersona = (newPersona: UserPersona) => {
    setPersonaState(newPersona);
    localStorage.setItem(STORAGE_KEY, newPersona);
  };

  const hasPermission = (key: keyof PersonaPermissions): boolean => {
    return !!permissions[key];
  };

  const isLayerAllowed = (allowedPersonas: UserPersona[]): boolean => {
    return allowedPersonas.includes(persona);
  };

  return (
    <PersonaContext.Provider
      value={{
        persona,
        setPersona,
        config,
        permissions,
        hasPermission,
        isLayerAllowed,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = (): PersonaContextType => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};
