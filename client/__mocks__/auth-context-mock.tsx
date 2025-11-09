import React from 'react';
import { vi } from 'vitest';
import { User } from '@shared/types/database';

export const mockAuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

export const createTestUser = (overrides: Partial<User> = {}): User => ({
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
  ...overrides,
});

export const mockAuthContextValue = {
  authUser: mockAuthUser,
  dbUser: createTestUser(),
  loading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  updateUser: vi.fn(),
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
};

const AuthContext = React.createContext(mockAuthContextValue);

// Create a test provider component
type AuthProviderProps = {
  children: React.ReactNode;
  value?: typeof mockAuthContextValue;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  value = mockAuthContextValue 
}) => {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

export default {
  ...AuthContext,
  Provider: AuthProvider,
};
