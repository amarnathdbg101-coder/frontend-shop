/**
 * Skeleton Loader Components
 * 
 * Pulse-animated placeholder shapes displayed while content is loading.
 * Matches the design tokens from variables.css.
 */

import React from 'react';

export const Skeleton = ({ width = '100%', height = '1rem', borderRadius = 'var(--radius-sm, 8px)', style = {} }) => (
  <div
    className="skeleton-pulse"
    style={{
      width,
      height,
      borderRadius,
      backgroundColor: 'var(--bg-surface-subtle, #f1f5f9)',
      ...style,
    }}
  />
);

export const SkeletonText = ({ lines = 2, gap = '0.5rem' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, width: '100%' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="0.875rem"
        width={i === lines - 1 && lines > 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonStat = () => (
  <div
    style={{
      padding: '1rem',
      borderRadius: 'var(--radius-md, 12px)',
      backgroundColor: 'var(--bg-surface, #ffffff)',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      flex: 1,
      minWidth: '130px',
    }}
  >
    <Skeleton width="45%" height="0.75rem" />
    <Skeleton width="75%" height="1.5rem" />
    <Skeleton width="55%" height="0.65rem" />
  </div>
);

export const SkeletonRow = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem',
      padding: '0.85rem 1rem',
      borderRadius: 'var(--radius-md, 12px)',
      backgroundColor: 'var(--bg-surface, #ffffff)',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      marginBottom: '0.5rem',
    }}
  >
    <Skeleton width="42px" height="42px" borderRadius="var(--radius-md, 12px)" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <Skeleton width="65%" height="0.9rem" />
      <Skeleton width="40%" height="0.75rem" />
    </div>
    <Skeleton width="60px" height="1.2rem" borderRadius="var(--radius-sm, 8px)" />
  </div>
);

export const SkeletonCard = () => (
  <div
    style={{
      padding: '1rem',
      borderRadius: 'var(--radius-lg, 16px)',
      backgroundColor: 'var(--bg-surface, #ffffff)',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}
  >
    <Skeleton height="120px" borderRadius="var(--radius-md, 12px)" />
    <Skeleton width="70%" height="1rem" />
    <SkeletonText lines={2} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
      <Skeleton width="35%" height="1.25rem" />
      <Skeleton width="30%" height="2rem" borderRadius="var(--radius-md, 12px)" />
    </div>
  </div>
);
