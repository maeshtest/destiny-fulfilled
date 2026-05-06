import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
}

async function checkAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return data?.some(r =>
    r.role === "admin" || r.role === "moderator" || r.role === "editor"
  ) ?? false;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false,
  });

  useEffect(() => {
    let cancelled = false;

    // 1. Restore session from storage
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const isAdmin = await checkAdmin(session.user.id);
        if (!cancelled) {
          setState({ user: session.user, session, isLoading: false, isAdmin });
        }
      } else {
        if (!cancelled) {
          setState({ user: null, session: null, isLoading: false, isAdmin: false });
        }
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        const user = session?.user ?? null;
        if (user) {
          // ✅ Keep loading true until admin role is verified
          setState(prev => ({ ...prev, user, session, isLoading: true }));
          checkAdmin(user.id).then(isAdmin => {
            if (!cancelled) {
              setState(prev => ({ ...prev, isAdmin, isLoading: false }));
            }
          });
        } else {
          setState({ user: null, session: null, isLoading: false, isAdmin: false });
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return { ...state, signIn, signOut };
}
