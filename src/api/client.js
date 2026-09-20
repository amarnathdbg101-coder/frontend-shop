/**
 * ShopSilo Merchant API Client (Axios Instance)
 * 
 * Performance & Resilient Auth:
 * 1. Automatic JWT Bearer attachment.
 * 2. Standardized response formatting.
 * 3. Soft 401 handling without disruptive hard page reloads.
 */

import axios from 'axios';

// Backend server URL
const rawUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL = rawUrl ? rawUrl.replace(/\/+$/, '') : 'https://api.shopsilo.in';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Helper to get active token
export const getActiveToken = () => {
  return localStorage.getItem('shopsilo_token') || localStorage.getItem('shopme_token') || null;
};

// Request Interceptor: Attach JWT Token automatically
client.interceptors.request.use(
  (config) => {
    const token = getActiveToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize API responses & errors
client.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.error || error.response?.data?.message;
    const fallbackMessage = error.message || 'Kuch galat ho gaya, kripya dobara koshish karein';
    const requestUrl = error.config?.url || '';

    // Handle 401 Unauthorized gracefully
    if (status === 401 && !requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register') && !requestUrl.includes('/auth/staff-login')) {
      const hadToken = !!getActiveToken();
      if (hadToken) {
        // Clear expired local tokens
        localStorage.removeItem('shopsilo_token');
        localStorage.removeItem('shopme_token');
        localStorage.removeItem('shopsilo_user');
        localStorage.removeItem('shopme_user');

        // Notify active React AuthContext without violent browser reload
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shopsilo:auth_expired'));
        }
      }
    }

    return Promise.reject(new Error(backendMessage || fallbackMessage));
  }
);

export default client;
export const apiClient = client;
