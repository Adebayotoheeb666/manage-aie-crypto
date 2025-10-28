import { useState, useEffect, useCallback } from "react";

export interface PriceData {
  [symbol: string]: {
    price: number;
    change24h: number;
    previousPrice: number;
  };
}

const INITIAL_PRICES: PriceData = {
  BTC: { price: 42500, change24h: 5.2, previousPrice: 42500 },
  ETH: { price: 2280, change24h: -2.1, previousPrice: 2280 },
  USDC: { price: 1.0, change24h: 0.1, previousPrice: 1.0 },
  ADA: { price: 0.98, change24h: 3.5, previousPrice: 0.98 },
};

/**
 * Hook that simulates real-time price updates
 * In production, this would connect to a WebSocket or polling API
 */
export function useRealtimePrices(updateInterval = 3000) {
  const [prices, setPrices] = useState<PriceData>(INITIAL_PRICES);
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePrices = useCallback(() => {
    setIsUpdating(true);

    // Simulate price movements with small random changes
    setPrices((prevPrices) => {
      const newPrices = { ...prevPrices };

      Object.keys(newPrices).forEach((symbol) => {
        const current = newPrices[symbol];
        const volatility =
          symbol === "BTC" ? 0.02 : symbol === "ETH" ? 0.03 : 0.001;
        const changePercent = (Math.random() - 0.5) * volatility;
        const newPrice = current.price * (1 + changePercent);

        // Update 24h change with weighted average
        const newChange24h =
          current.change24h * 0.95 + changePercent * 100 * 0.05;

        newPrices[symbol] = {
          previousPrice: current.price,
          price: parseFloat(newPrice.toFixed(2)),
          change24h: parseFloat(newChange24h.toFixed(2)),
        };
      });

      return newPrices;
    });

    setIsUpdating(false);
  }, []);

  useEffect(() => {
    // Update prices at regular intervals
    const interval = setInterval(updatePrices, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, updatePrices]);

  return { prices, isUpdating };
}
