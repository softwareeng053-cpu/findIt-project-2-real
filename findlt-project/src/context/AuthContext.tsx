import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, UserProfile } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (formData: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('findlt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('findlt_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('findlt_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setToken(storedToken);
          localStorage.setItem('findlt_user', JSON.stringify(res.user));
        } catch (err) {
          localStorage.removeItem('findlt_token');
          localStorage.removeItem('findlt_user');
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login(identifier, pass);
      localStorage.setItem('findlt_token', res.token);
      localStorage.setItem('findlt_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      toast.success('Welcome back!', `Signed in as ${res.user.full_name} (${res.user.role === 'admin' ? 'Campus Admin' : res.user.campus_id})`);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication failed. Please check your credentials.';
      toast.error('Login Failed', msg);
      return false;
    }
  };

  const register = async (formData: any): Promise<boolean> => {
    try {
      const res = await api.register(formData);
      localStorage.setItem('findlt_token', res.token);
      localStorage.setItem('findlt_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      toast.success('Registration Complete', `Welcome to Findlt, ${res.user.full_name}!`);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed. Please check the entered details.';
      toast.error('Registration Failed', msg);
      return false;
    }
  };

  const logout = async () => {
    await api.logout();
    setToken(null);
    setUser(null);
    toast.info('Signed Out', 'You have been safely signed out of Findlt.');
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      localStorage.setItem('findlt_user', JSON.stringify(res.user));
    } catch (e) {
      console.error(e);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !loading && !!token && !!user,
    isAdmin: user?.role === 'admin',
    loading,
    login,
    register,
    logout,
    refreshUser
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
