import { http, HttpResponse } from 'msw';
import { mockSupabase } from '../../setupTests';

export const handlers = [
  // Mock API endpoints for wallet operations
  http.get('/api/wallet/balance', ({ request }) => {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    
    if (!address) {
      return HttpResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      address,
      balance: '1.5',
      tokens: [
        { symbol: 'ETH', balance: '1.5', usdValue: '3000' },
        { symbol: 'USDC', balance: '1000', usdValue: '1000' },
      ],
    });
  }),

  // Mock Supabase auth state change
  http.post('/api/auth/state', () => {
    return HttpResponse.json({
      event: 'SIGNED_IN',
      session: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
    });
  }),

  // Mock wallet connection
  http.post('/api/wallet/connect', () => {
    return HttpResponse.json({
      success: true,
      address: '0x1234...',
      chainId: 1,
    });
  }),

  // Mock wallet disconnection
  http.post('/api/wallet/disconnect', () => {
    return HttpResponse.json({ success: true });
  }),

  // Mock Supabase RPC calls
  http.post('/rest/v1/rpc/*', async () => {
    const result = await mockSupabase.rpc();
    return HttpResponse.json(result.data || {});
  }),
];
