import { useCallback, useEffect, useState } from "react";
import type { BrowserProvider } from "ethers";
import { useAuth } from "@/context/AuthContext";

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: BrowserProvider | null;
  walletId?: string | null;
}

interface UseWalletConnectReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  getBalance: () => Promise<string | null>;
  verifyAndSaveWallet: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useWalletConnect(): UseWalletConnectReturn {
  const { authUser } = useAuth();
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    provider: null,
    walletId: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Seed phrase only: no extension wallet auto-connect
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      setError("Browser wallets are disabled. Use seed phrase import.");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      provider: null,
      walletId: null,
    });
    setError(null);
  }, []);

  const signMessage = useCallback(
    async (_message: string): Promise<string | null> => {
      setError("Signing via browser wallet is disabled.");
      return null;
    },
    [],
  );

  const getBalance = useCallback(async (): Promise<string | null> => {
    setError("Wallet not connected");
    return null;
  }, []);

  const verifyAndSaveWallet = useCallback(async (): Promise<boolean> => {
    if (!authUser) {
      setError("User not authenticated");
      return false;
    }
    setError("Browser wallet verification is disabled.");
    return false;
  }, [authUser]);

  return {
    ...wallet,
    connect,
    disconnect,
    signMessage,
    getBalance,
    verifyAndSaveWallet,
    loading,
    error,
  };
}
