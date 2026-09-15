/**
 * Customer Khata (Udhar / Credit Book) API Service with Idempotency Protection
 */

import client, { API_BASE_URL } from './client';

// Generate unique client-side idempotency key for anti-duplicate protection
function generateIdempotencyKey() {
  return 'khata_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export const khataApi = {
  // Total market udhar aur count summary
  getSummary: async () => {
    const res = await client.get('/shops/me/khata/summary');
    return res.data?.data || res.data;
  },

  // Udhar wale grahako ki list (search by name/mobile supported)
  listCustomers: async (search = '') => {
    const params = search ? { search } : {};
    const res = await client.get('/shops/me/khata', { params });
    return res.data?.data || res.data;
  },

  // Kisi grahak ki complete passbook / transaction history
  getCustomerHistory: async (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.get(`/shops/me/khata/${clean}/statement`);
    return res.data?.data || res.data;
  },

  getCustomerKhataHistory: async (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.get(`/shops/me/khata/${clean}/statement`);
    return res.data?.data || res.data;
  },

  // Naya udhar likhna (Grahak ko udhar samaan diya) with Idempotency Key
  addCredit: async (creditData) => {
    const key = generateIdempotencyKey();
    const res = await client.post('/shops/me/khata', creditData, {
      headers: { 'X-Idempotency-Key': key },
    });
    return res.data?.data || res.data;
  },

  recordCredit: async (creditData) => {
    const key = generateIdempotencyKey();
    const res = await client.post('/shops/me/khata', creditData, {
      headers: { 'X-Idempotency-Key': key },
    });
    return res.data?.data || res.data;
  },

  // Grahak ne paise jama kiye (Settlement / Payment received) with Idempotency Key
  recordPayment: async (mobile, paymentData) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const key = generateIdempotencyKey();
    const res = await client.post(`/shops/me/khata/${clean}/payment`, paymentData, {
      headers: { 'X-Idempotency-Key': key },
    });
    return res.data?.data || res.data;
  },

  // Customer ki credit limit update karna
  setCreditLimit: async (mobile, creditLimit) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.put(`/shops/me/khata/${clean}/credit-limit`, { credit_limit: Number(creditLimit) });
    return res.data?.data || res.data;
  },

  // Aging Bad-Debt Report
  getAgingReport: async () => {
    const res = await client.get('/shops/me/khata/aging');
    return res.data?.data || res.data;
  },

  // WhatsApp reminder message & link
  getPaymentReminder: async (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.get(`/shops/me/khata/${clean}/reminder`);
    return res.data?.data || res.data;
  },

  // PDF statement download URL
  getStatementPdfUrl: (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    return `${API_BASE_URL || ''}/shops/me/khata/${clean}/statement.pdf`;
  },
};
