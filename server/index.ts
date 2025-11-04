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
import { handleSchemaVerification } from "./routes/schemaVerification";
import {
  handleSignUp,
  handleSignIn,
  handleSignOut,
  handleWalletConnect,
  handleGetSession,
  handleGetNonce,
} from "./routes/auth";
import {
  handlePortfolioValue,
  handlePortfolio24hChange,
  handleUserAssets,
  handleTransactionHistory,
  handlePortfolioSnapshots,
  handleLatestPrice,
} from "./routes/proxy";

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
  app.get("/api/supabase-health", handleSupabaseHealth);
  app.get("/api/schema-verification", handleSchemaVerification);

  // Proxy endpoints to allow browser to fallback to server-side requests
  // These use the server-side service role key and avoid CORS issues in preview environments
  const router = express.Router();
  router.post("/portfolio-value", handlePortfolioValue);
  router.post("/portfolio-24h-change", handlePortfolio24hChange);
  router.post("/user-assets", handleUserAssets);
  router.post("/transaction-history", handleTransactionHistory);
  router.post("/portfolio-snapshots", handlePortfolioSnapshots);
  router.post("/latest-price", handleLatestPrice);
  app.use("/api/proxy", router);

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

  // Simple in-memory rate limiter middleware for auth endpoints
  const rateWindows = new Map<string, { count: number; resetAt: number }>();
  function authRateLimiter(req: any, res: any, next: any) {
    try {
      const ip = (
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "unknown"
      ).toString();
      const key = `auth:${ip}`;
      const now = Date.now();
      const WINDOW_MS = 60 * 1000; // 1 minute
      const MAX = 30; // max requests per window per IP
      const entry = rateWindows.get(key);
      if (!entry || entry.resetAt < now) {
        rateWindows.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return next();
      }
      if (entry.count >= MAX) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        return res
          .status(429)
          .json({ error: "Too many requests. Please try again later." });
      }
      entry.count += 1;
      rateWindows.set(key, entry);
      return next();
    } catch (e) {
      return next();
    }
  }

  // Auth routes (proxy through backend to avoid Netlify restrictions)
  // POST /api/auth/signup - Sign up with email/password
  app.post("/api/auth/signup", authRateLimiter, handleSignUp);

  // POST /api/auth/signin - Sign in with email/password
  app.post("/api/auth/signin", authRateLimiter, handleSignIn);

  // POST /api/auth/signout - Sign out
  app.post("/api/auth/signout", authRateLimiter, handleSignOut);

  // POST /api/auth/wallet-connect - Connect wallet (signature-based)
  app.post("/api/auth/wallet-connect", authRateLimiter, handleWalletConnect);

  // GET /api/auth/session - Get current session
  app.get("/api/auth/session", authRateLimiter, handleGetSession);

  // GET /api/auth/nonce - Get a nonce for signing (query: address=0x...)
  app.get("/api/auth/nonce", authRateLimiter, handleGetNonce);

  return app;
}
