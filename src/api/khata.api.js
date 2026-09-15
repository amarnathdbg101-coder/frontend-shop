/**
 * Customer Khata (Udhar / Credit Book) API Service
 * 
 * Hinglish Hint:
 * Grahako ke udhar aur jama (payments) ka pura hisab-kitab:
 * - Market me total kitna udhar baki hai (/shops/me/khata/summary)
 * - Sare udhar wale grahako ki list (/shops/me/khata)
 * - Kisi specific grahak ki passbook aur len-den history
 * - Naya udhar likhna (Record Credit)
 * - Pura ya aadha paisa aane par jama karna (Record Payment)
 * - Credit Limit set karna
 * - Aging bad-debt report
 * - PDF statement download
 */

import client, { API_BASE_URL } from './client';

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
    const res = await client.get(`/shops/me/khata/${clean}`);
    return res.data?.data || res.data; // { customer, transactions }
  },

  // Naya udhar likhna (Grahak ko udhar samaan diya)
  // payload: { customer_name, customer_mobile, amount, notes, bill_number, parchi_image_url }
  recordCredit: async (creditData) => {
    const res = await client.post('/shops/me/khata', creditData);
    return res.data?.data || res.data;
  },

  // Grahak ne paise jama kiye (Settlement / Payment received)
  // payload: { customer_name, amount, payment_mode: 'cash'|'upi'|'card'|'other', notes, upi_ref_no }
  recordPayment: async (mobile, paymentData) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.post(`/shops/me/khata/${clean}/payment`, paymentData);
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
