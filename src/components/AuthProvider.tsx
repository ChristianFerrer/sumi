"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** true cuando el usuario llego desde el enlace de recuperar contraseña. */
  recovering: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event, session: Session | null) => {
        setUser(session?.user ?? null);
        if (event === "PASSWORD_RECOVERY") setRecovering(true);
        if (event === "SIGNED_OUT") setRecovering(false);
      },
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => {
    const notConfigured: AuthResult = {
      error: "La autenticacion no esta configurada.",
    };
    return {
      user,
      loading,
      recovering,
      configured: supabase !== null,
      async signIn(email, password) {
        if (!supabase) return notConfigured;
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message ?? null };
      },
      async signUp(email, password, name) {
        if (!supabase) return notConfigured;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: name ? { name } : undefined },
        });
        return { error: error?.message ?? null };
      },
      async signInWithGoogle() {
        if (!supabase) return notConfigured;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        return { error: error?.message ?? null };
      },
      async resetPassword(email) {
        if (!supabase) return notConfigured;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/cuenta`,
        });
        return { error: error?.message ?? null };
      },
      async updatePassword(password) {
        if (!supabase) return notConfigured;
        const { error } = await supabase.auth.updateUser({ password });
        if (!error) setRecovering(false);
        return { error: error?.message ?? null };
      },
      async signOut() {
        await supabase?.auth.signOut();
      },
    };
  }, [supabase, user, loading, recovering]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
