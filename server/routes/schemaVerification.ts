import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const handleSchemaVerification: RequestHandler = async (_req, res) => {
  const report: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: "running",
    checks: {
      connectivity: { status: "pending" },
      tables: { status: "pending", tables: [] },
      functions: { status: "pending", functions: [] },
      seedData: { status: "pending" },
      extensions: { status: "pending" },
    },
  };

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({
      status: "failed",
      error: "Missing Supabase credentials",
      report,
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Test connectivity with a simple query
    const { data: connTest, error: connError } = await supabase
      .from("price_history")
      .select("count", { count: "exact", head: true });

    if (connError) {
      report.checks.connectivity = {
        status: "failed",
        error: connError.message,
      };
    } else {
      report.checks.connectivity = { status: "success" };
    }

    // 2. Test if each expected table exists by trying to query it
    const expectedTables = [
      "users",
      "sessions",
      "device_trust",
      "login_attempts",
      "api_keys",
      "wallets",
      "assets",
      "transactions",
      "price_history",
      "withdrawal_requests",
      "portfolio_snapshots",
      "price_alerts",
      "notification_logs",
      "audit_logs",
    ];

    const foundTables: string[] = [];
    const missingTables: string[] = [];

    for (const table of expectedTables) {
      const { error: tableTestError } = await supabase
        .from(table)
        .select("*")
        .limit(1);

      if (tableTestError?.code === "42P01") {
        // Table doesn't exist
        missingTables.push(table);
      } else if (!tableTestError) {
        foundTables.push(table);
      }
    }

    report.checks.tables = {
      status: missingTables.length === 0 ? "success" : "warning",
      totalTables: foundTables.length,
      expectedTables: expectedTables.length,
      tables: foundTables,
      missing: missingTables,
    };

    // 3. Verify functions exist
    const { data: functions, error: functionsError } = await supabase.rpc(
      "get_function_info",
      {},
    );

    const expectedFunctions = [
      "calculate_portfolio_value",
      "get_portfolio_24h_change",
      "get_transaction_summary",
      "get_portfolio_allocation",
      "get_total_fees_paid",
      "update_asset_prices",
      "check_and_trigger_price_alerts",
      "cleanup_expired_sessions",
      "lock_accounts_excessive_attempts",
      "unlock_expired_account_locks",
      "log_audit_event",
      "log_api_call",
    ];

    if (functionsError && functionsError.code !== "42883") {
      report.checks.functions = {
        status: "error",
        error: functionsError.message,
      };
    } else if (functions) {
      const foundFunctions = functions.map((f: any) => f.function_name);
      const missingFunctions = expectedFunctions.filter(
        (fn) => !foundFunctions.includes(fn),
      );

      report.checks.functions = {
        status: missingFunctions.length === 0 ? "success" : "warning",
        totalFunctions: foundFunctions.length,
        expectedFunctions: expectedFunctions.length,
        functions: foundFunctions,
        missing: missingFunctions,
      };
    } else {
      report.checks.functions = {
        status: "warning",
        message: "Could not verify functions via RPC",
        expectedFunctions,
      };
    }

    // 4. Check seed data in price_history
    const { data: priceData, error: priceError, count: priceCount } =
      await supabase.from("price_history").select("*", { count: "exact" });

    if (priceError) {
      report.checks.seedData = {
        status: "error",
        error: priceError.message,
      };
    } else {
      const symbols = [...new Set(priceData?.map((p: any) => p.symbol) || [])];
      report.checks.seedData = {
        status: priceData && priceData.length > 0 ? "success" : "empty",
        recordCount: priceCount || 0,
        symbols: symbols,
        sampleRecords: priceData?.slice(0, 3) || [],
      };
    }

    // 5. Check for required extensions
    const { data: extensionData, error: extError } = await supabase
      .from("pg_extension")
      .select("extname");

    if (extError) {
      report.checks.extensions = {
        status: "error",
        error: extError.message,
      };
    } else {
      const requiredExtensions = ["uuid-ossp", "pgcrypto", "citext", "pg_cron"];
      const foundExtensions = extensionData?.map((e: any) => e.extname) || [];
      const missingExtensions = requiredExtensions.filter(
        (ext) => !foundExtensions.includes(ext),
      );

      report.checks.extensions = {
        status: missingExtensions.length === 0 ? "success" : "warning",
        required: requiredExtensions,
        found: foundExtensions,
        missing: missingExtensions,
      };
    }

    // Overall status
    const allSuccess = Object.values(report.checks).every(
      (check: any) =>
        check.status === "success" ||
        check.status === "empty" ||
        (check.status === "warning" && check.missing?.length === 0),
    );

    report.status = allSuccess ? "success" : "partial";

    const statusCode = allSuccess ? 200 : 206;
    res.status(statusCode).json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    report.status = "failed";
    report.error = message;
    res.status(500).json(report);
  }
};
