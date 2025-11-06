import { Button } from '../button';
import { useWalletSync } from '@/hooks/useWalletSync';
import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function WalletButton() {
  const { syncWalletBalances } = useWalletSync();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncWalletBalances('test-wallet-id');
    } catch (error) {
      console.error('Failed to sync wallet:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSync}
      disabled={isSyncing}
      className="gap-2"
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Sync Balances
        </>
      )}
    </Button>
  );
}
