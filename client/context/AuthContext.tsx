import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@shared/lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import type { User as DBUser } from '@shared/types/database';

interface AuthContextType {
  authUser: AuthUser | null;
  dbUser: DBUser | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user && isMounted) {
          setAuthUser(session.user);

          // Fetch user profile from database
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          if (profile) {
            setDbUser(profile);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Auth check failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          if (session?.user) {
            setAuthUser(session.user);

            // Fetch or create user profile
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', session.user.id)
              .single();

            if (profile) {
              setDbUser(profile);
            } else {
              // Create profile if doesn't exist
              const { data: newProfile } = await supabase
                .from('users')
                .insert({
                  auth_id: session.user.id,
                  email: session.user.email || '',
                })
                .select()
                .single();

              if (newProfile) {
                setDbUser(newProfile);
              }
            }
          } else {
            setAuthUser(null);
            setDbUser(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setAuthUser(data.user);

        // Create user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert({
            auth_id: data.user.id,
            email,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        if (profile) setDbUser(profile);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        setAuthUser(data.user);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        if (profile) setDbUser(profile);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      setAuthUser(null);
      setDbUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
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
    isAuthenticated: !!authUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
