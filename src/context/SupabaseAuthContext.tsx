import React, { createContext, useContext } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { User } from '../types';

interface SupabaseAuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<{ success: boolean; error: string | null }>;
  signUp: (email: string, password: string, userData: {
    name: string;
    role: 'admin' | 'area_manager' | 'analyst' | 'consultant';
    area?: string;
  }) => Promise<{ success: boolean; error: string | null }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const useSupabaseAuthContext = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuthContext must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useSupabaseAuth();

  return (
    <SupabaseAuthContext.Provider value={auth}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};