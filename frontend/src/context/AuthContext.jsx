import { createContext, useContext, useState, useCallback } from "react";
import { authApi, setSession, clearSession, getStoredUser, getToken } from "../lib/api";
import { roleLabel } from "../lib/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getToken());

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password); // throws ApiError on 401/etc
    setSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    role: user?.role,
    roleLabel: user ? roleLabel(user.role) : null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
