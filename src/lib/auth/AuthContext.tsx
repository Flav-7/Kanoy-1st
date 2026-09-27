import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getSession,
  login as loginFn,
  logout as logoutFn,
  type LoginResult,
  type SessionUser,
} from "./auth.functions";

type AuthState = {
  user: SessionUser | null;
  /** False until the first session check has come back from the server. */
  ready: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  /** Re-reads the session cookie (e.g. after a set-password link signed the user in). */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(
    () =>
      getSession()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setReady(true)),
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginFn({ data: { email, password } });
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutFn();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
