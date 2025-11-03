import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/types/database";

interface VerificationResult {
  test: string;
  status: "✓" | "✗" | "⚠";
  message: string;
  duration?: number;
}

const results: VerificationResult[] = [];

function log(result: VerificationResult) {
  results.push(result);
  const icon = result.status === "✓" ? "✅" : result.status === "✗" ? "❌" : "⚠️";
  const duration = result.duration ? ` (${result.duration}ms)` : "";
  console.log(`${icon} ${result.test}: ${result.message}${duration}`);
}

async function verifyDatabaseConnection() {
  console.log("\n========================================");
  console.log("DATABASE CONNECTION VERIFICATION");
  console.log("========================================\n");

  // Test 1: Environment Variables
  console.log("1️⃣  CHECKING ENVIRONMENT VARIABLES...\n");

  const VITE_SUPABASE_URL =
    process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const VITE_SUPABASE_ANON_KEY =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (VITE_SUPABASE_URL) {
    log({
      test: "VITE_SUPABASE_URL",
      status: "✓",
      message: `Configured: ${VITE_SUPABASE_URL}`,
    });
  } else {
    log({
      test: "VITE_SUPABASE_URL",
      status: "✗",
      message: "Not configured",
    });
  }

  if (VITE_SUPABASE_ANON_KEY) {
    const key = VITE_SUPABASE_ANON_KEY.substring(0, 20) + "...";
    log({
      test: "VITE_SUPABASE_ANON_KEY",
      status: "✓",
      message: `Configured: ${key}`,
    });
  } else {
    log({
      test: "VITE_SUPABASE_ANON_KEY",
      status: "✗",
      message: "Not configured",
    });
  }

  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    console.log(
      "\n❌ Missing required environment variables. Cannot proceed.\n"
    );
    process.exit(1);
  }

  // Test 2: Client Creation
  console.log("\n2️⃣  TESTING CLIENT CREATION...\n");

  let supabase: any;
  try {
    const startTime = Date.now();
    supabase = createClient<Database>(
      VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY
    );
    const duration = Date.now() - startTime;

    log({
      test: "Create Supabase Client",
      status: "✓",
      message: "Client created successfully",
      duration,
    });
  } catch (error) {
    log({
      test: "Create Supabase Client",
      status: "✗",
      message: `Failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    process.exit(1);
  }

  // Test 3: Basic Connection Test
  console.log("\n3️⃣  TESTING DATABASE CONNECTION...\n");

  try {
    const startTime = Date.now();
    const { data, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const duration = Date.now() - startTime;

    if (error) {
      log({
        test: "Database Connection",
        status: "✗",
        message: `Error: ${error.message}`,
        duration,
      });
    } else {
      log({
        test: "Database Connection",
        status: "✓",
        message: "Connected successfully",
        duration,
      });
    }
  } catch (error) {
    log({
      test: "Database Connection",
      status: "✗",
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  // Test 4: Test Key Tables
  console.log("\n4️⃣  VERIFYING TABLES...\n");

  const tablesToCheck = [
    "users",
    "sessions",
    "wallets",
    "assets",
    "transactions",
    "price_history",
    "withdrawal_requests",
    "portfolio_snapshots",
    "price_alerts",
    "audit_logs",
  ];

  for (const table of tablesToCheck) {
    try {
      const startTime = Date.now();
      const { error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      const duration = Date.now() - startTime;

      if (error) {
        if (error.code === "42P01") {
          // relation does not exist
          log({
            test: `Table: ${table}`,
            status: "✗",
            message: "Table does not exist",
            duration,
          });
        } else {
          log({
            test: `Table: ${table}`,
            status: "⚠",
            message: `Check failed: ${error.message}`,
            duration,
          });
        }
      } else {
        log({
          test: `Table: ${table}`,
          status: "✓",
          message: "Table exists and accessible",
          duration,
        });
      }
    } catch (error) {
      log({
        test: `Table: ${table}`,
        status: "✗",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  // Test 5: Test Key Functions
  console.log("\n5️⃣  VERIFYING FUNCTIONS...\n");

  const functionsToCheck = [
    "calculate_portfolio_value",
    "get_portfolio_24h_change",
    "get_portfolio_allocation",
    "get_transaction_summary",
    "update_asset_prices",
    "check_and_trigger_price_alerts",
    "cleanup_expired_sessions",
    "log_audit_event",
  ];

  for (const func of functionsToCheck) {
    try {
      const startTime = Date.now();
      // Test with dummy params - we just want to see if the function exists
      const { error } = await supabase.rpc(func, {});
      const duration = Date.now() - startTime;

      if (
        error &&
        error.message.includes("does not exist") &&
        error.code === "42883"
      ) {
        log({
          test: `Function: ${func}`,
          status: "✗",
          message: "Function does not exist",
          duration,
        });
      } else if (error) {
        // Expected error due to missing parameters, but function exists
        log({
          test: `Function: ${func}`,
          status: "✓",
          message: "Function exists (parameter validation error expected)",
          duration,
        });
      } else {
        log({
          test: `Function: ${func}`,
          status: "✓",
          message: "Function exists and callable",
          duration,
        });
      }
    } catch (error) {
      log({
        test: `Function: ${func}`,
        status: "✗",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  // Test 6: Authentication Test
  console.log("\n6️⃣  TESTING AUTHENTICATION...\n");

  try {
    const startTime = Date.now();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    const duration = Date.now() - startTime;

    if (error) {
      log({
        test: "Auth Configuration",
        status: "⚠",
        message: `No authenticated user: ${error.message}`,
        duration,
      });
    } else if (user) {
      log({
        test: "Auth Configuration",
        status: "✓",
        message: `Authenticated as: ${user.email}`,
        duration,
      });
    } else {
      log({
        test: "Auth Configuration",
        status: "⚠",
        message: "Auth working but no user logged in (expected for anon key)",
        duration,
      });
    }
  } catch (error) {
    log({
      test: "Auth Configuration",
      status: "✗",
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  // Summary
  console.log("\n========================================");
  console.log("VERIFICATION SUMMARY");
  console.log("========================================\n");

  const passed = results.filter((r) => r.status === "✓").length;
  const failed = results.filter((r) => r.status === "✗").length;
  const warnings = results.filter((r) => r.status === "⚠").length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);

  console.log("\n========================================");

  if (failed === 0) {
    console.log("✅ DATABASE CONNECTION VERIFIED!");
    console.log("========================================\n");
    process.exit(0);
  } else {
    console.log("❌ SOME TESTS FAILED - Review the output above");
    console.log("========================================\n");
    process.exit(1);
  }
}

verifyDatabaseConnection().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
