/**
 * Customer Storefront URL Resolver
 * 
 * Ensures that all customer-facing links (QR codes, WhatsApp share messages,
 * Standee printouts, AI campaigns, and "Switch to Customer Mode" links) always point
 * to the customer app (https://shopsilo.in), NEVER to the merchant portal (shop.shopsilo.in).
 */

export const getCustomerAppBaseUrl = () => {
  const envUrl = import.meta.env.VITE_CUSTOMER_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // Development environment on localhost
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5173';
    }
  }

  // Production customer domain
  return 'https://shopsilo.in';
};

export const getCustomerStoreUrl = (slug) => {
  const baseUrl = getCustomerAppBaseUrl();
  if (!slug) return baseUrl;
  return `${baseUrl}/shop/${slug}`;
};
