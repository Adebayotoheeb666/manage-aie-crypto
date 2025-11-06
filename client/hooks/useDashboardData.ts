import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPortfolioValue,
  getPortfolio24hChange,
  getWalletAssets,
  getTransactionSummary,
  supabase,
} from "@shared/lib/supabase";
import { getMultipleCoinPrices } from "@shared/lib/coingecko";
import type {
  PortfolioValue,
  PortfolioChange,
  Asset,
  Transaction,
  PriceHistory,
} from "@shared/types/database";

// Define the Supabase price data structure
interface SupabasePriceData {
  id: string;
  symbol: string;
  price: number;
  change_24h: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply: number;
  timestamp: string;
  source: string;
  [key: string]: any; // For any additional fields
}

// Define the price data structure that matches the PriceHistory type
interface PriceData extends Omit<PriceHistory, 'id' | 'timestamp' | 'source'> {
  // This extends the PriceHistory type but makes some fields optional
  // to match our actual usage in the component
  timestamp?: string;
  source?: string;
}

interface DashboardData {
  portfolioValue: PortfolioValue | null;
  portfolioChange: PortfolioChange | null;
  assets: Asset[];
  transactions: Transaction[];
  prices: Record<string, PriceData | null>;
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
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (): Promise<void> => {
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
      const [valueData, changeData] = await Promise.all([
        getPortfolioValue(dbUser.id),
        getPortfolio24hChange(dbUser.id),
      ]);

      setPortfolioValue(valueData);
      setPortfolioChange(changeData);

      // Fetch user assets
      const assetsData = await getWalletAssets(dbUser.id);
      const formattedAssets = assetsData.flatMap(wallet => 
        wallet.assets.map(asset => ({
          ...asset,
          walletId: wallet.id
        }))
      );
      setAssets(formattedAssets);

      // Fetch transaction history (using getTransactionSummary as a fallback)
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setTransactions(transactionsData || []);

      // Get unique symbols for price lookup
      const symbols = [...new Set(formattedAssets.map(asset => asset.symbol))];
      
      if (symbols.length > 0) {
        try {
          const pricesMap: Record<string, PriceData> = {};
          const now = new Date().toISOString();
          
          // First, try to get prices from Supabase
          const { data: supabasePrices } = await supabase
            .from('price_history')
            .select('*')
            .in('symbol', symbols)
            .order('timestamp', { ascending: false });
          
          // Process Supabase prices
          (supabasePrices as SupabasePriceData[])?.forEach(price => {
            if (price?.symbol && !pricesMap[price.symbol]) {
              pricesMap[price.symbol] = {
                symbol: price.symbol,
                price_usd: typeof price.price === 'number' ? price.price : 0,
                price_change_24h: typeof price.change_24h === 'number' ? price.change_24h : 0,
                market_cap: typeof price.market_cap === 'number' ? price.market_cap : 0,
                volume_24h: typeof price.volume_24h === 'number' ? price.volume_24h : 0,
                circulating_supply: typeof price.circulating_supply === 'number' 
                  ? price.circulating_supply 
                  : 0,
                timestamp: price.timestamp || now,
                source: 'supabase'
              };
            }
          });
          
          // If we didn't get all prices from Supabase, try CoinGecko as fallback
          const missingSymbols = symbols.filter(s => !pricesMap[s]);
          
          if (missingSymbols.length > 0) {
            try {
              const coinGeckoPrices = await getMultipleCoinPrices(missingSymbols);
              
              // Process CoinGecko prices
              Object.entries(coinGeckoPrices).forEach(([symbol, priceData]) => {
                if (priceData && !pricesMap[symbol]) {
                  const coinData = priceData as any; // Type assertion since we know the shape from CoinGecko
                  pricesMap[symbol] = {
                    symbol,
                    price_usd: typeof coinData.current_price === 'number' ? coinData.current_price : 0,
                    price_change_24h: typeof coinData.price_change_percentage_24h === 'number' 
                      ? coinData.price_change_percentage_24h 
                      : 0,
                    market_cap: typeof coinData.market_cap === 'number' ? coinData.market_cap : 0,
                    volume_24h: typeof coinData.total_volume === 'number' ? coinData.total_volume : 0,
                    circulating_supply: typeof coinData.circulating_supply === 'number' 
                      ? coinData.circulating_supply 
                      : 0,
                    timestamp: now,
                    source: 'coingecko' as const
                  };
                }
              });
            } catch (coinGeckoError) {
              console.error('Error fetching from CoinGecko:', coinGeckoError);
              // Continue with the prices we have from Supabase
            }
          }
          setPrices(pricesMap);
        } catch (error) {
          console.error('Error in fetchData:', error);
          setError('Failed to fetch dashboard data');
          setPrices({});
        } finally {
          setLoading(false);
        }
      } else {
        setPrices({});
      }
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message || "Failed to fetch dashboard data");
      // Suppress logging of caught errors since they're handled gracefully with fallbacks
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
