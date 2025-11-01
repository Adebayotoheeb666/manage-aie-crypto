const COINGECKO_API =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_COINGECKO_API) || "https://api.coingecko.com/api/v3";

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price_usd: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply: number;
}

interface CoinGeckoResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
  };
}

interface CoinGeckoDetailResponse {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    circulating_supply: number;
  };
}

const COIN_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  XRP: "ripple",
  ADA: "cardano",
  SOL: "solana",
  DOGE: "dogecoin",
  USDT: "tether",
  USDC: "usd-coin",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
};

export async function getCoinPrice(symbol: string): Promise<CoinPrice | null> {
  try {
    const coinId = COIN_IDS[symbol.toUpperCase()];
    if (!coinId) {
      console.warn(`Coin symbol ${symbol} not found in CoinGecko mapping`);
      return null;
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();
    const priceData = data[coinId];

    if (!priceData) {
      return null;
    }

    return {
      id: coinId,
      symbol: symbol.toUpperCase(),
      name: symbol,
      price_usd: priceData.usd,
      price_change_24h: priceData.usd_24h_change,
      market_cap: priceData.usd_market_cap,
      volume_24h: priceData.usd_market_cap,
      circulating_supply: 0,
    };
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return null;
  }
}

export async function getMultipleCoinPrices(
  symbols: string[],
): Promise<Record<string, CoinPrice>> {
  const prices: Record<string, CoinPrice> = {};
  const coinIds = symbols.map((s) => COIN_IDS[s.toUpperCase()]).filter(Boolean);

  if (coinIds.length === 0) {
    return prices;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();

    symbols.forEach((symbol) => {
      const coinId = COIN_IDS[symbol.toUpperCase()];
      const priceData = data[coinId];

      if (priceData) {
        prices[symbol.toUpperCase()] = {
          id: coinId,
          symbol: symbol.toUpperCase(),
          name: symbol,
          price_usd: priceData.usd,
          price_change_24h: priceData.usd_24h_change,
          market_cap: priceData.usd_market_cap,
          volume_24h: priceData.usd_market_cap,
          circulating_supply: 0,
        };
      }
    });
  } catch (error) {
    console.error("Failed to fetch multiple prices:", error);
  }

  return prices;
}

export async function getCoinDetails(
  symbol: string,
): Promise<CoinPrice | null> {
  try {
    const coinId = COIN_IDS[symbol.toUpperCase()];
    if (!coinId) {
      console.warn(`Coin symbol ${symbol} not found in CoinGecko mapping`);
      return null;
    }

    const response = await fetch(`${COINGECKO_API}/coins/${coinId}`);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoDetailResponse = await response.json();

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      price_usd: data.market_data.current_price.usd,
      price_change_24h: data.market_data.price_change_percentage_24h,
      market_cap: data.market_data.market_cap.usd || 0,
      volume_24h: data.market_data.total_volume.usd || 0,
      circulating_supply: data.market_data.circulating_supply || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch details for ${symbol}:`, error);
    return null;
  }
}
