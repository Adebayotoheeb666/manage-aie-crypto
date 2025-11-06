import { vi } from 'vitest';

// Mock database types
type MockDBResponse = {
  data: any;
  error: any;
};

// Mock user data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
};

// Mock database response
export const supabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ 
      data: { 
        subscription: { 
          unsubscribe: vi.fn() 
        } 
      } 
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: mockUser, session: {} },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: mockUser, session: {} },
      error: null,
    }),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// Mock functions
export const createClient = vi.fn().mockImplementation(() => supabase);

export const createWallet = vi.fn().mockResolvedValue({ 
  data: { wallet_address: '0x1234...' }, 
  error: null 
});

export const getUserAssets = vi.fn().mockResolvedValue({
  data: [
    { id: 1, asset: 'BTC', balance: '1.5' },
    { id: 2, asset: 'ETH', balance: '10' },
  ],
  error: null,
});

// Default export
export default {
  supabase,
  createClient,
  createWallet,
  getUserAssets,
};
