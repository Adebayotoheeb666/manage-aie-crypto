import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

export const handleSupabaseHealth: RequestHandler = async (_req, res) => {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    envVarsLoaded: {},
  };

  // Check environment variables
  const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  diagnostics.envVarsLoaded = {
    SUPABASE_URL: {
      loaded: !!SUPABASE_URL,
      isValidUrl: SUPABASE_URL ? /^https?:\/\//.test(SUPABASE_URL) : false,
      domain: SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null,
    },
    SUPABASE_KEY: {
      loaded: !!SUPABASE_KEY,
      keyLength: SUPABASE_KEY?.length ?? 0,
    },
  };

  if (!SUPABASE_URL || !/^https?:\/\//.test(SUPABASE_URL)) {
    return res.status(500).json({
      ok: false,
      error: "SUPABASE_URL missing or invalid",
      diagnostics,
    });
  }

  if (!SUPABASE_KEY) {
    return res.status(500).json({
      ok: false,
      error: "SUPABASE key missing",
      diagnostics,
    });
  }

  try {
    // Test 1: Network connectivity to Supabase domain
    const supabaseHost = new URL(SUPABASE_URL).hostname;
    diagnostics.networkTest = { host: supabaseHost, status: "testing" };

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Test 2: Test RPC function as a lightweight connection check
    try {
      const { data, error: rpcError } = (await Promise.race([
        supabase.rpc("ping", {}).then((result) => ({
          ...result,
          type: "rpc",
        })),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout (5s)")), 5000),
        ),
      ])) as any;

      if (rpcError && rpcError.code !== "42883") {
        // 42883 = function does not exist
        diagnostics.rpcTest = {
          status: "failed",
          error: rpcError.message,
          code: rpcError.code,
        };
      } else if (rpcError?.code === "42883") {
        // Function doesn't exist, try table select instead
        diagnostics.rpcTest = {
          status: "skipped",
          reason: "ping function not found",
        };
      } else {
        diagnostics.rpcTest = { status: "success", data };
      }
    } catch (rpcErr) {
      diagnostics.rpcTest = {
        status: "error",
        error: rpcErr instanceof Error ? rpcErr.message : "Unknown error",
      };
    }

    // Test 3: Try selecting from users table
    try {
      const { data, error: tableError } = (await Promise.race([
        supabase.from("users").select("id").limit(1),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout (5s)")), 5000),
        ),
      ])) as any;

      if (tableError) {
        diagnostics.tableTest = {
          status: "error",
          error: tableError.message,
          code: tableError.code,
          hint: tableError.hint,
        };
      } else {
        diagnostics.tableTest = {
          status: "success",
          recordCount: data?.length ?? 0,
        };
      }
    } catch (tableErr) {
      diagnostics.tableTest = {
        status: "error",
        error: tableErr instanceof Error ? tableErr.message : "Unknown error",
      };
    }

    const allTestsPassed =
      diagnostics.rpcTest?.status !== "error" &&
      diagnostics.tableTest?.status !== "error";

    return res.status(allTestsPassed ? 200 : 500).json({
      ok: allTestsPassed,
      message: allTestsPassed
        ? "Connected to Supabase successfully"
        : "Partial connection to Supabase",
      diagnostics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    diagnostics.fatalError = message;
    return res.status(500).json({
      ok: false,
      error: message,
      diagnostics,
    });
  }
};
