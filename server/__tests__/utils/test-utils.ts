import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test user credentials
export const TEST_EMAIL = `testuser_${Date.now()}@test.com`;
export const TEST_PASSWORD = 'Test@1234';
export const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

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
export const testConfig = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  walletAddress: WALLET_ADDRESS
};

// Initialize Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Global type declarations
declare global {
  // eslint-disable-next-line no-var
  var authToken: string;
}

// Test setup utilities
export async function setupTestUser() {
  // Clean up any existing test user
  await supabase.auth.admin.deleteUser(TEST_EMAIL).catch(() => {});
  testUser = null;
  global.authToken = '';
}

export async function cleanupTestUser() {
  if (testUser?.id) {
    await supabase.auth.admin.deleteUser(testUser.id).catch(() => {});
    testUser = null;
    delete global.authToken;
  }
}
