import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPortfolioValue,
  getPortfolio24hChange,
  getUserAssets,
  getTransactionHistory,
  getLatestPrice,
} from "@shared/lib/supabase";
import { getMultipleCoinPrices } from "@shared/lib/coingecko";
import type {
  PortfolioValue,
  PortfolioChange,
  Asset,
  Transaction,
  PriceHistory,
} from "@shared/types/database";

interface DashboardData {
  portfolioValue: PortfolioValue | null;
  portfolioChange: PortfolioChange | null;
  assets: Asset[];
  transactions: Transaction[];
  prices: Record<string, PriceHistory | null>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const { authUser, dbUser } = useAuth();
  const [portfolioValue, setPortfolioValue] = useState<PortfolioValue | null>(
    null,
  );
  const [portfolioChange, setPortfolioChange] =
    useState<PortfolioChange | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceHistory | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!authUser || !dbUser) return;

    setLoading(true);
    setError(null);

    function extractErrorMessage(err: unknown): string {
      if (!err) return "Unknown error";
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;

      const anyErr = err as any;
      // Common shapes
      if (anyErr?.error) {
        if (typeof anyErr.error === "string") return anyErr.error;
        if (typeof anyErr.error?.message === "string")
          return anyErr.error.message;
      }
      if (typeof anyErr.message === "string") return anyErr.message;
      if (
        typeof anyErr.status === "number" ||
        typeof anyErr.statusText === "string"
      ) {
        return `${anyErr.status || ""} ${anyErr.statusText || ""}`.trim();
      }

      // Fallback: avoid JSON.stringify of complex objects (may include Response)
      try {
        return String(anyErr);
      } catch {
        return "Unknown error";
      }
    }

    try {
      // Fetch portfolio metrics
      const [valueData, changeData, assetsData, txData] = await Promise.all([
        getPortfolioValue(dbUser.id),
        getPortfolio24hChange(dbUser.id),
        getUserAssets(dbUser.id),
        getTransactionHistory(dbUser.id, 10),
      ]);

      setPortfolioValue(valueData);
      setPortfolioChange(changeData);
      setAssets(assetsData);
      setTransactions(txData);

      // Fetch latest prices from CoinGecko
      const uniqueSymbols = [...new Set(assetsData.map((a) => a.symbol))];

      // Fetch from CoinGecko
      const coingeckoPrices = await getMultipleCoinPrices(uniqueSymbols);

      // Convert CoinGecko prices to PriceHistory format
      const priceData: Record<string, PriceHistory | null> = {};
      uniqueSymbols.forEach((symbol) => {
        const cgPrice = coingeckoPrices[symbol.toUpperCase()];
        if (cgPrice) {
          priceData[symbol] = {
            id: cgPrice.id,
            symbol: cgPrice.symbol,
            price_usd: cgPrice.price_usd,
            price_change_24h: cgPrice.price_change_24h,
            market_cap: cgPrice.market_cap,
            volume_24h: cgPrice.volume_24h,
            circulating_supply: cgPrice.circulating_supply,
            timestamp: new Date().toISOString(),
            source: "coingecko",
          } as PriceHistory;
        } else {
          // Fallback to Supabase if CoinGecko fails
          getLatestPrice(symbol).then((price) => {
            if (price) {
              priceData[symbol] = price;
            }
          });
        }
      });

      setPrices(priceData);
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message || "Failed to fetch dashboard data");
      console.error("Dashboard data fetch error:", message, err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when auth user changes
  useEffect(() => {
    fetchData();
  }, [authUser, dbUser]);

  // Set up auto-refresh (every 30 seconds)
  useEffect(() => {
    if (!authUser) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [authUser]);

  return {
    portfolioValue,
    portfolioChange,
    assets,
    transactions,
    prices,
    loading,
    error,
    refetch: fetchData,
  };
}
