import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const handleSignUp: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (data.user) {
      // Create user profile in database
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .insert({
          auth_id: data.user.id,
          email,
        })
        .select()
        .single();

      if (profileError) {
        return res.status(500).json({ error: profileError.message });
      }

      return res.status(200).json({
        user: data.user,
        profile,
        message: "User created successfully",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign up failed";
    return res.status(500).json({ error: message });
  }
};

export const handleSignIn: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    if (data.session) {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", data.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        return res.status(500).json({ error: profileError.message });
      }

      return res.status(200).json({
        session: data.session,
        user: data.user,
        profile: profile || null,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    return res.status(500).json({ error: message });
  }
};

export const handleSignOut: RequestHandler = async (req, res) => {
  // If client stored sv_session cookie, clear it
  try {
    // Attempt to clear cookie via Set-Cookie
    res.cookie("sv_session", "", { httpOnly: true, maxAge: 0, path: "/" });
  } catch (e) {
    // ignore
  }

  const { session } = req.body || {};

  // If no session provided, just return success after clearing cookie
  if (!session || !session.access_token) {
    return res.status(200).json({ message: "Signed out successfully" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
      auth: { persistSession: false },
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Signed out successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign out failed";
    return res.status(500).json({ error: message });
  }
};

import {
  createNonceForAddress,
  getNonceForAddress,
  consumeNonceForAddress,
} from "../lib/nonce";
import { ethers } from "ethers";

export function createNonceForAddressProxy(address: string) {
  return createNonceForAddress(address);
}

export const handleGetNonce: RequestHandler = async (req, res) => {
  const address = String(req.query.address || "");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: "Valid wallet address is required" });
  }
  const nonce = createNonceForAddress(address);
  return res.status(200).json({ nonce });
};

export const handleWalletConnect: RequestHandler = async (req, res) => {
  const walletAddressRaw =
    req.body?.walletAddress || req.body?.wallet_address || "";
  const signature = String(req.body?.signature || "");
  const nonce = String(req.body?.nonce || "");

  // Basic logging for debugging (avoid logging full PII in production)
  const remoteIp = (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown"
  ).toString();
  console.info(
    `[wallet-connect] request from ${remoteIp}, payload: ${String(walletAddressRaw).slice(0, 64)}`,
  );

  if (!walletAddressRaw) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  const walletAddress = String(walletAddressRaw).trim();

  // Validate Ethereum address format (strict)
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    console.warn(`[wallet-connect] invalid address format: ${walletAddress}`);
    return res.status(400).json({ error: "Valid wallet address is required" });
  }

  // Signature and nonce are optional (only required for web3 provider flow)
  // If both are provided, verify the signature (web3 provider flow)
  // If both are missing, skip verification (seed phrase import flow)
  const hasSignature = signature && nonce;

  try {
    if (hasSignature) {
      // verify signature (web3 provider flow: MetaMask/WalletConnect)
      const expectedNonce = getNonceForAddress(walletAddress);
      if (!expectedNonce || expectedNonce !== nonce) {
        return res.status(400).json({ error: "Invalid or expired nonce" });
      }

      const recovered = ethers.verifyMessage(nonce, signature);
      if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        console.warn(
          `[wallet-connect] signature mismatch for ${walletAddress}`,
        );
        return res.status(401).json({ error: "Signature verification failed" });
      }

      // consume the nonce
      const consumed = consumeNonceForAddress(walletAddress, nonce);
      if (!consumed) {
        return res.status(400).json({ error: "Invalid or expired nonce" });
      }
    } else {
      // No signature provided - this is a seed phrase import
      // The user has already proven control by providing the seed phrase
      console.info(`[wallet-connect] seed phrase import for ${walletAddress}`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Ensure user profile exists in users table. Use auth_id = walletAddress
    const { data: existing, error: existingErr } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", walletAddress)
      .single();

    let profile = existing || null;

    // Handle the case where no user exists (PGRST116 is expected for no rows)
    if (existingErr && existingErr.code !== "PGRST116") {
      console.error(
        "[wallet-connect] failed to check user profile",
        existingErr.message,
      );
      return res
        .status(500)
        .json({
          error: "Failed to check user profile: " + existingErr.message,
        });
    }

    if (!profile) {
      const walletEmail = `wallet-${walletAddress.toLowerCase()}@wallet.local`;
      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert({ auth_id: walletAddress, email: walletEmail })
        .select()
        .single();

      if (insertErr) {
        console.error(
          "[wallet-connect] failed to create user profile",
          insertErr.message,
        );
        return res
          .status(500)
          .json({
            error: "Failed to create user profile: " + insertErr.message,
          });
      }
      profile = inserted;
    }

    // Create app session token (signed JWT) and set as httpOnly cookie
    try {
      const SESSION_SECRET =
        process.env.SESSION_JWT_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "";
      if (!SESSION_SECRET) {
        console.warn(
          "SESSION_JWT_SECRET not configured; returning without session cookie",
        );
        return res.status(200).json({
          user: { id: walletAddress },
          profile,
          isNewWallet: !existing,
        });
      }

      const { signSession } = require("../lib/session");
      const token = signSession(
        { sub: walletAddress, uid: profile.id },
        SESSION_SECRET,
        60 * 60 * 2,
      );

      // Set cookie
      res.cookie("sv_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 2,
        path: "/",
      });

      return res
        .status(200)
        .json({ user: { id: walletAddress }, profile, isNewWallet: !existing });
    } catch (err) {
      console.error("[wallet-connect] session creation failed", err);
      // fallback to returning user without cookie
      return res
        .status(200)
        .json({ user: { id: walletAddress }, profile, isNewWallet: !existing });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Wallet connection failed";
    console.error(`[wallet-connect] error: ${message}`);
    return res.status(500).json({ error: message });
  }
};

export const handleGetSession: RequestHandler = async (req, res) => {
  // Support Bearer Authorization or sv_session cookie
  const authHeader = req.headers.authorization;
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

  if (!token) {
    return res.status(401).json({ error: "No session token provided" });
  }

  try {
    const { verifySession } = require("../lib/session");
    const SESSION_SECRET =
      process.env.SESSION_JWT_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";
    if (!SESSION_SECRET)
      return res.status(401).json({ error: "Session secret not configured" });

    const payload = verifySession(token, SESSION_SECRET);
    if (!payload || !payload.sub)
      return res.status(401).json({ error: "Invalid session" });

    const walletAddress = payload.sub;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", walletAddress)
      .single();

    if (profileErr && profileErr.code !== "PGRST116") {
      return res.status(500).json({ error: profileErr.message });
    }

    return res
      .status(200)
      .json({ user: { id: walletAddress }, profile: profile || null });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get session";
    return res.status(500).json({ error: message });
  }
};
