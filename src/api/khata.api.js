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
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.customers)) return payload.customers;
    return [];
  },

  getCustomers: async (search = '') => {
    return khataApi.listCustomers(search);
  },

  // Kisi grahak ki complete passbook / transaction history
  getCustomerHistory: async (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.get(`/shops/me/khata/${clean}/statement`);
    return res.data?.data || res.data;
  },

  getCustomerKhataHistory: async (mobile) => {
    return khataApi.getCustomerHistory(mobile);
  },

  getStatement: async (mobile) => {
    return khataApi.getCustomerHistory(mobile);
  },

  // Naya udhar likhna (Grahak ko udhar samaan diya) with Idempotency Key
  addCredit: async (creditData) => {
    const cleanMobile = String(creditData.customer_mobile || creditData.mobile || '')
      .replace(/[^0-9]/g, '')
      .slice(-10);
    
    const payload = {
      customer_name: (creditData.customer_name || creditData.name || '').trim(),
      customer_mobile: cleanMobile,
      amount: parseFloat(creditData.amount) || 0,
      notes: (creditData.notes || creditData.description || '').trim(),
      bill_number: (creditData.bill_number || '').trim(),
      parchi_image_url: creditData.parchi_image_url || undefined,
      items_summary: creditData.items_summary || creditData.notes || undefined,
    };

    const key = generateIdempotencyKey();
    const res = await client.post('/shops/me/khata', payload, {
      headers: { 'X-Idempotency-Key': key },
    });
    return res.data?.data || res.data;
  },

  recordCredit: async (creditData) => {
    return khataApi.addCredit(creditData);
  },

  // Grahak ne paise jama kiye (Settlement / Payment received) with Idempotency Key
  recordPayment: async (mobile, paymentData) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const payload = {
      customer_name: (paymentData.customer_name || paymentData.name || '').trim(),
      amount: parseFloat(paymentData.amount) || 0,
      payment_mode: (paymentData.payment_mode || 'cash').toLowerCase(),
      notes: (paymentData.notes || paymentData.description || '').trim(),
    };

    const key = generateIdempotencyKey();
    const res = await client.post(`/shops/me/khata/${clean}/payment`, payload, {
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
