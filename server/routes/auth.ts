import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { signSession, verifySession } from "../lib/session";

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

      // Create app session token (signed JWT) and set as httpOnly cookie
      try {
        const SESSION_SECRET =
          process.env.SESSION_JWT_SECRET ||
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          "";
        console.log(
          "Using SESSION_SECRET for signing:",
          SESSION_SECRET ? "***" : "NOT SET",
        );
        if (!SESSION_SECRET) {
          return res.status(200).json({
            session: data.session,
            user: data.user,
            profile: profile || null,
          });
        }

        const token = signSession(
          { sub: data.user.id, uid: profile?.id },
          SESSION_SECRET,
          60 * 60 * 2,
        );

        // Set httpOnly session cookie
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          maxAge: 1000 * 60 * 60 * 2,
          path: "/",
        };
        res.cookie("sv_session", token, cookieOptions);
        // Also set a non-httpOnly debug cookie to help clients detect whether the
        // browser accepted cookies (useful in debug/preview environments).
        // This is safe because it only indicates presence; do NOT store secrets here.
        try {
          res.cookie("sv_session_set", "1", {
            httpOnly: false,
            secure: cookieOptions.secure,
            sameSite: "lax" as const,
            maxAge: cookieOptions.maxAge,
            path: cookieOptions.path,
          });
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error("[sign-in] session creation failed", err);
        // Continue without cookie if session creation fails
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
    // Attempt to clear cookies via Set-Cookie
    res.cookie("sv_session", "", { httpOnly: true, maxAge: 0, path: "/" });
    try {
      res.cookie("sv_session_set", "", {
        httpOnly: false,
        maxAge: 0,
        path: "/",
      });
    } catch (e) {}
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
  // Extract wallet address from request body
  // Extract and normalize request body (handle string payloads on some hosts)
  let body: any = req.body as any;

  // Debug logging to understand body format
  console.info("[wallet-connect] Raw req.body type:", typeof body);
  console.info(
    "[wallet-connect] Raw req.body:",
    typeof body === "string"
      ? body.substring(0, 100)
      : body
        ? JSON.stringify(body).substring(0, 100)
        : "null/undefined",
  );

  try {
    if (typeof body === "string") {
      console.info("[wallet-connect] Attempting to parse body as string");
      body = JSON.parse(body);
      console.info("[wallet-connect] Successfully parsed body as JSON");
    }
  } catch (parseErr) {
    console.error("[wallet-connect] Failed to parse body as JSON:", parseErr);
  }

  const walletAddressRaw =
    body?.walletAddress ||
    body?.wallet_address ||
    (req.query as any)?.walletAddress ||
    (req.query as any)?.wallet_address ||
    req.headers["x-wallet-address"] ||
    "";

  // Basic request diagnostics
  try {
    console.info("[wallet-connect] Headers:", {
      origin: req.headers.origin || null,
      referer: req.headers.referer || null,
      userAgent: req.headers["user-agent"] || null,
      contentLength: req.headers["content-length"] || null,
      cookiePresent: !!req.headers.cookie,
    });
  } catch (hdrErr) {
    console.warn("[wallet-connect] Failed to log headers", hdrErr);
  }

  console.info(
    "[wallet-connect] Extracted walletAddressRaw:",
    walletAddressRaw ? walletAddressRaw.substring(0, 20) + "..." : "empty",
  );

  if (!walletAddressRaw) {
    console.error("[wallet-connect] No wallet address found in:", {
      bodyWalletAddress: body?.walletAddress ? "present" : "missing",
      bodyWalletAddressSnake: body?.wallet_address ? "present" : "missing",
      queryWalletAddress: (req.query as any)?.walletAddress
        ? "present"
        : "missing",
      headerXWalletAddress: req.headers["x-wallet-address"]
        ? "present"
        : "missing",
    });
    return res.status(400).json({
      error: "Wallet address is required",
    });
  }

  const walletAddress = String(walletAddressRaw).trim();
  const signature = body?.signature ? String(body.signature) : "";
  const nonce = body?.nonce ? String(body.nonce) : "";

  // Basic logging for debugging (avoid logging full PII in production)
  const remoteIp = (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown"
  ).toString();
  console.info(
    `[wallet-connect] request from ${remoteIp}, payload: ${String(walletAddress).slice(0, 64)}`,
  );

  // Validate Ethereum address format (strict)
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    console.warn(`[wallet-connect] invalid address format: ${walletAddress}`);
    return res.status(400).json({ error: "Valid wallet address is required" });
  }

  // Signature and nonce are optional (only required for web3 provider flow)
  // If both are provided, verify the signature (web3 provider flow)
  // If both are missing, skip verification (seed phrase import flow)
  const hasSignature = signature && nonce;
  console.info(
    "[wallet-connect] hasSignature:",
    !!hasSignature,
    "signatureLength:",
    signature?.length || 0,
    "nonceLength:",
    nonce?.length || 0,
  );

  try {
    if (hasSignature) {
      // verify signature (web3 provider flow: MetaMask/WalletConnect)
      const expectedNonce = getNonceForAddress(walletAddress);
      console.info(
        "[wallet-connect] expectedNonce:",
        expectedNonce,
        "providedNonce:",
        nonce,
      );
      if (!expectedNonce || expectedNonce !== nonce) {
        console.warn("[wallet-connect] nonce mismatch or expired", {
          expected: expectedNonce,
          provided: nonce,
        });
        return res.status(400).json({ error: "Invalid or expired nonce" });
      }

      let recovered: string;
      try {
        recovered = ethers.verifyMessage(nonce, signature);
        console.info(
          "[wallet-connect] signature recovered address:",
          recovered,
        );
      } catch (sigErr) {
        console.error(
          "[wallet-connect] signature verification error:",
          sigErr?.message || sigErr,
        );
        return res.status(401).json({ error: "Signature verification failed" });
      }

      if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        console.warn(
          `[wallet-connect] signature mismatch for ${walletAddress}`,
          { recovered },
        );
        return res.status(401).json({ error: "Signature verification failed" });
      }

      // consume the nonce
      const consumed = consumeNonceForAddress(walletAddress, nonce);
      console.info("[wallet-connect] nonce consumed:", !!consumed);
      if (!consumed) {
        console.warn("[wallet-connect] failed to consume nonce", {
          walletAddress,
          nonce,
        });
        return res.status(400).json({ error: "Invalid or expired nonce" });
      }
    } else {
      // No signature provided - this is a seed phrase import
      // The user has already proven control by providing the seed phrase
      console.info(`[wallet-connect] seed phrase import for ${walletAddress}`);
    }

    // Diagnostic: Log Supabase credentials
    console.info("[wallet-connect] SUPABASE_URL:", SUPABASE_URL);
    console.info(
      "[wallet-connect] SUPABASE_KEY:",
      SUPABASE_KEY ? `[set - ${SUPABASE_KEY.substring(0, 20)}...]` : "[empty]",
    );
    console.info(
      "[wallet-connect] Using key type:",
      SUPABASE_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "SERVICE_ROLE"
        : SUPABASE_KEY === process.env.VITE_SUPABASE_ANON_KEY
          ? "ANON"
          : "OTHER",
    );

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("[wallet-connect] Supabase credentials missing");
      return res.status(500).json({ error: "Supabase credentials missing" });
    }

    let supabase;
    try {
      console.info("[wallet-connect] Creating Supabase client...");
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
      });
      console.info("[wallet-connect] Supabase client created successfully");
    } catch (err) {
      console.error("[wallet-connect] Supabase client creation failed", {
        message: err?.message || err,
        stack: err?.stack,
      });
      return res.status(500).json({
        error:
          "Supabase client creation failed: " + (err.message || String(err)),
      });
    }
    // Ensure user profile exists in users table. Use primary_wallet_address for wallet users
    let existing, existingErr;
    try {
      const result = await supabase
        .from("users")
        .select("*")
        .eq("primary_wallet_address", walletAddress.toLowerCase())
        .single();
      existing = result.data;
      existingErr = result.error;
    } catch (err) {
      console.error("[wallet-connect] Supabase fetch failed - raw error:", err);
      console.error("[wallet-connect] Error name:", err?.name);
      console.error("[wallet-connect] Error message:", err?.message);
      console.error("[wallet-connect] Error cause:", err?.cause);
      console.error("[wallet-connect] Error stack:", err?.stack);
      return res.status(500).json({
        error: "Supabase fetch failed: " + (err?.message || err),
        details: {
          name: err?.name,
          cause: err?.cause?.message || err?.cause,
        },
      });
    }
    let profile = existing || null;

    // Handle the case where no user exists (PGRST116 is expected for no rows)
    if (existingErr && existingErr.code !== "PGRST116") {
      console.error(
        "[wallet-connect] failed to check user profile",
        existingErr.message,
      );
      return res.status(500).json({
        error: "Failed to check user profile: " + existingErr.message,
      });
    }

    if (!profile) {
      const walletEmail = `wallet-${walletAddress.toLowerCase()}@wallet.local`;
      console.info(
        "[wallet-connect] Creating user profile with email:",
        walletEmail,
      );
      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert({
          primary_wallet_address: walletAddress.toLowerCase(),
          email: walletEmail,
          account_status: "active",
          is_verified: true, // Wallet users are verified by controlling the wallet
        })
        .select()
        .single();

      if (insertErr) {
        console.error("[wallet-connect] failed to create user profile", {
          message: insertErr.message,
          details: insertErr.details || null,
        });
        return res.status(500).json({
          error: "Failed to create user profile: " + insertErr.message,
        });
      }
      profile = inserted;
      console.info("[wallet-connect] Created user profile:", {
        id: profile.id,
      });

      // Create a wallet record for the user
      try {
        console.info(
          "[wallet-connect] Inserting wallet record for user:",
          profile.id,
        );
        const { data: wallet, error: walletError } = await supabase
          .from("wallets")
          .insert({
            user_id: profile.id,
            wallet_address: walletAddress.toLowerCase(),
            wallet_type: "metamask",
            label: "Primary Wallet",
            is_primary: true,
            balance_usd: 0,
            balance_btc: 0,
            is_active: true,
            connected_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (walletError) {
          console.error("[wallet-connect] Failed to create wallet:", {
            message: walletError.message,
            details: walletError.details || null,
          });
          // Continue anyway as the user is already created
        } else {
          console.log("[wallet-connect] Created wallet:", wallet.id);

          // Initialize default assets for the wallet
          const defaultAssets = [
            {
              wallet_id: wallet.id,
              user_id: profile.id,
              symbol: "ETH",
              name: "Ethereum",
              balance: 0,
              balance_usd: 0,
              price_usd: 0,
              price_change_24h: 0,
              chain: "ethereum",
              contract_address: null,
            },
            {
              wallet_id: wallet.id,
              user_id: profile.id,
              symbol: "BTC",
              name: "Bitcoin",
              balance: 0,
              balance_usd: 0,
              price_usd: 0,
              price_change_24h: 0,
              chain: "bitcoin",
              contract_address: null,
            },
            {
              wallet_id: wallet.id,
              user_id: profile.id,
              symbol: "USDT",
              name: "Tether",
              balance: 0,
              balance_usd: 0,
              price_usd: 1,
              price_change_24h: 0,
              chain: "ethereum",
              contract_address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
            },
          ];

          console.info(
            "[wallet-connect] Inserting default assets for wallet:",
            wallet.id,
          );
          const { error: assetsError } = await supabase
            .from("assets")
            .insert(defaultAssets);

          if (assetsError) {
            console.error(
              "[wallet-connect] Failed to initialize default assets:",
              assetsError,
            );
          } else {
            console.log(
              "[wallet-connect] Initialized default assets for wallet:",
              wallet.id,
            );
          }
        }
      } catch (walletErr) {
        console.error(
          "[wallet-connect] Error in wallet/asset initialization:",
          {
            message: walletErr?.message || walletErr,
            stack: walletErr?.stack || null,
          },
        );
        // Continue with the response even if wallet/asset initialization fails
      }
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
          user: { id: profile.id, address: walletAddress },
          profile,
          isNewWallet: !existing,
        });
      }

      // Import signSession at the top of the file is already done
      const token = signSession(
        { sub: walletAddress, uid: profile.id },
        SESSION_SECRET,
        60 * 60 * 2,
      );

      // Set httpOnly session cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 1000 * 60 * 60 * 2,
        path: "/",
      };
      res.cookie("sv_session", token, cookieOptions);
      // Non-httpOnly flag cookie to detect if browser stored cookies
      try {
        res.cookie("sv_session_set", "1", {
          httpOnly: false,
          secure: cookieOptions.secure,
          sameSite: "strict" as const,
          maxAge: cookieOptions.maxAge,
          path: cookieOptions.path,
        });
      } catch (e) {}

      return res.status(200).json({
        user: { id: profile.id, address: walletAddress },
        profile,
        isNewWallet: !existing,
      });
    } catch (err) {
      console.error("[wallet-connect] session creation failed", err);
      // fallback to returning user without cookie
      return res.status(200).json({
        user: { id: profile.id, address: walletAddress },
        profile,
        isNewWallet: !existing,
      });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Wallet connection failed";
    console.error(`[wallet-connect] error: ${message}`);
    return res.status(500).json({ error: message });
  }
};

