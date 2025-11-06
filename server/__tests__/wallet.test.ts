import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../index';
import { 
  testConfig, 
  setupTestUser, 
  cleanupTestUser,
  supabase,
  TestUser
} from './utils/test-utils';

// Global test user reference
let testUser: TestUser | null = null;

const app = createServer();

// Helper function for authenticated requests
const authedRequest = async (method: string, url: string, data: any = null) => {
  let req = request(app)[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](url);
  
  if (global.authToken) {
    req = req.set('Authorization', `Bearer ${global.authToken}`);
  }
  
  if (data) {
    req = req.set('Content-Type', 'application/json').send(data);
  }
  
  return req;
};

describe('Wallet Endpoints', () => {
  beforeAll(async () => {
    // Clean up any existing test user
    await setupTestUser();
    
    // Sign up a new test user
    const signUpRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: testConfig.email,
        password: testConfig.password,
        user_metadata: { 
          name: 'Test User',
          username: `testuser_${Date.now()}`
        },
        email_confirm: true
      });
    
    if (signUpRes.status === 200 && signUpRes.body.user) {
      // Store the test user and auth token
      testUser = signUpRes.body.user;
      global.authToken = signUpRes.body.session?.access_token || '';
      
      // Store the user ID in the test config for reference
      testConfig.userId = testUser.id;
    } else {
      console.error('Failed to create test user:', signUpRes.body);
      throw new Error('Failed to create test user');
    }
  });

  afterAll(async () => {
    await cleanupTestUser();
  });

  it('should get user wallets', async () => {
    try {
      if (!testUser?.id) {
        throw new Error('Test user not found');
      }

      const res = await authedRequest('post', '/api/proxy/user-wallets', {
        userId: testUser.id,
        primaryOnly: false
      });

      console.log('User Wallets Response:', {
        status: res.status,
        body: res.body,
      });

      // Check if response is an array or has a data property that's an array
      const responseData = Array.isArray(res.body) ? res.body : res.body?.data;
      
      expect(res.status).toBe(200);
      expect(Array.isArray(responseData) || responseData === undefined).toBe(true);
    } catch (error) {
      console.error('User Wallets Error:', error);
      throw error;
    }
  });

  it('should get portfolio snapshots', async () => {
    try {
      if (!testUser?.id) {
        throw new Error('Test user not found');
      }

      const res = await authedRequest('post', '/api/proxy/portfolio-snapshots', {
        userId: testUser.id,
        days: 7
      });

      console.log('Portfolio Snapshots Response:', {
        status: res.status,
        body: res.body,
      });

      // Check if response is an array or has a data property that's an array
      const responseData = Array.isArray(res.body) ? res.body : res.body?.data;
      
      expect(res.status).toBe(200);
      expect(Array.isArray(responseData) || responseData === undefined).toBe(true);
    } catch (error) {
      console.error('Portfolio Snapshots Error:', error);
      throw error;
    }
  });
});
