import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // SYNCHRONOUS INITIALIZATION: Check local storage immediately on load
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access_token');
    return token ? { token } : null;
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    // Proactively refresh the token every 10 minutes (600,000 ms)
    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await api.post('/auth/refresh/', { refresh_token: refreshToken });
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
        } catch (error) {
          console.error("Background refresh failed", error);
          logout();
        }
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    setUser({ token: res.data.access_token });
    navigate('/');
  };

  const signup = async (name, email, password) => {
    await api.post('/auth/signup/', { name, email, password });
    // CHANGED: Instead of auto-logging in, navigate to the login page
    navigate('/login');
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};