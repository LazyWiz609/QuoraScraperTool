import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import type { InsertUser } from '@shared/schema';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  register: (userData: InsertUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/me');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/login', { username, password });
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (userData: InsertUser) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error?.error || 'Registration failed');
    }

    const data = await res.json();
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
