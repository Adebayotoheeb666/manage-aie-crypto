import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/types/database";

// Table types
type Tables = Database["public"]["Tables"];
type WalletAssets = Tables["wallets"]["Row"] & {
  assets: Tables["assets"]["Row"][];
};
type WithdrawalRequests = Tables["withdrawal_requests"]["Row"];
type PriceHistory = Tables["price_history"]["Row"];

// Function types
type Functions = Database["public"]["Functions"];
type CalculatePortfolioValue = Functions["calculate_portfolio_value"];
type GetPortfolio24hChange = Functions["get_portfolio_24h_change"];
type GetTransactionSummary = Functions["get_transaction_summary"];
type GetPortfolioAllocation = Functions["get_portfolio_allocation"];
type UpdateAssetPrices = Functions["update_asset_prices"];
type CheckAndTriggerPriceAlerts = Functions["check_and_trigger_price_alerts"];
type CleanupExpiredSessions = Functions["cleanup_expired_sessions"];
type LogAuditEvent = Functions["log_audit_event"];

// Extend the SupabaseClient with our custom RPC methods
type CustomSupabaseClient = SupabaseClient<Database> & {
  rpc: {
    calculate_portfolio_value: (params: { p_user_id: string }) => Promise<{
      data: CalculatePortfolioValue["Returns"] | null;
      error: any;
    }>;
    get_portfolio_24h_change: (params: { p_user_id: string }) => Promise<{
      data: GetPortfolio24hChange["Returns"] | null;
      error: any;
    }>;
    get_transaction_summary: (params: {
      p_user_id: string;
      p_days?: number;
    }) => Promise<{
      data: GetTransactionSummary["Returns"] | null;
      error: any;
    }>;
    get_portfolio_allocation: (params: { p_user_id: string }) => Promise<{
      data: GetPortfolioAllocation["Returns"] | null;
      error: any;
    }>;
    update_asset_prices: () => Promise<{
      data: UpdateAssetPrices["Returns"] | null;
      error: any;
    }>;
    check_and_trigger_price_alerts: () => Promise<{
      data: CheckAndTriggerPriceAlerts["Returns"] | null;
      error: any;
    }>;
    cleanup_expired_sessions: () => Promise<{
      data: CleanupExpiredSessions["Returns"] | null;
      error: any;
    }>;
    log_audit_event: (
      params: LogAuditEvent["Args"],
    ) => Promise<{ data: LogAuditEvent["Returns"] | null; error: any }>;
    get_user_assets: (params: {
      p_user_id: string;
    }) => Promise<{ data: any[] | null; error: any }>;
  };
};

function getEnvVar(name: string) {
  // Read from a runtime-injected window.__env__ (set by /api/env.js) first,
  // then fall back to process.env when running on the server.
  const fromWindow =
    typeof window !== "undefined"
      ? (window as any)?.__env__?.[name]
      : undefined;
  const fromProcess =
    typeof process !== "undefined" ? (process as any).env?.[name] : undefined;
  return fromWindow ?? fromProcess ?? undefined;
}

const SUPABASE_URL =
  getEnvVar("VITE_SUPABASE_URL") ||
  getEnvVar("NEXT_PUBLIC_SUPABASE_URL") ||
  getEnvVar("NEXT_SUPABASE_URL") ||
  "";
const SUPABASE_ANON_KEY =
  getEnvVar("VITE_SUPABASE_ANON_KEY") ||
  getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
  getEnvVar("NEXT_SUPABASE_ANON_KEY") ||
  "";

// Basic runtime validation to give a clearer error if envs are missing
if (!SUPABASE_URL || !/^https?:\/\//.test(SUPABASE_URL)) {
  console.warn(
    "[supabase] SUPABASE_URL is missing or invalid. import.meta.env keys:",
    {
      VITE_SUPABASE_URL: Boolean(getEnvVar("VITE_SUPABASE_URL")),
      NEXT_PUBLIC_SUPABASE_URL: Boolean(getEnvVar("NEXT_PUBLIC_SUPABASE_URL")),
    },
  );
}
if (!SUPABASE_ANON_KEY) {
  console.warn("[supabase] SUPABASE_ANON_KEY is missing or empty");
}

// Lazily initialize Supabase client. If envs are missing the proxy will throw a clear error
let _supabaseClient: SupabaseClient<Database> | null = null;
let _consoleErrorOverridden = false;

