import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../index';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Enable debug logging for tests
process.env.DEBUG = 'true';

// Initialize test server
const app = createServer();

// Test user credentials
const TEST_EMAIL = `testuser_${Date.now()}@test.com`;
const TEST_PASSWORD = 'Test@1234';

// Supabase client for test setup/teardown
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper function to make authenticated requests
const authedRequest = (method: string, url: string, data: any = null) => {
  // Create the base request
  let req = request(app)[method.toLowerCase()](url);
  
  // Set auth headers if token exists
  if (global.authToken) {
    // Use the token directly as a Bearer token
    req = req
      .set('Authorization', `Bearer ${global.authToken}`)
      .set('Accept', 'application/json');
  }
  
  // Add content-type for non-GET requests
  if (method.toLowerCase() !== 'get') {
    req = req.set('Content-Type', 'application/json');
  }
  
  // Add request body if provided
  if (data) {
    req = req.send(data);
  }
  
  return req;
};

describe('Authentication', () => {
  // Store auth token globally so it can be used across test files if needed
  beforeAll(() => {
    global.authToken = '';
  });
  
  afterAll(() => {
    delete global.authToken;
  });
  
  let testUserId: string;

  beforeAll(async () => {
    // Clean up any existing test users
    await supabase.auth.admin.deleteUser(TEST_EMAIL).catch(() => {});
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should sign up a new user', async () => {
    try {
      const userData = {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };
      
      console.log('Signup Request:', userData);
      const res = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      console.log('Signup Response:', {
        status: res.status,
        body: res.body,
        headers: res.headers
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      testUserId = res.body.user.id;
    } catch (error) {
      console.error('Signup Error:', error.response?.body || error.message);
      throw error;
    }
  });

  it('should sign in the user', async () => {
    try {
      const loginData = {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };
      
      console.log('Signin Request:', loginData);
      const res = await request(app)
        .post('/api/auth/signin')
        .send(loginData);

      console.log('Signin Response:', {
        status: res.status,
        body: res.body,
        headers: res.headers
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('session');
      
      // Store the access token for authenticated requests
      if (res.body.session?.access_token) {
        global.authToken = res.body.session.access_token;
      }
    } catch (error) {
      console.error('Signin Error:', error.response?.body || error.message);
      throw error;
    }
  });

  it('should get current session', async () => {
    try {
      // First sign in to get a valid session
      const signInRes = await request(app)
        .post('/api/auth/signin')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        });
      
      console.log('Sign In Response:', {
        status: signInRes.status,
        body: signInRes.body,
        headers: signInRes.headers
      });

      expect(signInRes.status).toBe(200);
      expect(signInRes.body).toHaveProperty('session');
      expect(signInRes.body.session).toHaveProperty('access_token');

      global.authToken = signInRes.body.session.access_token;
      
      // Get session with the token using the authedRequest helper
      const res = await authedRequest('get', '/api/auth/session');
      
      console.log('Session Response:', {
        status: res.status,
        body: res.body,
        headers: res.headers
      });

      expect(res.status).toBe(200);
      
      // The response should have either a user object or an error if not authenticated
      if (res.body.error) {
        console.error('Session error:', res.body.error);
        // If there's an error, it should be a 401, not 200
        expect(res.status).not.toBe(200);
        return;
      }
      
      expect(res.body).toHaveProperty('user');
    } catch (error) {
      console.error('Session Test Error:', error);
      throw error;
    }
  });
});
