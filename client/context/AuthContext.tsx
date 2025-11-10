import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import type { User as DBUser } from "@shared/types/database";
import { toast } from "@/hooks/use-toast";
// Import the supabase client and its types
import { supabase } from "@shared/lib/supabase";
import type { Database } from "@shared/types/database";

type Wallet = Database["public"]["Tables"]["wallets"]["Row"];

// Mock functions for testing in test environment
let mockCreateWallet: any;
let mockGetUserAssets: any;

if (process.env.NODE_ENV === "test") {
  // In test environment, use the mock implementation
  const mockSupabase = await import("@shared/lib/__mocks__/supabase");
  mockCreateWallet = mockSupabase.createWallet;
  mockGetUserAssets = mockSupabase.getUserAssets;
}

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export interface AuthContextType {
  authUser: AuthUser | null;
  dbUser: DBUser | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  connectWallet: (walletAddress: string) => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount, try to restore session from server cookie; fallback to localStorage
  useEffect(() => {
    let mounted = true;

    async function restore() {
      setLoading(true);
      try {
        // Get token from localStorage if available
        let authToken = "";
        try {
          const session = localStorage.getItem("auth_session");
          if (session) {
            const { user } = JSON.parse(session);
            if (user?.token) {
              authToken = user.token;
            }
          }
        } catch (e) {
          console.error("Error parsing auth session:", e);
        }

        // Try server session with auth token if available
        const headers: Record<string, string> = {};
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const resp = await fetch("/api/auth/session", {
          credentials: "include",
          headers,
        });
        if (resp.ok) {
          const data = await resp.json();
          if (mounted && data.user) {
            setAuthUser(data.user);
            setDbUser(data.profile || null);
            try {
              localStorage.setItem(
                "auth_session",
                JSON.stringify({ user: data.user, profile: data.profile }),
              );
            } catch {}
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // ignore network errors and fallback to local storage
        console.debug("Session restore failed:", e);
      }

      // Do NOT restore from localStorage for authentication. It may be stale or lack server-side session.
      // Only rely on the server cookie/session returned from /api/auth/session. If that fails,
      // keep the user unauthenticated and let the app redirect to sign-in/connect flows.

      if (mounted) setLoading(false);
    }

    restore();

    return () => {
      mounted = false;
    };
  }, []);

  async function signUp(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign up failed");
      }

      if (data.user) {
        setAuthUser(data.user);
        setDbUser(data.profile);
        // Store in localStorage
        localStorage.setItem(
          "auth_session",
          JSON.stringify({ user: data.user, profile: data.profile }),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      if (data.user) {
        setAuthUser(data.user);
        setDbUser(data.profile);
        // Persist access token for Authorization fallback (needed in iframe where cookies may be blocked)
        const token = data?.session?.access_token || "";
        const storedUser = token ? { ...data.user, token } : data.user;
        localStorage.setItem(
          "auth_session",
          JSON.stringify({ user: storedUser, profile: data.profile }),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setError(null);
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      setAuthUser(null);
      setDbUser(null);
      localStorage.removeItem("auth_session");
      toast({
        title: "Signed out",
        description: "You have been signed out",
        variant: "default",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign out failed";
      setError(message);
      toast({
        title: "Sign out failed",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  }

  /**
   * Connects a wallet by either authenticating an existing user or creating a new one
   * @param walletAddress The Ethereum address derived from the seed phrase
   */
  async function connectWallet(walletAddress: string) {
    console.log("[connectWallet] Starting wallet connection...");
    setError(null);
    setLoading(true);

    try {
      console.log("[connectWallet] Validating address:", walletAddress);

      // Validate wallet address format
      if (!walletAddress || !ethers.isAddress(walletAddress)) {
        const errorMsg = "Invalid wallet address format";
        console.error("[connectWallet] Invalid wallet address:", walletAddress);
        setError(errorMsg);
        toast({
          title: "Wallet connection failed",
          description: errorMsg,
          variant: "destructive",
        });
        return null;
      }

      // Normalize the address
      const normalized = ethers.getAddress(walletAddress);
      console.log("[connectWallet] Normalized address:", normalized);

      // Attempt to authenticate with the wallet
      const apiUrl = "/api/auth/wallet-connect";
      console.log(
        `[connectWallet] Preparing wallet-connect flow to ${apiUrl}...`,
      );

      // Try to obtain a nonce for signing. If a web3 provider is present, perform
      // signature-based authentication; otherwise fall back to seed-phrase import.
      let nonce: string | null = null;
      try {
        const nonceResp = await fetch(
          `/api/auth/nonce?address=${encodeURIComponent(normalized)}`,
        );
        if (nonceResp.ok) {
          const nonceJson = await nonceResp.json().catch(() => null);
          nonce = nonceJson?.nonce || null;
          console.log("[connectWallet] Received nonce:", nonce);
        } else {
          console.warn(
            "[connectWallet] Failed to fetch nonce, continuing without signature",
          );
        }
      } catch (e) {
        console.warn("[connectWallet] Error fetching nonce:", e);
      }

      // If we have a provider and a nonce, attempt to sign with the user's wallet
      let signature: string | undefined;
      try {
        const anyWin: any = window as any;
        if (nonce && anyWin?.ethereum) {
          try {
            // Request account access if needed
            await anyWin.ethereum.request?.({ method: "eth_requestAccounts" });
            // Use ethers BrowserProvider to get signer
            const provider = new (ethers as any).BrowserProvider(
              anyWin.ethereum,
            );
            const signer = await provider.getSigner();
            signature = await signer.signMessage(nonce);
            console.log("[connectWallet] Obtained signature from provider");
          } catch (signErr) {
            console.warn(
              "[connectWallet] Provider signing failed, continuing without signature",
              signErr,
            );
            signature = undefined;
          }
        }
      } catch (e) {
        console.warn("[connectWallet] Error during provider signing:", e);
      }

      const requestBodyObj: any = { walletAddress: normalized };
      if (signature && nonce) {
        requestBodyObj.signature = signature;
        requestBodyObj.nonce = nonce;
      }

      const requestBody = JSON.stringify(requestBodyObj);
      console.log("[connectWallet] Request body:", requestBody);

      let response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: requestBody,
          credentials: "include",
        });
        console.log(
          "[connectWallet] Request completed, status:",
          response.status,
        );
      } catch (fetchError) {
        console.error("[connectWallet] Fetch error:", fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }

      let data;
      try {
        const responseText = await response.text();
        console.log("[connectWallet] Raw response:", responseText);
        data = responseText ? JSON.parse(responseText) : null;
        console.log("[connectWallet] Parsed response data:", data);
      } catch (parseErr) {
        const errorMsg = `Server error (${response.status}): Invalid response format`;
        console.error("[connectWallet] Parse error:", parseErr);
        setError(errorMsg);
        toast({
          title: "Connection Error",
          description: errorMsg,
          variant: "destructive",
        });
        return null;
      }

      if (!response.ok) {
        const errorMsg =
          data?.error || `Server responded with status ${response.status}`;
        console.error("[connectWallet] Server error:", errorMsg);
        setError(errorMsg);
        toast({
          title: "Connection Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return null;
      }

      if (!data?.user) {
        const errorMsg = "No user data received from server";
        console.error("[connectWallet] No user data:", data);
        setError(errorMsg);
        toast({
          title: "Connection Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return null;
      }

      // Determine whether server created an official session. If the wallet-connect
      // response included a session object, verify it server-side. Otherwise accept the
      // returned user/profile (this occurs when SESSION_JWT_SECRET is not configured
      // and the server purposely returns user data without setting a cookie).
      try {
        if (data.session) {
          const sessionResp = await fetch("/api/auth/session", {
            credentials: "include",
          });

          if (!sessionResp.ok) {
            // If server did not set cookie/session, surface diagnostic info but do not
            // treat this as a hard failure when the /api/auth/wallet-connect call already
            // returned a valid user (server may be intentionally running without a
            // session secret in preview/dev environments).
            console.error(
              "[connectWallet] Server session verification failed, status:",
              sessionResp.status,
            );

            const errData = await sessionResp.json().catch(() => null);
            const message =
              errData?.error ||
              "Server session not established. Ensure cookies are enabled and site is served over HTTPS.";

            // Attempt to fetch debug info to help diagnose cookie/session issues
            try {
              const debugResp = await fetch("/api/debug/session", {
                credentials: "include",
              });
              const debugJson = await debugResp.json().catch(() => null);
              console.debug("[connectWallet] /api/debug/session:", debugJson);
              if (debugJson && debugJson.verification) {
                console.warn(
                  "[connectWallet] Session verification:",
                  debugJson.verification,
                );
              }
            } catch (debugErr) {
              console.warn(
                "[connectWallet] Failed to fetch debug session info",
                debugErr,
              );
            }

            setError(message);
            toast({
              title: "Connection Failed",
              description: message,
              variant: "destructive",
            });
            return null;
          }

          const sessionData = await sessionResp.json();
          if (!sessionData?.user) {
            const message = "Server session returned no user";
            setError(message);
            toast({
              title: "Connection Failed",
              description: message,
              variant: "destructive",
            });
            return null;
          }

          // Update auth state from authoritative server session
          setAuthUser(sessionData.user);
          setDbUser(sessionData.profile || data.profile || null);

          // Store in localStorage for quick restore (not used as primary auth source)
          try {
            localStorage.setItem(
              "auth_session",
              JSON.stringify({
                user: sessionData.user,
                profile: sessionData.profile || data.profile,
              }),
            );
          } catch {}
        } else {
          // No server session was established but the wallet-connect endpoint returned
          // a valid user/profile. Accept that response as authentication in preview/dev
          // environments where a session secret isn't configured.
          setAuthUser(data.user);
          setDbUser(data.profile || null);

          try {
            localStorage.setItem(
              "auth_session",
              JSON.stringify({
                user: data.user,
                profile: data.profile || null,
              }),
            );
          } catch {}
        }
      } catch (err) {
        console.error("[connectWallet] Failed to verify server session", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to verify server session";
        setError(message);
        toast({
          title: "Connection Failed",
          description: message,
        });
        return null;
      }

      // Check if wallet exists and update last connected time
      try {
        if (data.profile?.id) {
          console.log("[connectWallet] Checking for existing wallet...");
          const { data: existingWallets, error: walletError } = await supabase
            .from("wallets")
            .select("*")
            .eq("wallet_address", normalized.toLowerCase())
            .eq("user_id", data.profile.id);

          if (walletError) throw walletError;

          if (existingWallets && existingWallets.length > 0) {
            console.log(
              "[connectWallet] Wallet exists, updating last connected time...",
            );
            // Update last connected time with proper type
            const updateData = {
              is_active: true,
              connected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as const;

            const { error: updateError } = await supabase
              .from("wallets")
              .update(updateData)
              .eq("wallet_address", normalized.toLowerCase())
              .eq("user_id", data.profile.id);

            if (updateError) throw updateError;
          } else {
            console.log("[connectWallet] Creating new wallet...");
            // Only create if it doesn't exist
            await createWallet(
              data.profile.id,
              normalized,
              "metamask",
              "Primary Wallet",
            );
          }
        }
      } catch (walletErr) {
        console.warn("[connectWallet] Wallet operation failed:", walletErr);
        // Don't fail the entire process if wallet operation fails
      }

      console.log("[connectWallet] Wallet connection successful");

      // Show success message
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully!",
        variant: "default",
      });

      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Wallet connection failed";
      setError(message);
      toast({
        title: "Wallet connection",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const value: AuthContextType = {
    authUser,
    dbUser,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    connectWallet,
    isAuthenticated: !!authUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
