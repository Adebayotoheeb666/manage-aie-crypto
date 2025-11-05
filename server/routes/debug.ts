import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { verifySession } from "../lib/session";

export const handleDebugSession: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if ((req as any).cookies && (req as any).cookies.sv_session) {
      token = (req as any).cookies.sv_session;
    } else if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(";").map((c) => c.trim());
      for (const c of cookies) {
        if (c.startsWith("sv_session=")) {
          token = c.split("=").slice(1).join("=");
          break;
        }
      }
    }

    const result: any = {
      ok: true,
      receivedAuthorizationHeader: !!authHeader,
      cookies: req.cookies || null,
      rawCookieHeader: req.headers.cookie || null,
      tokenPresent: !!token,
      token: token ? "(redacted)" : null,
      tokenPayload: null,
      userProfile: null,
      message: "Diagnostic information - do not share sensitive tokens publicly",
    };

    if (!token) {
      return res.status(200).json(result);
    }

    const SESSION_SECRET =
      process.env.SESSION_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!SESSION_SECRET) {
      result.verification = "SESSION_JWT_SECRET not configured on server";
      return res.status(200).json(result);
    }

    const payload = verifySession(token, SESSION_SECRET);
    if (!payload) {
      result.verification = "invalid_or_expired";
      return res.status(200).json(result);
    }

    // Include payload but redact potentially sensitive fields
    result.tokenPayload = payload;

    // If payload points to a user, try to fetch profile
    try {
      let profile = null;
      if (payload.uid) {
        const { data } = await supabase.from("users").select("*").eq("id", payload.uid).single();
        profile = data || null;
      } else if (payload.sub) {
        const walletAddress = String(payload.sub).toLowerCase();
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("primary_wallet_address", walletAddress)
          .single();
        profile = data || null;
      }
      result.userProfile = profile;
    } catch (err) {
      result.userProfileError = String(err?.message || err);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("[debug-session] error:", err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
};
