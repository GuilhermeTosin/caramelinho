import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { getProfileById } from "@/services/profiles";
import { getUnreadCount } from "@/services/messages";
import type { UserFrontend, AuthSessionFrontend } from "@/types/database";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: AuthSessionFrontend | null;
  user: UserFrontend | null;
  isLoading: boolean;
  unreadMessages: number;
  refreshSession: () => void;
  refreshUnread: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionFrontend | null>(null);
  const [user, setUser] = useState<UserFrontend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const buildSession = useCallback(
    (supaSession: Session | null): AuthSessionFrontend | null => {
      if (!supaSession?.user) return null;
      return {
        userId: supaSession.user.id,
        email: supaSession.user.email || "",
        name: supaSession.user.user_metadata?.name || supaSession.user.email?.split("@")[0] || "Usuário",
      };
    },
    []
  );

  const loadUserAndUnread = useCallback(async (userId: string) => {
    const profile = await getProfileById(userId);
    if (profile) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser({
        id: profile.id,
        email: authUser?.email || "",
        name: profile.name,
        bio: profile.bio || "",
        phone: profile.phone || "",
        location: profile.location || "",
        avatar: profile.avatar || "",
        createdAt: profile.created_at,
      });
    }
    const unread = await getUnreadCount(userId);
    setUnreadMessages(unread);
  }, []);

  const refreshSession = useCallback(() => {
    supabase.auth.getSession().then(async ({ data: { session: supaSession } }) => {
      const s = buildSession(supaSession);
      setSession(s);
      if (s) {
        await loadUserAndUnread(s.userId);
      } else {
        setUser(null);
        setUnreadMessages(0);
      }
      setIsLoading(false);
    });
  }, [buildSession, loadUserAndUnread]);

  const refreshUnread = useCallback(() => {
    const currentSession = session;
    if (currentSession) {
      getUnreadCount(currentSession.userId).then(setUnreadMessages);
    }
  }, [session]);

  useEffect(() => {
    // Escutar mudanças de auth em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, supaSession) => {
        const s = buildSession(supaSession);
        setSession(s);
        if (s) {
          await loadUserAndUnread(s.userId);
        } else {
          setUser(null);
          setUnreadMessages(0);
        }
        setIsLoading(false);
      }
    );

    // Carregar sessão inicial
    refreshSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [buildSession, loadUserAndUnread, refreshSession]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUnreadMessages(0);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, unreadMessages, refreshSession, refreshUnread, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
