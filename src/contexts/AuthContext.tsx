'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/auth-client';

interface User {
  id: string;
  username: string;
  displayName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  user: User | null;
  checkAuth: () => Promise<void>;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const isAuth = await authApi.checkAuth();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        try {
          // Get user profile information
          const profile = await authApi.getProfile();
          const userData: User = {
            id: profile.user.id,
            username: profile.user.username,
            displayName: profile.user.displayName,
            role: profile.user.role,
            createdAt: profile.user.createdAt || '',
            updatedAt: profile.user.updatedAt || '',
          };
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
          
          // Double-check admin status with API call
          try {
            const response = await fetch('/api/admin/users', {
              credentials: 'include',
            });
            // Use both role and API check for admin status
            setIsAdmin(userData.role === 'admin' && response.ok);
          } catch {
            // If API call fails, rely on role only
            setIsAdmin(userData.role === 'admin');
          }
        } catch {
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    // Force re-check after login
    checkAuth();
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      isAdmin,
      user,
      checkAuth,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