function createSupabaseClient(): SupabaseClient<Database> {
  if (_supabaseClient) return _supabaseClient;

  // If envs are present, create real client
  if (SUPABASE_URL && /^https?:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY) {
    // No custom fetch wrapper - let Supabase handle responses directly
    // Supabase-js handles body streaming correctly internally
    const customFetch = fetch;

    _supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: customFetch,
      },
    });

    // Suppress Supabase network errors in console since we have fallback handlers
    if (typeof window !== "undefined" && !_consoleErrorOverridden) {
      _consoleErrorOverridden = true;
      const originalError = console.error;
      console.error = function (...args: any[]) {
        const message = args
          .map((arg) => {
            if (typeof arg === "string") return arg;
            if (arg instanceof Error) return arg.message;
            return String(arg);
          })
          .join(" ");

        if (
          message.includes("Failed to fetch") ||
          message.includes("Network request failed")
        ) {
          return;
        }
        originalError.apply(console, args);
      };
    }

    return _supabaseClient;
  }

  // Fall back to a noop client that provides the minimal surface area used by the app
  console.warn(
    "[supabase] SUPABASE env vars are missing or invalid. Returning a noop supabase client. Some features will be disabled.",
  );

  const noop = {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null } as any;
      },
      onAuthStateChange(_: any) {
        return {
          data: { subscription: { unsubscribe: () => {} } },
        } as any;
      },
      async signUp(_: any) {
        return {
          data: { user: null },
          error: new Error("Supabase not configured"),
        } as any;
      },
      async signInWithPassword(_: any) {
        return {
          data: { user: null },
          error: new Error("Supabase not configured"),
        } as any;
      },
      async signOut() {
        return { error: null } as any;
      },
    },
    from(_table: string) {
      // Return a chainable query builder stub
      const chain: any = {
        select() {
          return chain;
        },
        eq() {
          return chain;
        },
        order() {
          return chain;
        },
        range() {
          return chain;
        },
        limit() {
          return chain;
        },
        insert() {
          return {
            select: async () => ({ data: null, error: null }),
          };
        },
        update() {
          return {
            select: async () => ({ data: null, error: null }),
          };
        },
        delete() {
          return {
            then: async () => ({ data: null, error: null }),
          };
        },
        single: async () => ({ data: null, error: { code: "PGRST116" } }),
      } as unknown as any;
      return chain;
    },
    async rpc() {
      return { data: null, error: null } as any;
    },
  } as unknown as SupabaseClient<Database>;

  _supabaseClient = noop;
  return _supabaseClient;
}

// Create a type-safe proxy for the Supabase client
const createSupabaseProxy = (): CustomSupabaseClient => {
  const client = createSupabaseClient() as unknown as CustomSupabaseClient;

  // Override the rpc method to provide better type safety
  const rpcProxy = new Proxy({} as any, {
    get(_, fn: string) {
      return (params: Record<string, unknown>) => {
        return client.rpc(fn, params as never);
      };
    },
  });

  return new Proxy(client, {
    get(target, prop) {
      if (prop === "rpc") {
        return rpcProxy;
      }
      return (target as any)[prop];
    },
  }) as CustomSupabaseClient;
};

export const supabase = createSupabaseProxy();

// ==========================================
// PORTFOLIO FUNCTIONS
// ==========================================

