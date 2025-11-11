import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

interface MaintenanceResponse {
  success: boolean;
  cleaned: number;
  message?: string;
  error?: string;
}

/**
 * POST /api/maintenance/cleanup-sessions
 * Clean up expired user sessions
 * Requires X-API-Key header matching CRON_API_KEY
 */
export const handleCleanupSessions: RequestHandler<
  unknown,
  MaintenanceResponse
> = async (req, res) => {
  try {
    // Verify API key for cron job
    const apiKey = req.headers["x-api-key"];
    const envApiKey = process.env.CRON_API_KEY;

    if (envApiKey && apiKey !== envApiKey) {
      res.status(401).json({
        success: false,
        cleaned: 0,
        error: "Unauthorized - Invalid API key",
      });
      return;
    }

    // Call database function to cleanup expired sessions
    const { data, error } = await supabase.rpc("cleanup_expired_sessions");
    const cleanedCount = typeof data === 'number' ? data : 0;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      cleaned: cleanedCount,
      message: `Cleaned up ${cleanedCount} expired sessions`,
    });
  } catch (err) {
    console.error("Cleanup sessions error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

/**
 * POST /api/maintenance/unlock-accounts
 * Unlock accounts that have been locked due to failed login attempts
 * Requires X-API-Key header matching CRON_API_KEY
 */
export const handleUnlockAccounts: RequestHandler<
  unknown,
  MaintenanceResponse
> = async (req, res) => {
  try {
    // Verify API key for cron job
    const apiKey = req.headers["x-api-key"];
    const envApiKey = process.env.CRON_API_KEY;

    if (envApiKey && apiKey !== envApiKey) {
      res.status(401).json({
        success: false,
        cleaned: 0,
        error: "Unauthorized - Invalid API key",
      });
      return;
    }

    // Call database function to unlock expired account locks
    const { data, error } = await supabase.rpc("unlock_expired_account_locks");
    const unlockedCount = typeof data === 'number' ? data : 0;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      cleaned: unlockedCount,
      message: `Unlocked ${unlockedCount} accounts`,
    });
  } catch (err) {
    console.error("Unlock accounts error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

/**
 * POST /api/maintenance/lock-accounts
 * Lock accounts with excessive failed login attempts
 * Requires X-API-Key header matching CRON_API_KEY
 */
export const handleLockAccounts: RequestHandler<
  unknown,
  MaintenanceResponse
> = async (req, res) => {
  try {
    // Verify API key for cron job
    const apiKey = req.headers["x-api-key"];
    const envApiKey = process.env.CRON_API_KEY;

    if (envApiKey && apiKey !== envApiKey) {
      res.status(401).json({
        success: false,
        cleaned: 0,
        error: "Unauthorized - Invalid API key",
      });
      return;
    }

    // Call database function to lock accounts with excessive attempts
    const { data, error } = await supabase.rpc(
      "lock_accounts_excessive_attempts",
    );

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      cleaned: data || 0,
      message: `Locked ${data || 0} accounts due to excessive login attempts`,
    });
  } catch (err) {
    console.error("Lock accounts error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};
