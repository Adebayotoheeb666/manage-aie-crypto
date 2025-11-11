import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/use-toast';

export const useWalletSync = () => {
  const { authUser, dbUser } = useAuth();
  const { toast } = useToast();

  const syncWalletBalances = useCallback(async (walletId: string) => {
    if (!authUser || !dbUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to sync wallet balances',
        variant: 'destructive',
      });
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch('/api/wallet/sync-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId }),
        credentials: 'include',
      });

      // Read body as text once to avoid 'body stream already read' errors
      const text = await response.text();
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (err) {
        console.warn('Failed to parse response JSON:', err);
        result = { message: text };
      }

      if (!response.ok) {
        const errMsg = result?.error || result?.message || 'Failed to sync balances';
        throw new Error(errMsg);
      }

      toast({
        title: 'Success',
        description: 'Wallet balances synced successfully',
      });

      return result;
    } catch (error) {
      console.error('Error syncing wallet balances:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync wallet balances',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }, [authUser, dbUser, toast]);

  return { syncWalletBalances };
};
