import React from 'react';
import { vi } from 'vitest';
import type { User as DBUser } from '@shared/types/database';

export const mockAuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

export const mockDbUser: DBUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  is_verified: true,
  two_factor_enabled: false,
  preferred_currency: 'USD',
  notification_preferences: {
    email_on_transaction: true,
    email_on_withdrawal: true,
    email_on_price_alert: true,
    push_notifications: true,
  },
  kyc_status: 'verified',
  account_status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockAuthContextValue = {
  authUser: mockAuthUser,
  dbUser: mockDbUser,
  loading: false,
  error: null,
  signUp: vi.fn().mockResolvedValue(undefined),
  signIn: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  connectWallet: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: true,
};

export const AuthContext = React.createContext(mockAuthContextValue);

interface AuthProviderProps {
  children: React.ReactNode;
  value?: typeof mockAuthContextValue;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  value = mockAuthContextValue 
}) => {
  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export const useAuth = () => React.useContext(AuthContext);

export default {
  ...AuthContext,
  Provider: AuthProvider,
  Consumer: AuthContext.Consumer,
};
