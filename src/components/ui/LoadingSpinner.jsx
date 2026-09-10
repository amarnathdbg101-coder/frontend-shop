/**
 * Branded Loading Spinner
 * 
 * Centered spinner with ShopMe Merchant branding.
 * Used as Suspense fallback and route-level loading state.
 */

import React from 'react';
import { Store } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Dukan OS load ho raha hai...', size = 'default' }) => {
  const isSmall = size === 'small';

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isSmall ? '120px' : '60vh',
        gap: '1rem',
        padding: '2rem',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: isSmall ? '36px' : '52px',
          height: isSmall ? '36px' : '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid var(--border-subtle, #e2e8f0)',
            borderTopColor: 'var(--color-primary, #4f46e5)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        {/* Center icon */}
        <Store
          size={isSmall ? 16 : 22}
          style={{ color: 'var(--color-primary, #4f46e5)' }}
        />
      </div>
      {text && (
        <span
          style={{
            fontSize: isSmall ? '0.78rem' : '0.9rem',
            color: 'var(--text-secondary, #64748b)',
            fontWeight: 500,
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};
