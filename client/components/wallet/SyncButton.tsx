import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useWalletSync } from "@/hooks/useWalletSync";

interface SyncButtonProps {
  walletId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SyncButton({
  walletId,
  className = "",
  variant = "outline",
  size = "default",
}: SyncButtonProps) {
  const { syncWalletBalances } = useWalletSync();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async () => {
    if (!walletId) return;
    
    try {
      setIsSyncing(true);
      await syncWalletBalances(walletId);
      // The hook will handle the toast notifications
    } catch (error) {
      console.error('Error in sync button:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
      className={`flex items-center gap-2 ${className}`}
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {size !== 'icon' && (isSyncing ? 'Syncing...' : 'Sync')}
    </Button>
  );
}
