/**
 * Reusable Empty State Component
 * 
 * Displayed when a list, table, or search returns zero results.
 */

import React from 'react';

export const EmptyState = ({
  icon: Icon,
  title = 'Kuch Nahi Mila',
  description = '',
  action = null,
}) => (
  <div
    role="status"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      textAlign: 'center',
    }}
  >
    {Icon && (
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface-subtle, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: 'var(--text-muted, #94a3b8)',
        }}
      >
        <Icon size={28} />
      </div>
    )}
    <h4
      style={{
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--text-primary, #0f172a)',
        marginBottom: '0.25rem',
      }}
    >
      {title}
    </h4>
    {description && (
      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary, #64748b)',
          maxWidth: '280px',
          lineHeight: 1.4,
          marginBottom: action ? '1.25rem' : 0,
        }}
      >
        {description}
      </p>
    )}
    {action}
  </div>
);
