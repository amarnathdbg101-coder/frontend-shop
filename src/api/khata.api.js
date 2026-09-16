import client, { API_BASE_URL } from './client';

export const khataApi = {
  getSummary: async () => {
    const res = await client.get('/shops/me/khata/summary');
    return res?.data || res;
  },

  listCustomers: async (search = '') => {
    const params = search ? { search } : {};
    const res = await client.get('/shops/me/khata', { params });
    const payload = res?.data || res;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.customers)) return payload.customers;
    return [];
  },

  getCustomers: async (search = '') => {
    return khataApi.listCustomers(search);
  },

  getCustomerHistory: async (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.get(`/shops/me/khata/${clean}/statement`);
    return res?.data || res;
  },

  getCustomerKhataHistory: async (mobile) => {
    return khataApi.getCustomerHistory(mobile);
  },

  getStatement: async (mobile) => {
    return khataApi.getCustomerHistory(mobile);
  },

  addCredit: async (creditData) => {
    const cleanMobile = String(creditData.customer_mobile || creditData.mobile || '')
      .replace(/[^0-9]/g, '')
      .slice(-10);
    
    const payload = {
      customer_name: String(creditData.customer_name || creditData.name || '').trim(),
      customer_mobile: cleanMobile,
      amount: Number(creditData.amount) || 0,
      notes: String(creditData.notes || creditData.description || '').trim(),
      bill_number: String(creditData.bill_number || '').trim(),
      parchi_image_url: creditData.parchi_image_url || undefined,
      items_summary: creditData.items_summary || creditData.notes || undefined,
    };

    const res = await client.post('/shops/me/khata', payload);
    return res?.data || res;
  },

  recordCredit: async (creditData) => {
    return khataApi.addCredit(creditData);
  },

  recordPayment: async (mobile, paymentData) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const payload = {
      customer_name: String(paymentData.customer_name || paymentData.name || '').trim(),
      amount: Number(paymentData.amount) || 0,
      payment_mode: String(paymentData.payment_mode || 'cash').toLowerCase(),
      notes: String(paymentData.notes || paymentData.description || '').trim(),
    };

    const res = await client.post(`/shops/me/khata/${clean}/payment`, payload);
    return res?.data || res;
  },

  reverseTransaction: async (khataId, txId) => {
    const res = await client.post(`/shops/me/khata/${khataId}/transactions/${txId}/reverse`);
    return res.data;
  },

  resolveDispute: async (khataId, txId, resolutionNotes) => {
    const res = await client.post(`/shops/me/khata/${khataId}/dispute/${txId}/resolve`, {
      resolution: resolutionNotes,
    });
    return res.data;
  },

  setCreditLimit: async (mobile, creditLimit) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.post(`/shops/me/khata/${clean}/credit-limit`, { credit_limit: Number(creditLimit) });
    return res?.data || res;
  },

  getCustomerTrustScore: async (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.get(`/shops/me/khata/${clean}/trust-score`);
    return res.data?.data || res.data;
  },

  requestKhataClosure: async (khataId) => {
    const res = await client.post(`/shops/me/khata/${khataId}/request-closure`);
    return res.data;
  },

  verifyKhataClosureOTP: async (khataId, otp) => {
    const res = await client.post(`/shops/me/khata/${khataId}/verify-closure-otp`, { otp });
    return res.data;
  },

  getAgingReport: async () => {
    const res = await client.get('/shops/me/khata/aging');
    return res?.data || res;
  },

  getPaymentReminder: async (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    const res = await client.get(`/shops/me/khata/${clean}/reminder`);
    return res?.data || res;
  },

  getStatementPdfUrl: (mobile) => {
    const clean = String(mobile).replace(/[^0-9]/g, '').slice(-10);
    return `${API_BASE_URL || ''}/shops/me/khata/${clean}/statement.pdf`;
  },
};
