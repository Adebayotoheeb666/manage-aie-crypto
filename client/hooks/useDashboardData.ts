import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getPortfolioValue,
  getPortfolio24hChange,
  getUserAssets,
  getTransactionHistory,
  getLatestPrice,
} from '@shared/lib/supabase';
import type {
  PortfolioValue,
  PortfolioChange,
  Asset,
  Transaction,
  PriceHistory,
} from '@shared/types/database';

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
  const [portfolioValue, setPortfolioValue] = useState<PortfolioValue | null>(null);
  const [portfolioChange, setPortfolioChange] = useState<PortfolioChange | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceHistory | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!authUser || !dbUser) return;

    setLoading(true);
    setError(null);

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

      // Fetch latest prices for each asset
      const uniqueSymbols = [...new Set(assetsData.map((a) => a.symbol))];
      const priceData: Record<string, PriceHistory | null> = {};

      for (const symbol of uniqueSymbols) {
        const price = await getLatestPrice(symbol);
        priceData[symbol] = price;
      }

      setPrices(priceData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(message);
      console.error('Dashboard data fetch error:', err);
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
