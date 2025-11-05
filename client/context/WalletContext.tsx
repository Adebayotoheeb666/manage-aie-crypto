import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: BrowserProvider | null;
  walletId?: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  getBalance: () => Promise<string | null>;
  verifyAndSaveWallet: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(() => {
    try {
      return localStorage.getItem("walletAddress");
    } catch {
      return null;
    }
  });
  const [chainId, setChainId] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem("chainId");
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  });
  const [walletId, setWalletId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("walletId");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onStorage = () => {
      try {
        setAddress(localStorage.getItem("walletAddress"));
        setWalletId(localStorage.getItem("walletId"));
        const v = localStorage.getItem("chainId");
        setChainId(v ? Number(v) : null);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const connect = async () => {
    // Redirect user to seed phrase connect page
    try {
      window.location.href = "/connect-wallet";
    } catch (err) {
      setError("Unable to open connect page");
    }
  };

  const disconnect = async () => {
    try {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletId");
      localStorage.removeItem("chainId");
    } catch (err) {
      console.warn("Failed to clear wallet storage:", err);
    }
    setAddress(null);
    setWalletId(null);
    setChainId(null);
  };

  const signMessage = async (_message: string): Promise<string | null> => {
    setError("Signing is not supported in seed-phrase-only flow");
    return null;
  };

  const getBalance = async (): Promise<string | null> => {
    // Balance fetching requires an on-chain provider and an address.
    // This project currently uses server-side flows for balances; return null here.
    return null;
  };

  const verifyAndSaveWallet = async (): Promise<boolean> => {
    setError("Verification not supported in this flow");
    return false;
  };

  const value: WalletContextType = {
    address,
    chainId,
    isConnected: !!address,
    provider: null,
    walletId,
    connect,
    disconnect,
    signMessage,
    getBalance,
    verifyAndSaveWallet,
    loading,
    error,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
