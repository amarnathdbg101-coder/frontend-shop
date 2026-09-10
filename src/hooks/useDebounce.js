/**
 * useDebounce Hook
 * 
 * Delays updating a value until a specified time has passed since the last change.
 * Essential for barcode/search inputs in POS, inventory, and khata to avoid
 * firing heavy re-filtering or API calls on every keystroke.
 * 
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 */

import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
