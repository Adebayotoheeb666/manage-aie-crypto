import { useState, useCallback, useEffect } from "react";
import {
  BrowserProvider,
  formatEther,
  verifyMessage,
  JsonRpcSigner,
} from "ethers";
import Web3Modal from "web3modal";
import { supabase } from "@shared/lib/supabase";
import { createWallet } from "@shared/lib/supabase";
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

let web3Modal: Web3Modal | null = null;

function initializeWeb3Modal(): Web3Modal {
  if (web3Modal) {
    return web3Modal;
  }

  const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "VITE_WALLET_CONNECT_PROJECT_ID not configured. Please set up WalletConnect Project ID.",
    );
  }

  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {
      "custom-metamask": {
        display: {
          logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
          name: "MetaMask",
          description: "Connect to your MetaMask wallet",
        },
        package: BrowserProvider,
        connector: async () => {
          if (!window.ethereum) {
            throw new Error(
              "MetaMask not installed. Please install MetaMask extension.",
            );
          }
          return window.ethereum;
        },
      },
    },
  });

  return web3Modal;
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

  // Check if wallet was previously connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const modal = initializeWeb3Modal();
        if (modal.cachedProvider) {
          await connectWallet();
        }
      } catch (err) {
        console.log("No cached wallet connection");
      }
    };

    checkConnection();
  }, []);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const modal = initializeWeb3Modal();
      const instance = await modal.connect();

      if (!instance) {
        throw new Error("Failed to connect to wallet");
      }

      const provider = new BrowserProvider(instance);

      // Request accounts from the provider to get the wallet address
      const accounts = (await instance.request({
        method: "eth_accounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet accounts found");
      }

      const address = accounts[0];

      // Get network info
      const network = await provider.getNetwork();

      setWallet({
        address,
        chainId: Number(network.chainId),
        isConnected: true,
        provider,
      });

      // Store wallet info in localStorage
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("chainId", network.chainId.toString());
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to connect wallet. Please make sure MetaMask is installed.";
      setError(message);
      console.error("Wallet connection error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const modal = initializeWeb3Modal();
      modal.clearCachedProvider();

      setWallet({
        address: null,
        chainId: null,
        isConnected: false,
        provider: null,
      });

      localStorage.removeItem("walletAddress");
      localStorage.removeItem("chainId");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disconnect wallet";
      setError(message);
      console.error("Disconnect error:", err);
    }
  }, []);

  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!wallet.provider || !wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        const signer: JsonRpcSigner = await wallet.provider.getSigner();
        if (!signer) {
          throw new Error("Failed to get signer from provider");
        }
        const signature = await signer.signMessage(message);
        return signature;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to sign message";
        setError(message);
        console.error("Sign message error:", err);
        return null;
      }
    },
    [wallet.provider, wallet.address],
  );

  const getBalance = useCallback(async (): Promise<string | null> => {
    if (!wallet.provider || !wallet.address) {
      setError("Wallet not connected");
      return null;
    }

    try {
      const balanceWei = await wallet.provider.getBalance(wallet.address);
      const balanceEth = formatEther(balanceWei);
      return balanceEth;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch balance";
      setError(message);
      console.error("Get balance error:", err);
      return null;
    }
  }, [wallet.provider, wallet.address]);

  const verifyAndSaveWallet = useCallback(async (): Promise<boolean> => {
    if (!authUser) {
      setError("User not authenticated");
      return false;
    }

    if (!wallet.address || !wallet.provider) {
      setError("Wallet not connected");
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Create verification message
      const message = `Verify wallet ownership for CryptoVault\nWallet: ${wallet.address}\nTimestamp: ${Date.now()}`;

      // Sign the message with the wallet
      const signer: JsonRpcSigner = await wallet.provider.getSigner();
      if (!signer) {
        throw new Error("Failed to get signer from provider");
      }
      const signature = await signer.signMessage(message);

      // Verify the signature matches the address
      const recoveredAddress = verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== wallet.address.toLowerCase()) {
        throw new Error("Wallet verification failed - signature mismatch");
      }

      // Determine wallet type from provider
      let walletType = "metamask";
      if (window.ethereum?.isMetaMask === false) {
        walletType = "walletconnect";
      }

      // Save wallet to Supabase
      const savedWallet = await createWallet(
        authUser.id,
        wallet.address,
        walletType,
        `${walletType} Wallet`,
      );

      if (savedWallet && savedWallet.id) {
        setWallet((prev) => ({
          ...prev,
          walletId: savedWallet.id,
        }));

        // Store wallet ID in localStorage
        localStorage.setItem("walletId", savedWallet.id);

        return true;
      }

      throw new Error("Failed to save wallet to database");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to verify and save wallet";
      setError(message);
      console.error("Wallet verification error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [authUser, wallet.address, wallet.provider]);

  return {
    ...wallet,
    connect: connectWallet,
    disconnect,
    signMessage,
    getBalance,
    verifyAndSaveWallet,
    loading,
    error,
  };
}
