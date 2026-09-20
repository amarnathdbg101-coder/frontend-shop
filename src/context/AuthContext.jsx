/**
 * Merchant Authentication Context
 * 
 * Features:
 * 1. Synchronous instant local storage hydration (zero flicker on page load / refresh).
 * 2. Cross-tab session sync with window storage events.
 * 3. Silent background profile & shop verification.
 * 4. Resilient login, registration, and clean logout.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { shopApi } from '../api/shop.api';

const AuthContext = createContext(null);

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('shopsilo_token') || localStorage.getItem('shopme_token') || null;
};

const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('shopsilo_user') || localStorage.getItem('shopme_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false); // Initial state is instantly hydrated from storage

  // Fetch shop details for merchant
  const fetchShopDetails = useCallback(async () => {
    try {
      const shopData = await shopApi.getMyShop();
      setShop(shopData);
    } catch {
      setShop(null);
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setShop(null);
    localStorage.removeItem('shopsilo_token');
    localStorage.removeItem('shopme_token');
    localStorage.removeItem('shopsilo_user');
    localStorage.removeItem('shopme_user');
  }, []);

  // Synchronize auth state across browser tabs & listen for 401 expiry events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'shopsilo_token' || e.key === 'shopsilo_user') {
        setToken(getStoredToken());
        setUser(getStoredUser());
      }
    };

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('shopsilo:auth_expired', handleAuthExpired);

    // Initial shop fetch for active merchant
    const activeToken = getStoredToken();
    const activeUser = getStoredUser();
    if (activeToken && activeUser) {
      if (activeUser.role === 'shop' || activeUser.role === 'admin' || activeUser.role === 'merchant') {
        fetchShopDetails();
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shopsilo:auth_expired', handleAuthExpired);
    };
  }, [logout, fetchShopDetails]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const accessToken = res.access_token || res.data?.access_token;
      const userData = res.user || res.data?.user;

      if (accessToken && userData) {
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('shopsilo_token', accessToken);
        localStorage.setItem('shopsilo_user', JSON.stringify(userData));

        if (userData.role === 'shop' || userData.role === 'admin' || userData.role === 'merchant') {
          fetchShopDetails();
        }
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  // Google Login handler for Merchants
  const loginWithGoogle = async (idToken) => {
    setLoading(true);
    try {
      const res = await authApi.googleLogin(idToken, 'shop');
      const accessToken = res.access_token || res.data?.access_token;
      const userData = res.user || res.data?.user;

      if (accessToken && userData) {
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('shopsilo_token', accessToken);
        localStorage.setItem('shopsilo_user', JSON.stringify(userData));

        if (userData.role === 'shop' || userData.role === 'admin' || userData.role === 'merchant') {
          fetchShopDetails();
        }
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authApi.register(userData);
      const accessToken = res.access_token || res.data?.access_token;
      const userObj = res.user || res.data?.user;

      if (accessToken && userObj) {
        setToken(accessToken);
        setUser(userObj);
        localStorage.setItem('shopsilo_token', accessToken);
        localStorage.setItem('shopsilo_user', JSON.stringify(userObj));
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  // Update local user state
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...updatedFields };
      localStorage.setItem('shopsilo_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Update local shop state
  const updateShopState = (updatedFields) => {
    setShop((prev) => (prev ? { ...prev, ...updatedFields } : updatedFields));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        token,
        loading,
        isAuthenticated: !!token,
        isMerchant: user?.role === 'shop' || user?.role === 'admin' || user?.role === 'merchant',
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser,
        updateShopState,
        refreshShop: fetchShopDetails,
      }}
    >
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
