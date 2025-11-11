import { RequestHandler } from "express";
import {
  getMultipleCoinPrices,
  getCoinPrice,
} from "../../shared/lib/coingecko";
import { supabase } from "../../shared/lib/supabase";
import { insertPriceHistory } from "../../shared/lib/supabase";
import { z } from "zod";

// GET /api/prices - Get current prices for multiple symbols
export const handleGetPrices: RequestHandler = async (req, res) => {
  try {
    const { symbols } = req.query;

    if (!symbols || typeof symbols !== "string") {
      res.status(400).json({
        error: "symbols parameter required (comma-separated)",
      });
      return;
    }

    const symbolList = symbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbolList.length === 0) {
      res.status(400).json({
        error: "At least one symbol required",
      });
      return;
    }

    if (symbolList.length > 50) {
      res.status(400).json({
        error: "Maximum 50 symbols allowed per request",
      });
      return;
    }

    const prices = await getMultipleCoinPrices(symbolList);

    res.json({
      success: true,
      data: prices,
      count: Object.keys(prices).length,
    });
  } catch (err) {
    console.error("Get prices error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

// GET /api/prices/:symbol - Get price for single symbol
export const handleGetPriceBySymbol: RequestHandler = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      res.status(400).json({
        error: "Symbol parameter required",
      });
      return;
    }

    const price = await getCoinPrice(symbol);

    if (!price) {
      res.status(404).json({
        error: `Price not found for symbol: ${symbol}`,
      });
      return;
    }

    res.json({
      success: true,
      data: price,
    });
  } catch (err) {
    console.error("Get price error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

// POST /api/prices/update - Update prices for all symbols (admin/cron)
const updatePricesSchema = z.object({
  symbols: z
    .array(z.string())
    .optional()
    .default([
      "BTC",
      "ETH",
      "XRP",
      "ADA",
      "SOL",
      "DOGE",
      "USDT",
      "USDC",
      "LTC",
      "BCH",
    ]),
  apiKey: z.string().optional(),
});

type UpdatePricesRequest = z.infer<typeof updatePricesSchema>;

interface UpdatePricesResponse {
  success: boolean;
  updated: number;
  failed: number;
  message?: string;
  error?: string;
}

export const handleUpdatePrices: RequestHandler<
  unknown,
  UpdatePricesResponse,
  UpdatePricesRequest
> = async (req, res) => {
  try {
    // Verify API key for cron job
    const apiKey = req.headers["x-api-key"];
    const envApiKey = process.env.CRON_API_KEY;

    if (envApiKey && apiKey !== envApiKey) {
      res.status(401).json({
        success: false,
        updated: 0,
        failed: 0,
        error: "Unauthorized - Invalid API key",
      });
      return;
    }

    // Validate request body
    let updateData: UpdatePricesRequest;
    try {
      updateData = updatePricesSchema.parse(req.body);
    } catch (validationError) {
      updateData = {
        symbols: [
          "BTC",
          "ETH",
          "XRP",
          "ADA",
          "SOL",
          "DOGE",
          "USDT",
          "USDC",
          "LTC",
          "BCH",
        ],
      };
    }

    const { symbols } = updateData;

    let updated = 0;
    let failed = 0;

    // Fetch prices from CoinGecko
    const prices = await getMultipleCoinPrices(symbols);

    // Save each price to database
    for (const symbol in prices) {
      try {
        const priceData = prices[symbol];

        await insertPriceHistory(
          symbol,
          priceData.price_usd,
          priceData.price_change_24h,
          priceData.market_cap,
          priceData.volume_24h,
          priceData.circulating_supply,
          "coingecko",
        );

        updated++;
      } catch (err) {
        console.error(`Failed to save price for ${symbol}:`, err);
        failed++;
      }
    }

    // Update asset prices in the database
    try {
      await supabase.rpc("update_asset_prices");
    } catch (err) {
      console.error("Failed to update asset prices in database:", err);
    }

    res.json({
      success: true,
      updated,
      failed,
      message: `Updated ${updated} prices, ${failed} failed`,
    });
  } catch (err) {
    console.error("Update prices error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

// POST /api/prices/alerts - Check and trigger price alerts (admin/cron)
interface PriceAlertsResponse {
  success: boolean;
  triggered: number;
  message?: string;
  error?: string;
}

export const handleCheckPriceAlerts: RequestHandler<
  unknown,
  PriceAlertsResponse
> = async (req, res) => {
  try {
    // Verify API key for cron job
    const apiKey = req.headers["x-api-key"];
    const envApiKey = process.env.CRON_API_KEY;

    if (envApiKey && apiKey !== envApiKey) {
      res.status(401).json({
        success: false,
        triggered: 0,
        error: "Unauthorized - Invalid API key",
      });
      return;
    }

    // Call database function to check and trigger alerts
    const { data, error } = await supabase.rpc(
      "check_and_trigger_price_alerts",
    );

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      triggered: data || 0,
      message: `Triggered ${data || 0} price alerts`,
    });
  } catch (err) {
    console.error("Check price alerts error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};
