import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWalletSync } from '../useWalletSync';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestWrapper } from '@/test/TestWrapper';
import { useAuth } from '@/context/AuthContext';

// Import the mock auth context
const mockAuthContextValue = {
  authUser: { 
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' }
  },
  dbUser: { 
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
  },
  loading: false,
  error: null,
  signIn: vi.fn().mockResolvedValue(undefined),
  signUp: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  connectWallet: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: true,
};

// Mock the useAuth hook
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthContextValue,
}));

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock the useToast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));


describe('useWalletSync', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    wrapper = ({ children }) => (
      <TestWrapper>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </TestWrapper>
    );

    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with a syncWalletBalances function', () => {
    const { result } = renderHook(() => useWalletSync(), { wrapper });

    expect(result.current).toHaveProperty('syncWalletBalances');
    expect(typeof result.current.syncWalletBalances).toBe('function');
  });

  it('should call syncWalletBalances with correct parameters', async () => {
    const { result } = renderHook(() => useWalletSync(), { wrapper });
    
    // Mock a successful sync response
    const mockResponse = { success: true };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    global.fetch = mockFetch;

    await act(async () => {
      const response = await result.current.syncWalletBalances('test-wallet-id');
      expect(response).toEqual(mockResponse);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/wallet/sync-balances',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: 'test-wallet-id' }),
      })
    );
  });

  it('should handle sync error', async () => {
    const { result } = renderHook(() => useWalletSync(), { wrapper });
    
    // Mock a failed fetch
    const errorMessage = 'Network error';
    global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      const response = await result.current.syncWalletBalances('test-wallet-id');
      expect(response).toEqual({ success: false, error: errorMessage });
    });

    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  });

  it('should handle API error response', async () => {
    const { result } = renderHook(() => useWalletSync(), { wrapper });
    
    // Mock a failed API response
    const errorMessage = 'Invalid wallet ID';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: errorMessage }),
    });

    await act(async () => {
      const response = await result.current.syncWalletBalances('invalid-wallet');
      expect(response).toEqual({ success: false, error: errorMessage });
    });

    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  });

  it('should handle unauthenticated user', async () => {
    // Mock the fetch function to simulate an unauthenticated response
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: 'Not authenticated',
      }),
    });
    global.fetch = mockFetch;
    
    const { result } = renderHook(() => useWalletSync(), { wrapper });

    await act(async () => {
      const response = await result.current.syncWalletBalances('test-wallet-id');
      expect(response).toEqual({
        success: false,
        error: 'Not authenticated',
      });
    });

    // Check that error toast was shown with the correct error message
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Not authenticated',
      variant: 'destructive',
    });
  });
});
