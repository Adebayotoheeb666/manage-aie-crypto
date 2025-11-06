import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { vi } from 'vitest';
import { AuthContext, mockAuthContextValue, mockAuthUser, mockDbUser } from '@/context/__mocks__/AuthContext';
import type { User as DBUser } from '@shared/types/database';

// Extend the mock auth user with additional properties
const extendedMockAuthUser = {
  ...mockAuthUser,
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  user_metadata: {
    ...mockAuthUser.user_metadata,
    avatar_url: '',
    email_verified: true,
  },
};

// Extend the mock DB user with any missing properties
const extendedMockDbUser: DBUser = {
  ...mockDbUser,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Create a test query client with default options
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

// Mock auth context values
const mockAuthContext = {
  ...mockAuthContextValue,
  authUser: extendedMockAuthUser,
  dbUser: extendedMockDbUser,
  loading: false,
  error: null,
  signIn: vi.fn().mockResolvedValue(undefined),
  signUp: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  connectWallet: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: true,
  refreshUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn().mockResolvedValue(undefined),
};

// A component that provides the auth context for tests
const TestAuthProvider = ({ 
  children, 
  value = {} 
}: { 
  children: ReactNode; 
  value?: Partial<typeof mockAuthContext>;
}) => {
  const contextValue = {
    ...mockAuthContext,
    ...value,
  } as const;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Main test wrapper component
export const TestWrapper = ({ 
  children, 
  authValue = {}
}: { 
  children: ReactNode; 
  authValue?: Partial<typeof mockAuthContext>;
}) => {
  const queryClient = createTestQueryClient();

  return (
    <TestAuthProvider value={authValue}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </TestAuthProvider>
  );
};
