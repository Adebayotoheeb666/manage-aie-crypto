import { expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { server } from '../../src/mocks/server';
import '@testing-library/jest-dom/vitest';

// Extend Vitest's expect with jest-dom matchers
Object.entries(matchers).forEach(([key, matcher]) => {
  expect.extend({ [key]: matcher });
});

// Mock window.ethereum
const ethereum: Window['ethereum'] = {
  isMetaMask: true,
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

global.ethereum = ethereum as any;

// Mock web3modal
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

// Mock @shared/lib/supabase
vi.mock('@shared/lib/supabase', () => ({
  createWallet: vi.fn().mockResolvedValue({ data: null, error: null }),
  supabase: {
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
  },
}));

// Setup MSW server
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  global.ethereum = ethereum as any;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  server.resetHandlers();
  
  // Clear all mocks
  Object.values(ethereum).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });
});

// Cleanup after all tests
afterAll(() => {
  server.close();
});
