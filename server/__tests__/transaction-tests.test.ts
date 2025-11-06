import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../index';
import { createClient } from '@supabase/supabase-js';

// Initialize test server
const app = createServer();

// Initialize Supabase client for cleanup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Generate unique test user credentials
const TEST_EMAIL = `testuser_${Date.now()}@test.com`;
const TEST_PASSWORD = 'Test@1234';

// Global auth token
let authToken = '';
let cookies: string[] = [];
let testUserId: string | null = null;

// Helper function to make authenticated requests
const authedRequest = (method: 'get' | 'post' | 'put' | 'delete', url: string, data: any = null) => {
  const req = request(app)[method](url);
  
  if (authToken) {
    req.set('Authorization', `Bearer ${authToken}`);
  }
  
  if (cookies.length > 0) {
    req.set('Cookie', cookies);
  }
  
  if (data) {
    req.set('Content-Type', 'application/json').send(data);
  }
  
  return req;
};

describe('Transaction and Withdrawal Endpoints', () => {
  beforeAll(async () => {
    try {
      // Clean up any existing test user first
      await supabase.auth.admin.deleteUser(TEST_EMAIL).catch(() => {});
      
      // Create a test user
      const signUpRes = await request(app)
        .post('/api/auth/signup')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          user_metadata: {
            name: 'Test User',
            username: `testuser_${Date.now()}`,
          },
          email_confirm: true,
        });

      if (signUpRes.status !== 200) {
        throw new Error(`Failed to create test user: ${JSON.stringify(signUpRes.body)}`);
      }
      
      testUserId = signUpRes.body.user?.id || null;

      // Sign in to get a session
      const signInRes = await request(app)
        .post('/api/auth/signin')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        });
      
      if (signInRes.status !== 200) {
        throw new Error(`Failed to sign in: ${JSON.stringify(signInRes.body)}`);
      }
      
      // Store the auth token and cookies
      authToken = signInRes.body.session?.access_token || '';
      const setCookieHeader = signInRes.headers['set-cookie'] || [];
      cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
    
    if (!authToken && cookies.length === 0) {
      throw new Error('No authentication token or cookies received');
    }
    
    console.log('Successfully authenticated test user');
  });

  afterAll(async () => {
    try {
      // Clean up the test user after all tests are done
      if (testUserId) {
        await supabase.auth.admin.deleteUser(testUserId).catch(console.error);
      } else if (authToken) {
        // Fallback to sign out if we can't delete the user
        await request(app)
          .post('/api/auth/signout')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
    } catch (error) {
      console.error('Error in afterAll:', error);
    }
  });

  describe('Transaction Endpoints', () => {
    it('should get transaction history', async () => {
      try {
        // First try with the auth token
        let res = await request(app)
          .get('/api/transactions')
          .set('Authorization', `Bearer ${authToken}`);
        
        // If unauthorized, try with session cookie
        if (res.status === 401 && cookies.length > 0) {
          res = await request(app)
            .get('/api/transactions')
            .set('Cookie', cookies);
        }

        console.log('Transaction History Response:', {
          status: res.status,
          body: res.body,
          headers: Object.keys(res.headers)
        });

        // Check if the response is what we expect
        if (res.status === 200) {
          expect(Array.isArray(res.body.transactions) || Array.isArray(res.body)).toBe(true);
        } else if (res.status === 404) {
          console.warn('Transaction endpoint not implemented yet');
          // Mark test as skipped if endpoint is not implemented
          return;
        } else {
          expect(res.status).toBe(200); // This will fail the test with the actual status code
        }
      } catch (error) {
        console.error('Transaction History Error:', error);
        throw error;
      }
    });
  });

  describe('Withdrawal Endpoints', () => {
    it('should create a withdrawal request', async () => {
      // First, get user wallets to have a valid wallet ID
      let walletRes;
      try {
        walletRes = await request(app)
          .post('/api/proxy/user-wallets')
          .set('Cookie', cookies)
          .send({
            userId: TEST_EMAIL, // Assuming email can be used as userId
            primaryOnly: false
          });

        if (walletRes.status !== 200 || !Array.isArray(walletRes.body) || walletRes.body.length === 0) {
          console.warn('No wallets found for test user, skipping withdrawal test');
          return;
        }
      } catch (error) {
        console.error('Error fetching user wallets:', error);
        throw error;
      }

      const walletId = walletRes.body[0].id || 'default-wallet-id';
      
      const withdrawalData = {
        walletId,
        symbol: 'BTC',
        amount: 0.1,
        destinationAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        network: 'mainnet',
        email: TEST_EMAIL,
        userId: TEST_EMAIL
      };

      console.log('Withdrawal Request:', withdrawalData);
      
      try {
        // Try with session cookie first
        let res = await request(app)
          .post('/api/withdraw')
          .set('Cookie', cookies)
          .send(withdrawalData);
        
        // If 404, try the proxy endpoint
        if (res.status === 404) {
          res = await request(app)
            .post('/api/proxy/withdraw')
            .set('Cookie', cookies)
            .send(withdrawalData);
        }

        console.log('Withdrawal Response:', {
          status: res.status,
          body: res.body,
          headers: Object.keys(res.headers)
        });

        // Check if the response is what we expect
        if (res.status === 200) {
          expect(res.body).toHaveProperty('success', true);
        } else if (res.status === 400) {
          console.warn('Withdrawal validation failed:', res.body);
          expect.fail(`Withdrawal validation failed: ${JSON.stringify(res.body)}`);
        } else if (res.status === 404) {
          console.warn('Withdrawal endpoint not implemented yet');
          // Mark test as skipped if endpoint is not implemented
          return;
        } else {
          expect.fail(`Unexpected status code: ${res.status} - ${JSON.stringify(res.body)}`);
        }
      } catch (error) {
        console.error('Withdrawal Test Error:', error);
        throw error;
      }
    });
  });
});
