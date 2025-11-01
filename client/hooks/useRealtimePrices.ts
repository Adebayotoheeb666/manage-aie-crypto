import { useState, useEffect, useCallback } from "react";
import { getMultipleCoinPrices } from "@shared/lib/coingecko";
import type { PriceHistory } from "@shared/types/database";

export interface PriceData {
  [symbol: string]: {
    price: number;
    change24h: number;
    previousPrice: number;
  };
}

/**
 * Hook that fetches real-time prices from Supabase
 * Updates prices at specified intervals by polling the database
 */
export function useRealtimePrices(updateInterval = 30000) {
  const [prices, setPrices] = useState<PriceData>({});
  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Symbols to track
  const symbols = ["BTC", "ETH", "USDC", "ADA"];

  const updatePrices = useCallback(async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const newPrices: PriceData = {};

      for (const symbol of symbols) {
        const priceData = await getLatestPrice(symbol);

        if (priceData) {
          newPrices[symbol] = {
            price: priceData.price_usd,
            change24h: priceData.price_change_24h || 0,
            previousPrice:
              priceData.price_usd - (priceData.price_change_24h || 0),
          };
        }
      }

      if (Object.keys(newPrices).length > 0) {
        setPrices(newPrices);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch prices";
      setError(message);
      console.error("Price update error:", err);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Fetch prices on mount
  useEffect(() => {
    updatePrices();
  }, []);

  // Set up polling interval for price updates
  useEffect(() => {
    const interval = setInterval(updatePrices, updateInterval);
    return () => clearInterval(interval);
  }, [updateInterval, updatePrices]);

  return { prices, isUpdating, error, refetch: updatePrices };
}
