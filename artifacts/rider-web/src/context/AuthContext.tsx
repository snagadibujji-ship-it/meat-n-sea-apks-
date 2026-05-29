import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "mns_rider_token";

interface AuthState {
  token: string | null;
  userId: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (state: AuthState) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return { token: null, userId: null, role: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { token: null, userId: null, role: null };
  }
}

setAuthTokenGetter(() => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    return parsed.token ?? null;
  } catch {
    return null;
  }
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(loadAuth);

  useEffect(() => {
    setAuthTokenGetter(() => auth.token ?? null);
  }, [auth.token]);

  function setAuth(state: AuthState) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(state));
    setAuthState(state);
    setAuthTokenGetter(() => state.token ?? null);
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    setAuthState({ token: null, userId: null, role: null });
    setAuthTokenGetter(() => null);
  }

  return (
    <AuthContext.Provider
      value={{ ...auth, setAuth, clearAuth, isAuthenticated: !!auth.token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
