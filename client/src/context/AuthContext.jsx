import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('resqalloc_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('resqalloc_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('resqalloc_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('resqalloc_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data?.success) {
      const { data: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('resqalloc_token', jwtToken);
      localStorage.setItem('resqalloc_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.data?.success) {
      const { data: newUser, token: jwtToken } = res.data;
      setUser(newUser);
      setToken(jwtToken);
      localStorage.setItem('resqalloc_token', jwtToken);
      localStorage.setItem('resqalloc_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('resqalloc_token');
    localStorage.removeItem('resqalloc_user');
  };

  // Demo 1-click login helper for seamless evaluations
  const quickLogin = async (role = 'responder') => {
    let email = 'responder@resqalloc.demo';
    let password = 'responder123';

    if (role === 'admin') {
      email = 'admin@resqalloc.demo';
      password = 'admin123demo';
    } else if (role === 'hospital_staff') {
      email = 'staff@resqalloc.demo';
      password = 'staff123';
    }

    return await login(email, password);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    quickLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
