import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { axiosPrivate } from '../services/api';

interface AuthContextType {
  accessToken: string | null;
  setAuth: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Intercept outbound requests to inject the current in-memory token
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers['Authorization'] && accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Listeners for interceptor actions
    const handleTokenRefresh = (e: Event) => setAccessToken((e as CustomEvent).detail);
    const handleAuthFail = () => logout();

    window.addEventListener('token_refreshed', handleTokenRefresh);
    window.addEventListener('auth_failed', handleAuthFail);

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      window.removeEventListener('token_refreshed', handleTokenRefresh);
      window.removeEventListener('auth_failed', handleAuthFail);
    };
  }, [accessToken]);

  const setAuth = (token: string, refreshToken: string) => {
    setAccessToken(token);
    localStorage.setItem('refresh_token', refreshToken);
  };

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ accessToken, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};