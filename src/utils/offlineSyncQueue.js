/**
 * Offline POS Billing Queue & Resilience Utility
 */

const QUEUE_KEY = 'shopme_offline_sales_queue';

export const offlineSyncQueue = {
  getQueue: () => {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  addSale: (salePayload) => {
    const queue = offlineSyncQueue.getQueue();
    const queuedItem = {
      id: 'off_' + Date.now(),
      payload: salePayload,
      timestamp: new Date().toISOString(),
    };
    queue.push(queuedItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queuedItem;
  },

  removeSale: (id) => {
    const queue = offlineSyncQueue.getQueue().filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  clearQueue: () => {
    localStorage.removeItem(QUEUE_KEY);
  },

  syncAll: async (syncFn) => {
    const queue = offlineSyncQueue.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const item of [...queue]) {
      try {
        await syncFn(item.payload);
        offlineSyncQueue.removeSale(item.id);
        synced++;
      } catch (err) {
        console.error('Failed to sync offline sale:', item.id, err);
        failed++;
      }
    }

    return { synced, failed };
  },
};
