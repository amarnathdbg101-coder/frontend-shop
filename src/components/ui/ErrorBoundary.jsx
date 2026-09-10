/**
 * Error Boundary Component
 * 
 * Catches runtime rendering errors in child components and displays
 * a friendly fallback UI with retry capability instead of crashing to a blank screen.
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Merchant App Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '320px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: 'var(--radius-lg, 16px)',
            margin: '1.5rem auto',
            maxWidth: '480px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.07))',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-danger-light, #fef2f2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: 'var(--color-danger, #ef4444)',
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary, #0f172a)',
              marginBottom: '0.5rem',
            }}
          >
            Kuch Gadbad Ho Gayi
          </h3>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary, #64748b)',
              marginBottom: '1.5rem',
              maxWidth: '320px',
              lineHeight: 1.5,
            }}
          >
            Yeh screen load karne me samasya aayi. Kripya page refresh karein ya dobara koshish karein.
          </p>
          <button
            onClick={this.handleRetry}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
            }}
          >
            <RefreshCw size={16} />
            <span>Dobara Koshish Karein</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
