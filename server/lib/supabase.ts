import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/types/database";

function getEnv(name: string) {
  return (typeof process !== "undefined" ? (process as any).env?.[name] : undefined) ?? "";
}

const SUPABASE_URL =
  getEnv("SUPABASE_URL") ||
  getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
  getEnv("VITE_SUPABASE_URL") ||
  "";

const SUPABASE_SERVICE_ROLE_KEY =
  getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
  getEnv("NEXT_SUPABASE_SERVICE_ROLE_KEY") ||
  "";

let _supabase: SupabaseClient<Database> | null = null;

function createRealClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function createNoopClient(): SupabaseClient<Database> {
  // Minimal stub that matches the parts of the API we use server-side
  const noop = {
    from(_table: string) {
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
          return { select: async () => ({ data: null, error: null }) };
        },
        update() {
          return { select: async () => ({ data: null, error: null }) };
        },
        delete() {
          return { then: async () => ({ data: null, error: null }) };
        },
        single: async () => ({ data: null, error: { code: "PGRST116" } }),
      };
      return chain;
    },
    async rpc() {
      return { data: null, error: null } as any;
    },
    auth: {
      async signOut() {
        return { error: null } as any;
      },
      // Admin subset used by auth routes when configured; here we just return predictable placeholders
      admin: {
        async createUser() {
          return {
            data: { user: null },
            error: new Error("Supabase not configured"),
          } as any;
        },
      },
    },
  } as unknown as SupabaseClient<Database>;

  return noop;
}

export function getServerSupabase(): SupabaseClient<Database> {
  if (_supabase) return _supabase;

  const hasValidUrl = SUPABASE_URL && /^https?:\/\//.test(SUPABASE_URL);
  const hasKey = Boolean(SUPABASE_SERVICE_ROLE_KEY);

  if (hasValidUrl && hasKey) {
    _supabase = createRealClient();
    return _supabase;
  }

  console.warn(
    "[server:supabase] Missing SUPABASE env vars. Using a noop Supabase client. Some server features will be disabled.",
  );
  _supabase = createNoopClient();
  return _supabase;
}

export const supabase = getServerSupabase();
