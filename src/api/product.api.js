/**
 * Product & Catalog API Service
 * 
 * Hinglish Hint:
 * Dukan ke samano (Products) ko manage karne ke liye:
 * - Products ki list lena
 * - Naya product add karna
 * - Barcode scan karke product dhundna (/products/scan/{code})
 * - Global media vault se master catalog images auto-inherit karna
 * - Categories list lana
 */

import client from './client';

export const productApi = {
  // Public & Merchant: Shop ke products list karna
  listByShopSlug: async (slug, params = {}) => {
    const res = await client.get(`/shops/${slug}/products`, { params });
    return res.data;
  },

  // Public: Global products search
  listProducts: async (params = {}) => {
    const res = await client.get('/products', { params });
    return res.data;
  },
  listPublicProducts: async (params = {}) => {
    const res = await client.get('/products', { params });
    return res.data;
  },

  // Barcode / SKU Scan se product turant dhundna (POS Fast Billing ke liye)
  scanProduct: async (barcode) => {
    const res = await client.get(`/products/scan/${barcode}`);
    return res.data;
  },

  // Global Media Vault: Barcode/SKU ya Naam se master product images dhundna & auto-inherit karna
  suggestMasterImages: async (code = '', name = '') => {
    const res = await client.get('/products/media/suggest', {
      params: { code, name },
    });
    return res.data;
  },

  // Merchant: Naya product catalog me add karna
  createProduct: async (productData) => {
    const res = await client.post('/products', productData);
    return res.data;
  },

  // Merchant: Product edit karna
  updateProduct: async (id, updateData) => {
    const res = await client.put(`/products/${id}`, updateData);
    return res.data;
  },

  // Merchant: Product delete karna
  deleteProduct: async (id) => {
    const res = await client.delete(`/products/${id}`);
    return res.data;
  },

  // Merchant: Bulk Import Products via CSV File
  bulkImportCSV: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.updateExisting) {
      formData.append('update_existing', 'true');
    }
    const res = await client.post('/shops/me/products/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: options.updateExisting ? { update_existing: 'true' } : {},
    });
    return res.data;
  },

  // Merchant: Bulk Import Products via JSON items
  bulkImportJSON: async (items, options = {}) => {
    const payload = {
      items,
      update_existing: options.updateExisting ?? true,
    };
    const res = await client.post('/shops/me/products/bulk-import', payload, {
      params: options.updateExisting ? { update_existing: 'true' } : {},
    });
    return res.data;
  },

  // Merchant: Import Sample CSV Template URL
  getImportTemplateUrl: () => {
    const baseURL = client.defaults.baseURL || '/api';
    return `${baseURL}/shops/me/products/import-template.csv`;
  },

  // Public: Categories list
  getCategories: async () => {
    const res = await client.get('/categories');
    return res.data;
  },
};
