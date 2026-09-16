import client, { API_BASE_URL } from './client';

export const inventoryApi = {
  adjustStock: async (adjustmentData) => {
    const res = await client.post('/shops/me/inventory/adjust', adjustmentData);
    return res.data;
  },

  getLowStockAlerts: async () => {
    const res = await client.get('/shops/me/inventory/low-stock');
    return res.data;
  },

  getDemandWatchlist: async () => {
    const res = await client.get('/shops/me/inventory/demand-watchlist');
    return res.data?.data || res.data;
  },

  getReorderSheetUrl: () => {
    return `${API_BASE_URL}/shops/me/inventory/reorder-sheet.pdf`;
  },
};
