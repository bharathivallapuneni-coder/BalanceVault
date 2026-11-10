import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '../api/client';

export interface UserAccount {
  id: string;
  accountReference: string;
  userId: string;
  accountType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserOnboarding {
  id: string;
  userId: string;
  residentialAddress: string;
  dateOfBirth: string;
  identificationType: string;
  identificationNumber: string;
  status: string;
  rejectionReason: string | null;
  reviewedBy: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'ACCOUNT_HOLDER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt?: string;
  account?: UserAccount | null;
  onboarding?: UserOnboarding | null;
  onboardingStatus?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (formData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('bv_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<{ user: AuthUser }>('/api/auth/me');
      setUser(res.user);
    } catch (err) {
      localStorage.removeItem('bv_token');
      localStorage.removeItem('bv_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/login', {
      email,
      password,
    });
    localStorage.setItem('bv_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (formData: any) => {
    return await api.post('/api/auth/register', formData);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Continue client cleanup even if network fails
    }
    localStorage.removeItem('bv_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
