// Setup file for tests
import { expect, afterEach, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './src/mocks/server';

declare global {
  interface Window {
    ethereum: {
      isMetaMask?: boolean;
      request?: (request: { method: string; params?: Array<any> }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
      [key: string]: any;
    };
  }
}

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Define the ethereum mock with proper typing
const ethereum: Window['ethereum'] = {
  isMetaMask: true,
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

global.ethereum = ethereum as any;

// Mock Web3Modal
vi.mock('web3modal', () => ({
  default: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue({
      getAccounts: vi.fn().mockResolvedValue(['0x1234...']),
      getChainId: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
      removeListener: vi.fn(),
    }),
    on: vi.fn(),
    clearCachedProvider: vi.fn(),
  })),
}));

// Mock @/lib/supabase
export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Run cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
beforeEach(() => {
  // Reset all mocks
  vi.resetAllMocks();
  
  // Reset the server handlers
  server.resetHandlers();
  
  // Reset the ethereum mock
  Object.values(ethereum).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});
