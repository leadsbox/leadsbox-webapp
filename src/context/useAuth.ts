import { useContext, createContext } from 'react';
import type { AuthState } from './AuthContext';

// Export the context so it can be used by AuthContext
export const AuthContext = createContext<AuthState | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
