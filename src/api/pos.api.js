/**
 * Counter POS (Point of Sale) API Service
 * 
 * Hinglish Hint:
 * Dukan ke counter billing terminal ke liye:
 * - Counter par naya bill/sale create karna (Cash, UPI, Khata/Credit)
 * - Aaj ki din bhar ki bikri (Daily Summary) dekhna
 * - Digital PDF receipt ka URL generate karna
 */

import client, { API_BASE_URL } from './client';

export const posApi = {
  // Counter Sale create karna
  // payload: { customer_phone, items: [{ product_id, quantity, custom_price }], discount_amount, payment_method }
  // Alias for createSale
  recordSale: async (saleData) => {
    return posApi.createSale(saleData);
  },

  createSale: async (saleData) => {
    const res = await client.post('/shops/me/pos/sale', saleData);
    const data = res?.data?.bill ? res.data : (res?.bill ? res : (res?.data || res));
    return data;
  },

  // Aaj ki bikri ki summary (Total Bills, Cash Sales, UPI Sales, Credit Sales)
  // Alias for getDailySummary
  getDailySalesSummary: async (date) => {
    return posApi.getDailySummary(date);
  },

  getDailySummary: async (date) => {
    const params = date ? { date } : {};
    const res = await client.get('/shops/me/pos/daily-summary', { params });
    return res?.data || res;
  },

  // Public Digital Receipt URL builder
  getReceiptUrl: (billNumber) => {
    const cleanNumber = String(billNumber || '').replace(/\.pdf$/i, '');
    const base = API_BASE_URL || 'https://api.shopsilo.in';
    return `${base}/receipts/${cleanNumber}`;
  },
};