export const handleGetSession: RequestHandler = async (req, res) => {
  try {
    const SESSION_SECRET =
      process.env.SESSION_JWT_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    // Try cookie-based server session first (sv_session)
    const cookieToken = (req as any).cookies?.sv_session;
    if (cookieToken && SESSION_SECRET) {
      const payload = verifySession(cookieToken, SESSION_SECRET);
      if (payload) {
        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: false },
        });

        // If uid is present, this is an email/password session
        if (payload.uid) {
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", payload.uid)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error(
              "Error getting user profile (cookie session):",
              profileError,
            );
            return res
              .status(500)
              .json({ error: "Error fetching user profile" });
          }

          return res.json({
            user: { id: payload.sub },
            profile: profile || null,
          });
        }

        // Wallet-based session (sub contains wallet address)
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("primary_wallet_address", String(payload.sub).toLowerCase())
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error(
            "Error getting user profile (cookie session):",
            profileError,
          );
          return res.status(500).json({ error: "Error fetching user profile" });
        }

        return res.json({
          user: { id: payload.sub },
          profile: profile || null,
        });
      }
    }

    // Fallback to Authorization: Bearer <token> (Supabase access token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Error verifying token with Supabase:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error getting user profile:", profileError);
      return res.status(500).json({ error: "Error fetching user profile" });
    }

    return res.json({ user, profile: profile || null });
  } catch (err) {
    console.error("Error in handleGetSession:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
