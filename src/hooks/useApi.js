/**
 * useApi Hook
 * 
 * Custom hook for API calls with automatic loading, error, and data states.
 * Supports manual trigger, abort on unmount, and refetch.
 * 
 * Usage:
 *   const { data, loading, error, refetch } = useApi(
 *     () => posApi.getDailySalesSummary(),
 *     { immediate: true }
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useApi = (apiFn, options = {}) => {
  const { immediate = true, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFn(...args);
        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          if (onSuccess) onSuccess(result);
        }
        return result;
      } catch (err) {
        if (isMountedRef.current) {
          const errMsg = err.message || 'Kuch galat ho gaya';
          setError(errMsg);
          setLoading(false);
          if (onError) onError(err);
        }
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFn]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, refetch: execute, setData };
};
