import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../index';
import { 
  testConfig, 
  setupTestUser, 
  cleanupTestUser,
  TestUser,
  supabase
} from './utils/test-utils';
import { signMessage } from './utils/wallet-utils';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com', user_metadata: {} },
          session: { access_token: 'test-access-token' }
        },
        error: null
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com', user_metadata: {} },
          session: { access_token: 'test-access-token' }
        },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-access-token' } },
        error: null
      }),
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        }),
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null })
      }
    },
    rpc: vi.fn().mockResolvedValue({ data: {}, error: null })
  }))
}));

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

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation((field, value) => ({
      field,
      value,
      operator: 'eq',
    })),
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  })),
}));

describe('Wallet Endpoints', () => {
  beforeAll(async () => {
    // Set up mock responses for the test user
    const mockUser = {
      id: 'test-user-id',
      email: testConfig.email,
      user_metadata: {
        name: 'Test User',
        username: `testuser_${Date.now()}`,
        walletAddress: testConfig.walletAddress
      }
    };

    // Set up mock implementations
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database responses
    supabase.from.mockImplementation((table: string) => {
      if (table === 'wallets') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
          insert: vi.fn().mockResolvedValue({
            data: [{
              id: 'new-wallet-id',
              user_id: 'test-user-id',
              wallet_address: testConfig.walletAddress,
              is_primary: true,
            }],
            error: null,
          })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      };
    });

    // Set up the test user
    try {
      await setupTestUser();
      testUser = {
        id: 'test-user-id',
        email: testConfig.email,
        user_metadata: {
          name: 'Test User',
          username: `testuser_${Date.now()}`,
        },
      };
      global.authToken = 'test-access-token';
      testConfig.userId = testUser.id;
    } catch (error) {
      console.error('Failed to set up test user:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestUser();
  });

  it('should get user wallets', async () => {
    if (!testUser?.id) {
      throw new Error('Test user not found');
    }

    // Get user wallets
    const res = await authedRequest('post', '/api/proxy/user-wallets', {
      userId: testUser.id,
      primaryOnly: false
    });

    // Log the response for debugging
    console.log('User Wallets Response:', {
      status: res.status,
      body: res.body,
    });

    // Check if response is an array or has a data property that's an array
    const responseData = Array.isArray(res.body) ? res.body : res.body?.data;
    
    expect(res.status).toBe(200);
    expect(Array.isArray(responseData) || responseData === undefined).toBe(true);
  });

  it('should sign a message with the test wallet', async () => {
    const message = 'Test message to sign';
    const signature = await signMessage(message, testConfig.privateKey);
    
    // Basic validation of the signature
    expect(signature).toBeDefined();
    expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);
    
    console.log('Message signed successfully:', { message, signature });
  });

  it('should handle wallet connection', async () => {
    if (!testUser?.id) {
      throw new Error('Test user not found');
    }

    console.log('\n=== Starting wallet connection test ===');
    
    // First, sign in to get a fresh session
    console.log('\n1. Signing in test user...');
    const loginRes = await request(app)
      .post('/api/auth/signin')
      .send({
        email: testConfig.email,
        password: testConfig.password
      });
    
    console.log('\n2. Login response:', {
      status: loginRes.status,
      body: loginRes.body ? {
        ...loginRes.body,
        session: loginRes.body.session ? {
          ...loginRes.body.session,
          access_token: loginRes.body.session.access_token ? '***' : undefined,
          refresh_token: loginRes.body.session.refresh_token ? '***' : undefined
        } : undefined
      } : 'No body',
      cookies: loginRes.headers['set-cookie']
    });
    
    if (loginRes.status !== 200 || !loginRes.body.session?.access_token) {
      console.error('\n❌ Failed to authenticate test user:', loginRes.body);
      throw new Error('Failed to authenticate test user');
    }
    
    const authToken = loginRes.body.session.access_token;
    
    // Get the access token and refresh token cookies
    const cookies = Array.isArray(loginRes.headers['set-cookie']) 
      ? loginRes.headers['set-cookie'] 
      : [];
      
    // Find the access token cookie (sb-access-token)
    const accessTokenCookie = cookies.find((c: string) => c.includes('sb-access-token='));
    const refreshTokenCookie = cookies.find((c: string) => c.includes('sb-refresh-token='));
    
    console.log('\n3. Extracted auth data:', {
      authToken: authToken ? '***' : 'No token',
      accessTokenCookie: accessTokenCookie ? accessTokenCookie.split(';')[0] : 'No access token cookie',
      refreshTokenCookie: refreshTokenCookie ? '***' : 'No refresh token cookie',
      allCookies: cookies.map(c => c.split(';')[0] + ';') // Just show the first part of each cookie
    });
    
    // Prepare cookies for the request
    const requestCookies = [];
    if (accessTokenCookie) requestCookies.push(accessTokenCookie.split(';')[0]);
    if (refreshTokenCookie) requestCookies.push(refreshTokenCookie.split(';')[0]);

    // Create a test message to sign
    const message = `Connect wallet to account ${testUser.id} at ${Date.now()}`;
    
    // Sign the message with the test wallet
    console.log('\n4. Signing message with test wallet...');
    const signature = await signMessage(message, testConfig.privateKey);
    console.log('Signed message:', { 
      message,
      signature: signature ? '***' : 'No signature',
      walletAddress: testConfig.walletAddress
    });

    // Prepare the wallet connection request
    const walletData = {
      address: testConfig.walletAddress,
      chainId: 1, // Mainnet
      isConnected: true,
      message: message,
      signature: signature
    };

    console.log('\n5. Sending wallet connection request...');
    console.log('Request payload:', { walletData: { ...walletData, signature: '***' } });

    // Prepare the request with proper headers and cookies
    const req = request(app)
      .post('/api/wallet/connect')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
    
    // Add authorization header with the access token
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    // Add cookies if available
    if (requestCookies.length > 0) {
      req.set('Cookie', requestCookies);
    }
    
    // Log request details before sending
    console.log('\n6. Request details:', {
      method: 'POST',
      url: '/api/wallet/connect',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authToken ? 'Bearer ***' : 'No auth header',
        'Cookie': requestCookies.length > 0 ? 'sb-access-token=***' : 'No cookies'
      },
      body: { walletData: { ...walletData, signature: '***' } }
    });
    
    // Prepare the request body
    const requestBody = { walletData };
    
    // Log the final request headers for debugging
    console.log('\n7. Final request headers:', {
      'Content-Type': 'application/json',
      'Authorization': authToken ? 'Bearer ***' : 'Not set',
      'Cookie': requestCookies.length > 0 ? 'Set' : 'Not set'
    });

    // Send the request
    const res = await req.send(requestBody);

    // Log the response
    console.log('\n8. Wallet Connect Response:', {
      status: res.status,
      statusType: res.statusType,
      body: res.body,
      headers: {
        'content-type': res.headers['content-type'],
        'set-cookie': res.headers['set-cookie'] ? '***' : 'No cookies set',
        'www-authenticate': res.headers['www-authenticate'] || 'No www-authenticate header'
      }
    });

    // If we get a 401, log more details
    if (res.status === 401) {
      console.error('\n❌ Authentication failed. Details:', {
        status: res.status,
        statusType: res.statusType,
        body: res.body,
        request: {
          method: 'POST',
          url: '/api/wallet/connect',
          headers: {
            'Content-Type': req.get('content-type'),
            'Authorization': req.get('authorization') ? 'Bearer ***' : 'No auth header',
            'Cookie': req.get('cookie') ? 'sb-access-token=***' : 'No cookie',
            'Accept': req.get('accept') || 'No accept header'
          },
          body: { walletData: { ...walletData, signature: '***' } }
        },
        authToken: authToken ? '***' : 'No auth token',
        allResponseHeaders: Object.keys(res.headers).reduce((acc, key) => {
          acc[key] = key.toLowerCase().includes('set-cookie') ? '***' : res.headers[key];
          return acc;
        }, {} as Record<string, any>)
      });
      
      // Log the raw response for debugging
      console.error('Raw response text:', res.text);
      
      // If there's a www-authenticate header, log it
      if (res.headers['www-authenticate']) {
        console.error('WWW-Authenticate header:', res.headers['www-authenticate']);
      }
    }

    // Check the response
    console.log('\n9. Asserting response...');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('wallet');
    expect(res.body.wallet).toHaveProperty('address', testConfig.walletAddress.toLowerCase());
    
    // Verify the wallet was saved to the database
    console.log('\n10. Verifying wallet in database...');
    const { data: savedWallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('address', testConfig.walletAddress.toLowerCase())
      .single();

    console.log('Database wallet check:', { 
      hasWallet: !!savedWallet, 
      error: error ? error.message : 'No error',
      wallet: savedWallet ? { 
        id: savedWallet.id, 
        address: savedWallet.address,
        user_id: savedWallet.user_id,
        is_active: savedWallet.is_active
      } : 'No wallet found'
    });
    
    expect(error).toBeNull();
    expect(savedWallet).toBeDefined();
    expect(savedWallet?.is_active).toBe(true);
    
    console.log('\n✅ Wallet connection test completed successfully');
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
