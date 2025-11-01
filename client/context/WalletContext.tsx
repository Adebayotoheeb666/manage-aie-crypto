import { createContext, useContext } from "react";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { ethers } from "ethers";

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
  walletId: string | null | undefined;
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
  const walletState = useWalletConnect();

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
