import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  token: string | null;
  userId: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>({ token: null, userId: null, role: null });

  useEffect(() => {
    AsyncStorage.getItem("auth").then((raw) => {
      if (raw) {
        try {
          setAuthState(JSON.parse(raw) as AuthState);
        } catch {}
      }
    });
  }, []);

  const setAuth = (next: AuthState) => {
    setAuthState(next);
    AsyncStorage.setItem("auth", JSON.stringify(next));
  };

  const clearAuth = () => {
    setAuthState({ token: null, userId: null, role: null });
    AsyncStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ ...auth, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
