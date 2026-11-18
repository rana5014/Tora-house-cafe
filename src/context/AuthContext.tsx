import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerProfile } from '../types';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

interface AuthContextType {
  currentUser: CustomerProfile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  isOrderHistoryOpen: boolean;
  isAdminModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  setIsOrderHistoryOpen: (open: boolean) => void;
  setIsAdminModalOpen: (open: boolean) => void;
  login: (phoneOrEmail: string, name?: string) => Promise<boolean>;
  register: (name: string, phone: string, email: string, address?: string) => Promise<boolean>;
  updateProfile: (profile: Partial<CustomerProfile>) => void;
  logout: () => void;
  adminLogin: (pin: string) => Promise<boolean>;
  adminLogout: () => void;
  openAdminPortal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(() => storage.getCustomerProfile());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Check existing admin token validity on mount
  useEffect(() => {
    const checkToken = async () => {
      const isValid = await api.adminVerify();
      setIsAdmin(isValid);
    };
    checkToken();

    // Check if owner navigated via secret URL hash #owner or query param ?admin=true
    const checkSecretRoute = () => {
      if (
        window.location.hash === '#owner' ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin=true') ||
        window.location.search.includes('owner=true')
      ) {
        setIsAdminModalOpen(true);
      }
    };
    checkSecretRoute();
    window.addEventListener('hashchange', checkSecretRoute);
    return () => window.removeEventListener('hashchange', checkSecretRoute);
  }, []);

  const login = async (phoneOrEmail: string, name?: string): Promise<boolean> => {
    const existing = storage.getCustomerProfile();
    if (existing && (existing.phone === phoneOrEmail || existing.email === phoneOrEmail)) {
      setCurrentUser(existing);
      return true;
    }

    const newProfile: CustomerProfile = {
      id: `cust-${Date.now()}`,
      name: name || 'Tora Guest',
      phone: phoneOrEmail.includes('@') ? '0500000000' : phoneOrEmail,
      email: phoneOrEmail.includes('@') ? phoneOrEmail : '',
      defaultAddress: '',
      joinedDate: new Date().toISOString(),
    };

    setCurrentUser(newProfile);
    storage.setCustomerProfile(newProfile);
    return true;
  };

  const register = async (name: string, phone: string, email: string, address: string = ''): Promise<boolean> => {
    const newProfile: CustomerProfile = {
      id: `cust-${Date.now()}`,
      name,
      phone,
      email,
      defaultAddress: address,
      joinedDate: new Date().toISOString(),
    };

    setCurrentUser(newProfile);
    storage.setCustomerProfile(newProfile);
    return true;
  };

  const updateProfile = (partial: Partial<CustomerProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...partial };
    setCurrentUser(updated);
    storage.setCustomerProfile(updated);
  };

  const logout = () => {
    setCurrentUser(null);
    storage.setCustomerProfile(null);
  };

  const adminLogin = async (pin: string): Promise<boolean> => {
    try {
      const res = await api.adminLogin(pin);
      if (res?.success) {
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('tora_admin_token');
    localStorage.removeItem('tora_admin_expires');
    setIsAdmin(false);
  };

  const openAdminPortal = () => {
    setIsAdminModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn: Boolean(currentUser),
        isAdmin,
        isAuthModalOpen,
        isOrderHistoryOpen,
        isAdminModalOpen,
        setIsAuthModalOpen,
        setIsOrderHistoryOpen,
        setIsAdminModalOpen,
        login,
        register,
        updateProfile,
        logout,
        adminLogin,
        adminLogout,
        openAdminPortal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
