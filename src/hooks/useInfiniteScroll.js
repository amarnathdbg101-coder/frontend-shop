import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

export function useInfiniteScroll(endpoint, initialParams = {}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get(endpoint, {
        params: { ...initialParams, page: pageNum, limit: 16 },
      });

      const raw = res.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.products || [];
      const totalPages = raw?.total_pages || 1;

      setItems((prev) => (reset ? list : [...prev, ...list]));
      setHasMore(pageNum < totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(initialParams)]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    fetchPage(1, true);
  }, [JSON.stringify(initialParams)]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 350) {
        if (hasMore && !loading) {
          fetchPage(page + 1, false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loading, fetchPage]);

  return { items, loading, error, hasMore, refetch: () => fetchPage(1, true) };
}
