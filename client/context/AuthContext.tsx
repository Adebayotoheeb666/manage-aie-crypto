import React, { createContext, useContext, useEffect, useState } from "react";
import type { User as DBUser } from "@shared/types/database";
import { toast } from "@/hooks/use-toast";
import { ethers } from "ethers";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // Try server session (cookie-based). Include credentials to ensure cookies are sent.
        const resp = await fetch("/api/auth/session", {
          credentials: "include",
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

      // Fallback: localStorage
      try {
        const stored = localStorage.getItem("auth_session");
        if (stored) {
          const { user, profile } = JSON.parse(stored);
          if (mounted) {
            setAuthUser(user);
            setDbUser(profile);
          }
        }
      } catch {
        localStorage.removeItem("auth_session");
      }

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
        // Store in localStorage
        localStorage.setItem(
          "auth_session",
          JSON.stringify({ user: data.user, profile: data.profile }),
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

  async function connectWallet(walletAddress: string) {
    setError(null);
    setLoading(true);
    try {
      if (!walletAddress) {
        const msg = "Wallet address is required";
        setError(msg);
        toast({
          title: "Wallet connection",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }

      // Normalize wallet address: extract a 0x + 40 hex char substring
      const match = String(walletAddress).match(/0x[a-fA-F0-9]{40}/i);
      if (!match) {
        const msg = "Invalid wallet address";
        setError(msg);
        toast({
          title: "Wallet connection",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }

      const normalized = match[0].toLowerCase();

      // Try to sign with a web3 provider (MetaMask/WalletConnect)
      // If not available, skip signing (for seed phrase imports)
      const win = window as any;
      let signature: string | undefined;
      let nonce: string | undefined;

      if (win.ethereum) {
        // Web3 provider available (MetaMask/WalletConnect flow)
        try {
          // Request a nonce from the server
          const nonceResp = await fetch(
            `/api/auth/nonce?address=${normalized}`,
          );
          const nonceData = await nonceResp.json();
          if (!nonceResp.ok) {
            const msg = nonceData?.error || "Could not obtain nonce";
            setError(msg);
            toast({
              title: "Wallet connection",
              description: msg,
              variant: "destructive",
            });
            throw new Error(msg);
          }

          nonce = String(nonceData.nonce || "");
          if (!nonce) {
            const msg = "Invalid nonce received from server";
            setError(msg);
            toast({
              title: "Wallet connection",
              description: msg,
              variant: "destructive",
            });
            throw new Error(msg);
          }

          const provider = new ethers.BrowserProvider(win.ethereum);
          // prompt user to connect accounts if needed
          await provider.send("eth_requestAccounts", []);
          const signer = await provider.getSigner();
          const signerAddress = await signer.getAddress();

          if (signerAddress.toLowerCase() !== normalized) {
            const msg =
              "Connected wallet address does not match requested address";
            setError(msg);
            toast({
              title: "Wallet connection",
              description: msg,
              variant: "destructive",
            });
            throw new Error(msg);
          }

          // Sign the nonce
          signature = await signer.signMessage(nonce);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to sign with web3 provider";
          setError(message);
          toast({
            title: "Wallet connection",
            description: message,
            variant: "destructive",
          });
          throw err;
        }
      }

      // Send wallet connection to server
      const response = await fetch("/api/auth/wallet-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: normalized,
          signature,
          nonce,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        const msg = `Server error (${response.status}): Unable to parse response`;
        setError(msg);
        toast({
          title: "Wallet connection",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }

      if (!response.ok) {
        const msg = data?.error || "Wallet connection failed";
        setError(msg);
        toast({
          title: "Wallet connection",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }

      if (data.user) {
        setAuthUser(data.user);
        setDbUser(data.profile);
        // Store in localStorage
        localStorage.setItem(
          "auth_session",
          JSON.stringify({ user: data.user, profile: data.profile }),
        );
        toast({
          title: "Wallet connected",
          description: "Your wallet was connected successfully",
          variant: "default",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Wallet connection failed";
      setError(message);
      // show toast for unexpected errors as well
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