export async function getPortfolioValue(userId: string) {
  try {
    const { data, error } = await supabase.rpc.calculate_portfolio_value({
      p_user_id: userId,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error calculating portfolio value:", error);
    throw error;
  }
}

export async function getPortfolio24hChange(userId: string) {
  try {
    const { data, error } = await supabase.rpc.get_portfolio_24h_change({
      p_user_id: userId,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting 24h portfolio change:", error);
    throw error;
  }
}

export async function getPortfolioAllocation(userId: string) {
  try {
    const { data, error } = await supabase.rpc.get_portfolio_allocation({
      p_user_id: userId,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting portfolio allocation:", error);
    throw error;
  }
}

// ==========================================
// TRANSACTION FUNCTIONS
// ==========================================

export async function getTransactionSummary(userId: string, days: number = 30) {
  try {
    const { data, error } = await supabase.rpc.get_transaction_summary({
      p_user_id: userId,
      p_days: days,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting transaction summary:", error);
    throw error;
  }
}

// ==========================================
// AUDIT LOG FUNCTIONS
// ==========================================

export async function logAuditEvent(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string,
) {
  const { data, error } = await supabase.rpc.log_audit_event({
    p_user_id: userId,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_old_values: oldValues,
    p_new_values: newValues,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
  });

  if (error) throw error;
  return data;
}

// ==========================================
// TRANSACTION FUNCTIONS
// ==========================================

interface TransactionData {
  tx_type: "send" | "receive" | "swap" | "stake" | "unstake";
  symbol: string;
  amount: number;
  amount_usd: number;
  from_address?: string | null;
  to_address?: string | null;
  tx_hash?: string | null;
  fee_amount?: number | null;
  fee_usd?: number | null;
  status?: "pending" | "confirmed" | "failed" | "cancelled";
  notes?: string | null;
}

export async function createTransaction(
  userId: string,
  walletId: string,
  txData: TransactionData,
) {
  const transactionData = {
    user_id: userId,
    wallet_id: walletId,
    ...txData,
    from_address: txData.from_address || null,
    to_address: txData.to_address || null,
    tx_hash: txData.tx_hash || null,
    fee_amount: txData.fee_amount || null,
    fee_usd: txData.fee_usd || null,
    notes: txData.notes || null,
  };

  // Using a type assertion to bypass TypeScript's type checking for the insert operation
  const { data, error } = await (supabase as any)
    .from("transactions")
    .insert([transactionData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// WALLET FUNCTIONS
// ==========================================

export async function createWallet(
  userId: string,
  walletAddress: string,
  walletType: string = "metamask",
  label: string = "Primary Wallet",
) {
  const { data, error } = await supabase
    .from("wallets")
    .insert({
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      wallet_type: walletType as any,
      label,
      is_primary: true,
      balance_usd: 0,
      balance_btc: 0,
      is_active: true,
      connected_at: new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPrimaryWallet(userId: string) {
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is the error code for no rows returned
    throw error;
  }

  return data || null;
}

export async function getUserAssets(userId: string) {
  const { data, error } = await (supabase as any).rpc("get_user_assets", {
    p_user_id: userId,
  });

  if (error) throw error;
  return data || [];
}

export async function getWalletAssets(userId: string): Promise<WalletAssets[]> {
  try {
    // First get all wallets for the user
    const { data: wallets, error: walletsError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId);

    if (walletsError) throw walletsError;
    if (!wallets) return [];

    // For each wallet, get its assets
    const walletsWithAssets = await Promise.all(
      wallets.map(async (wallet: Tables["wallets"]["Row"]) => {
        const { data: assets, error: assetsError } = await supabase
          .from("assets")
          .select("*")
          .eq("wallet_id", wallet.id);

        if (assetsError) throw assetsError;
        return { ...wallet, assets: assets || [] } as WalletAssets;
      }),
    );

    return walletsWithAssets;
  } catch (error) {
    console.error("Error getting wallet assets:", error);
    throw error;
  }
}

export async function createWithdrawalRequest(
  userId: string,
  walletId: string,
  symbol: string,
  amount: number,
  amountUsd: number = 0,
  destinationAddress: string,
  network: string,
  feeAmount: number = 0,
  feeUsd: number = 0,
  flowCompleted: boolean = false,
  skipBalanceCheck: boolean = false,
): Promise<WithdrawalRequests> {
  try {
    const insertData: any = {
      user_id: userId,
      wallet_id: walletId,
      symbol,
      amount,
      amount_usd: amountUsd,
      destination_address: destinationAddress,
      network,
      fee_amount: feeAmount,
      fee_usd: feeUsd,
      status: "pending",
      stage: 1,
      flow_completed: flowCompleted,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add test mode flag if balance check should be skipped (for demo)
    if (skipBalanceCheck) {
      insertData.skip_balance_check = true;
    }

    const { data, error } = await supabase
      .from("withdrawal_requests")
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : (error as any)?.message || JSON.stringify(error);
      console.error("Supabase error creating withdrawal request:", errorMsg);
      throw new Error(errorMsg);
    }
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error creating withdrawal request:", errorMsg);
    throw new Error(`Failed to create withdrawal request: ${errorMsg}`);
  }
}

// ==========================================
// PRICE FUNCTIONS
// ==========================================

export async function insertPriceHistory(
  symbol: string,
  price: number,
  timestamp: string = new Date().toISOString(),
): Promise<PriceHistory[]> {
  try {
    const { data, error } = await supabase
      .from("price_history")
      .insert({
        symbol,
        price_usd: price,
        timestamp,
        source: "api",
      } as never)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error inserting price history:", error);
    throw error;
  }
}

// ==========================================
// MAINTENANCE FUNCTIONS
// ==========================================

export async function updateAssetPrices() {
  const { data, error } = await supabase.rpc.update_asset_prices();
  if (error) throw error;
  return data;
}

export async function checkAndTriggerPriceAlerts() {
  const { data, error } = await supabase.rpc.check_and_trigger_price_alerts();
  if (error) throw error;
  return data;
}

export async function cleanupExpiredSessions() {
  const { data, error } = await supabase.rpc.cleanup_expired_sessions();
  if (error) throw error;
  return data;
}
