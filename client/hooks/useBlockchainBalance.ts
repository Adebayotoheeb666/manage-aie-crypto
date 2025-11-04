import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface BlockchainBalance {
  balance: string; // in ETH
  balanceUsd: number;
  address: string;
  chainId: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const SEPOLIA_RPC = "https://eth-sepolia.public.blastapi.io";
const ETH_USD_PRICE = 2500; // Fallback price

export function useBlockchainBalance(walletAddress: string | null) {
  const [balance, setBalance] = useState<BlockchainBalance>({
    balance: "0",
    balanceUsd: 0,
    address: walletAddress || "",
    chainId: 11155111, // Sepolia
    loading: false,
    error: null,
    lastUpdated: null,
  });

  useEffect(() => {
    if (!walletAddress) return;

    let mounted = true;
    let intervalId: NodeJS.Timeout;

    async function fetchBalance() {
      try {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
        const balanceWei = await provider.getBalance(walletAddress);
        const balanceEth = ethers.formatEther(balanceWei);

        // Fetch current ETH price from CoinGecko
        let ethPrice = ETH_USD_PRICE;
        try {
          const priceResponse = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
          );
          const priceData = await priceResponse.json();
          if (priceData.ethereum?.usd) {
            ethPrice = priceData.ethereum.usd;
          }
        } catch (err) {
          console.warn("Failed to fetch ETH price, using fallback", err);
        }

        const balanceUsd = parseFloat(balanceEth) * ethPrice;

        if (mounted) {
          setBalance({
            balance: balanceEth,
            balanceUsd,
            address: walletAddress,
            chainId: 11155111,
            loading: false,
            error: null,
            lastUpdated: new Date(),
          });
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to fetch balance";
        if (mounted) {
          setBalance((prev) => ({
            ...prev,
            loading: false,
            error: errorMsg,
          }));
        }
        console.error("Blockchain balance fetch error:", err);
      }
    }

    // Initial fetch
    setBalance((prev) => ({ ...prev, loading: true }));
    fetchBalance();

    // Auto-refresh every 30 seconds
    intervalId = setInterval(fetchBalance, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [walletAddress]);

  return balance;
}
