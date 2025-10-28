import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

export const handleSupabaseHealth: RequestHandler = async (_req, res) => {
  const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !/^https?:\/\//.test(SUPABASE_URL)) {
    return res
      .status(500)
      .json({ ok: false, error: "SUPABASE_URL missing or invalid" });
  }
  if (!SUPABASE_KEY) {
    return res.status(500).json({ ok: false, error: "SUPABASE key missing" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Lightweight check: try selecting 1 row from users (if exists)
    const { data, error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      // If table doesn't exist or permission denied, return that info
      return res
        .status(500)
        .json({ ok: false, error: error.message, details: error });
    }

    return res
      .status(200)
      .json({ ok: true, message: "Connected to Supabase", sample: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ ok: false, error: message });
  }
};
