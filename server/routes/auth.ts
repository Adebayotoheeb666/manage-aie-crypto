import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
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
  const { session } = req.body;

  if (!session || !session.access_token) {
    return res.status(400).json({ error: "Session is required" });
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

export const handleWalletConnect: RequestHandler = async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Generate a unique email based on wallet address
    const walletEmail = `wallet-${walletAddress.toLowerCase()}@wallet.local`;

    // Try to sign up first
    let { data: signUpData, error: signUpError } =
      await supabase.auth.admin.createUser({
        email: walletEmail,
        password: walletAddress,
        email_confirm: true,
      });

    // If user already exists, sign in instead
    if (signUpError && signUpError.message.includes("already registered")) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: walletEmail,
          password: walletAddress,
        });

      if (signInError) {
        return res.status(401).json({ error: signInError.message });
      }

      if (signInData.session && signInData.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", signInData.user.id)
          .single();

        return res.status(200).json({
          session: signInData.session,
          user: signInData.user,
          profile: profile || null,
          isNewWallet: false,
        });
      }
    } else if (signUpError) {
      return res.status(400).json({ error: signUpError.message });
    }

    if (signUpData && signUpData.user) {
      // Create user profile
      const { data: profile } = await supabase
        .from("users")
        .insert({
          auth_id: signUpData.user.id,
          email: walletEmail,
        })
        .select()
        .single();

      return res.status(200).json({
        user: signUpData.user,
        profile: profile || null,
        isNewWallet: true,
      });
    }

    return res.status(500).json({ error: "Failed to connect wallet" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Wallet connection failed";
    return res.status(500).json({ error: message });
  }
};

export const handleGetSession: RequestHandler = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No session token provided" });
  }

  const token = authHeader.slice(7);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    if (data.user) {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", data.user.id)
        .single();

      return res.status(200).json({
        user: data.user,
        profile: profile || null,
      });
    }

    return res.status(401).json({ error: "No user found" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get session";
    return res.status(500).json({ error: message });
  }
};
