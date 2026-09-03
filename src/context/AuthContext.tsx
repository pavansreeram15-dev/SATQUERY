import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserPersona } from '../types/persona';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  persona: UserPersona;
  organization: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, persona?: UserPersona) => Promise<boolean>;
  register: (email: string, pass: string, fullName: string, persona?: UserPersona) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'satquery_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default initial development session
    return {
      id: 'usr-dev-isro-001',
      email: 'analyst@isro.gov.in',
      fullName: 'Dr. P. Swaminathan',
      role: 'LEAD_ANALYST',
      persona: 'ISRO_ANALYST',
      organization: 'ISRO Space Applications Centre (SAC)',
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, _pass: string, persona: UserPersona = 'PUBLIC_RESEARCHER'): Promise<boolean> => {
    setIsLoading(true);
    // Simulate auth check / Supabase fallback
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const newUser: UserProfile = {
      id: `usr-${Math.random().toString(36).substring(2, 9)}`,
      email,
      fullName: email.split('@')[0].toUpperCase(),
      role: 'ANALYST',
      persona,
      organization: persona === 'ISRO_ANALYST' ? 'ISRO Satellite Center' : (persona === 'NDRF_OFFICER' ? 'NDRF Operations Command' : 'National Remote Sensing Laboratory'),
    };
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const register = async (email: string, _pass: string, fullName: string, persona: UserPersona = 'PUBLIC_RESEARCHER'): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const newUser: UserProfile = {
      id: `usr-${Math.random().toString(36).substring(2, 9)}`,
      email,
      fullName,
      role: 'ANALYST',
      persona,
      organization: 'Geospatial Research Group',
    };
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
