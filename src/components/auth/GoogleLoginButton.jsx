import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '328255141048-v4r4fga1oas928b5imvh9jpbaemrc9a8.apps.googleusercontent.com';

/**
 * Enterprise Google Sign-In Button using Google Identity Services (GIS)
 * Supports official Google button rendering with custom aesthetic fallback for Merchants.
 */
export const GoogleLoginButton = ({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled = false,
}) => {
  const buttonContainerRef = useRef(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initGIS = () => {
      if (!window.google || !window.google.accounts) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              try {
                setLoading(true);
                await onSuccess(response.credential);
              } catch (err) {
                if (onError) onError(err);
              } finally {
                setLoading(false);
              }
            } else {
              if (onError) onError(new Error('Google did not return credentials.'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: text,
            shape: 'rectangular',
            logo_alignment: 'left',
            width: buttonContainerRef.current.offsetWidth || 340,
          });
        }

        setGisLoaded(true);
        return true;
      } catch (e) {
        console.error('[GoogleLoginButton] Init failed:', e);
        return false;
      }
    };

    if (!initGIS()) {
      const interval = setInterval(() => {
        if (initGIS()) {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [text, onSuccess, onError]);

  const handleManualClick = () => {
    if (disabled || loading) return;
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('[GoogleLoginButton] One-tap prompt skipped, use standard button');
        }
      });
    }
  };

  return (
    <div style={{ width: '100%', margin: '12px 0' }}>
      <div
        ref={buttonContainerRef}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '44px',
        }}
      />

      {!gisLoaded && (
        <button
          type="button"
          onClick={handleManualClick}
          disabled={disabled || loading}
          style={{
            width: '100%',
            height: '44px',
            border: '1px solid #dadce0',
            borderRadius: '6px',
            background: '#ffffff',
            color: '#3c4043',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(60,64,67,0.1)',
            transition: 'background-color 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
            />
          </svg>
          <span>{loading ? 'Connecting Google...' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  );
};
