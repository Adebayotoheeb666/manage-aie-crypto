import dotenv from 'dotenv';
import { vi } from 'vitest';
import { generateTestWallet } from './wallet-utils';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Ensure JWT secret is set for tests
if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters';
}

// Set NODE_ENV to test if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Generate a test wallet for testing
const testWallet = generateTestWallet();

// Test user credentials
export const TEST_EMAIL = `testuser_${Date.now()}@test.com`;
export const TEST_PASSWORD = 'Test@1234';
export const WALLET_ADDRESS = testWallet.address;
export const TEST_MNEMONIC = testWallet.mnemonic;
export const TEST_PRIVATE_KEY = testWallet.privateKey;

// Test user interface
export interface TestUser {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    username: string;
  };
}

// Global test state
export let testUser: TestUser | null = null;

// Test configuration
export interface TestConfig {
  email: string;
  password: string;
  walletAddress: string;
  mnemonic: string;
  privateKey: string;
  userId?: string; // Will be set after user creation
}

export const testConfig: TestConfig = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  walletAddress: WALLET_ADDRESS,
  mnemonic: TEST_MNEMONIC,
  privateKey: TEST_PRIVATE_KEY,
  userId: 'test-user-id'
};

// Mock Supabase client
export const supabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValue({ data: [], error: null }),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  auth: {
    signUp: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: TEST_EMAIL,
          user_metadata: {
            name: 'Test User',
            username: 'testuser'
          }
        },
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token'
        }
      },
      error: null
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: TEST_EMAIL,
          user_metadata: {
            name: 'Test User',
            username: 'testuser'
          }
        },
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token'
        }
      },
      error: null
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          user: {
            id: 'test-user-id',
            email: TEST_EMAIL,
            user_metadata: {
              name: 'Test User',
              username: 'testuser'
            }
          }
        }
      },
      error: null
    }),
    admin: {
      createUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: TEST_EMAIL,
            user_metadata: {
              name: 'Test User',
              username: 'testuser'
            }
          }
        },
        error: null
      }),
      deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null })
    }
  },
  rpc: vi.fn().mockResolvedValue({ data: {}, error: null })
};

// Global type declarations
declare global {
  // eslint-disable-next-line no-var
  var authToken: string;
}

// Test setup utilities
export async function setupTestUser() {
  try {
    // Mock the users table check
    supabase.from('users').select = vi.fn().mockResolvedValue({ data: [], error: null });
    
    // Mock the RPC call to create users table
    supabase.rpc = vi.fn().mockResolvedValue({ data: {}, error: null });
    
    // Clean up any existing test user
    await supabase.auth.admin.deleteUser(TEST_EMAIL);
    testUser = {
      id: 'test-user-id',
      email: TEST_EMAIL,
      user_metadata: {
        name: 'Test User',
        username: 'testuser'
      }
    };
    global.authToken = 'test-access-token';
  } catch (error) {
    console.error('Error in setupTestUser:', error);
    throw error;
  }
}

export async function cleanupTestUser() {
  if (testUser?.id) {
    try {
      await supabase.auth.admin.deleteUser(testUser.id);
    } catch (error) {
      // Ignore errors during cleanup
      console.warn('Error during test user cleanup:', error);
    }
    testUser = null;
    delete global.authToken;
  }
}
