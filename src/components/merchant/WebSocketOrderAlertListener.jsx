import React, { useState, useEffect, useRef } from 'react';
import { BellRing, X, PackageCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { playSoundboxAnnouncement } from '../../utils/soundbox';

export const WebSocketOrderAlertListener = () => {
  const navigate = useNavigate();
  const { isMerchant } = useAuth();
  const [activeAlert, setActiveAlert] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('shopme_token');
    if (!isMerchant || !token) return;

    const rawUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.shopsilo.in').trim();
    const wsHost = rawUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsHost}/shops/me/ws?token=${token}`;

    let reconnectTimer;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WebSocketAlerts] Connected to live counter channel');
        };

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === 'NEW_RESERVATION' || data.event === 'NEW_POS_SALE') {
              triggerAlert(data);
            }
          } catch (err) {
            console.warn('[WebSocketAlerts] Parse notice:', err);
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 10000);
        };

        ws.onerror = () => {
          // Silent reconnect
        };
      } catch (err) {
        reconnectTimer = setTimeout(connect, 10000);
      }
    };

    const triggerAlert = (data) => {
      setActiveAlert(data);
      playSoundboxAnnouncement('Naya counter pickup order aaya hai!');

      // Auto dismiss after 8 seconds
      setTimeout(() => {
        setActiveAlert(null);
      }, 8000);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [isMerchant]);

  if (!activeAlert) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        background: '#1e293b',
        border: '1px solid #3b82f6',
        borderRadius: '16px',
        padding: '1rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        maxWidth: '380px',
        width: 'calc(100% - 32px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'slideDown 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '10px' }}>
          <BellRing size={20} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
            New Counter Pickup Order! 🛎️
          </h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            {activeAlert.payload?.product_name || 'Customer item reserved'} (OTP: {activeAlert.payload?.pickup_code || 'Ready'})
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => {
            setActiveAlert(null);
            navigate('/merchant/pickups');
          }}
          style={{
            background: 'var(--color-primary, #3b82f6)',
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Verify
        </button>
        <button
          onClick={() => setActiveAlert(null)}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
