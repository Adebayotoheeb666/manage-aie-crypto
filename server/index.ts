import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSupabaseHealth } from "./routes/supabaseHealth";
import { handleEnvJs } from "./routes/env";
import { handleWithdraw } from "./routes/withdraw";
import {
  handleGetPrices,
  handleGetPriceBySymbol,
  handleUpdatePrices,
  handleCheckPriceAlerts,
} from "./routes/prices";
import {
  handleCleanupSessions,
  handleUnlockAccounts,
  handleLockAccounts,
} from "./routes/maintenance";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Runtime env injection for client (served as JS)
  app.get("/api/env.js", handleEnvJs);

  app.get("/api/demo", handleDemo);

  // Supabase health check
  // GET /api/supabase-health
  try {
    // diagnostic: ensure app.route exists
    // eslint-disable-next-line no-console
    console.log(
      "registering supabase health route, app.route type:",
      typeof (app as any).route,
    );
    app.get("/api/supabase-health", handleSupabaseHealth);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Could not register supabase health route", e);
  }

  // Withdrawal routes
  // POST /api/withdraw - Create withdrawal request
  app.post("/api/withdraw", handleWithdraw);

  // Price routes
  // GET /api/prices?symbols=BTC,ETH - Get prices for multiple symbols
  app.get("/api/prices", handleGetPrices);

  // GET /api/prices/:symbol - Get price for single symbol
  app.get("/api/prices/:symbol", handleGetPriceBySymbol);

  // POST /api/prices/update - Update all prices (requires X-API-Key header)
  app.post("/api/prices/update", handleUpdatePrices);

  // POST /api/prices/alerts - Check and trigger price alerts (requires X-API-Key header)
  app.post("/api/prices/alerts", handleCheckPriceAlerts);

  // Maintenance routes
  // POST /api/maintenance/cleanup-sessions - Clean up expired sessions
  app.post("/api/maintenance/cleanup-sessions", handleCleanupSessions);

  // POST /api/maintenance/unlock-accounts - Unlock expired account locks
  app.post("/api/maintenance/unlock-accounts", handleUnlockAccounts);

  // POST /api/maintenance/lock-accounts - Lock accounts with excessive failed attempts
  app.post("/api/maintenance/lock-accounts", handleLockAccounts);

  return app;
}
