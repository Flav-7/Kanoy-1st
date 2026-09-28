import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getSession,
  login as loginFn,
  logout as logoutFn,
  type AuthSession,
  type LoginResult,
  type SessionUser,
} from "./auth.functions";
import { lockAppSession, makeAppSessionFn } from "@/lib/app/applock.functions";
import { isInstalledTouchApp } from "@/lib/app/app-mode";
import { rememberUser } from "@/lib/app/remembered-user";
import { disablePush } from "@/lib/team/push-client";

type AuthState = {
  user: SessionUser | null;
  /** The session including the app-lock state (null when signed out). */
  session: AuthSession | null;
  /** False until the first session check has come back from the server. */
  ready: boolean;
  /** Running as the installed phone/tablet app. */
  appMode: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<LoginResult>;
  logout: () => Promise<void>;
  /** Re-reads the session (after unlocking, setting a password, etc.). */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [appMode, setAppMode] = useState(false);
  const wasLocked = useRef(false);

  const refresh = useCallback(async () => {
    let next: AuthSession | null = null;
    try {
      next = await getSession();
    } catch {
      next = null;
    }
    // Coming out of the lock: whatever loaded while locked was refused, reload it.
    if (wasLocked.current && next && !next.locked) void queryClient.invalidateQueries();
    wasLocked.current = Boolean(next?.locked);
    if (next && isInstalledTouchApp()) rememberUser(next.user);
    setSession(next);
    setReady(true);
  }, [queryClient]);

  useEffect(() => {
    const app = isInstalledTouchApp();
    setAppMode(app);
    void (async () => {
      if (app) {
        // Every start of the app begins locked. A session inherited from the
        // browser (Android shares Chrome's cookies) is put under the lock first.
        const current = await getSession().catch(() => null);
        if (current && !current.appSession && !current.locked)
          await makeAppSessionFn().catch(() => {});
        if (current) await lockAppSession().catch(() => {});
      }
      await refresh();
    })();
  }, [refresh]);

  // Back from the background: the unlock window may have run out meanwhile.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && session?.appSession) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh, session?.appSession]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const result = await loginFn({ data: { email, password, remember, appLock: appMode } });
      if (result.ok) await refresh();
      return result;
    },
    [appMode, refresh],
  );

  const logout = useCallback(async () => {
    // Stop this device's notifications first, so a shared computer doesn't
    // keep getting the previous person's area updates.
    await disablePush().catch(() => {});
    await logoutFn();
    setSession(null);
    wasLocked.current = false;
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        // A locked session doesn't count as signed in for the rest of the site.
        user: session && !session.locked ? session.user : null,
        session,
        ready,
        appMode,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
