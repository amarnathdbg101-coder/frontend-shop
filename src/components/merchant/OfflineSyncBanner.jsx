import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { offlineSyncQueue } from '../../utils/offlineSyncQueue';
import { posApi } from '../../api/pos.api';

export const OfflineSyncBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(offlineSyncQueue.getQueue().length);
  const [syncing, setSyncing] = useState(false);

  const checkQueue = () => {
    setPendingCount(offlineSyncQueue.getQueue().length);
  };

  const handleSync = async () => {
    if (!navigator.onLine || syncing) return;
    try {
      setSyncing(true);
      const res = await offlineSyncQueue.syncAll((payload) => posApi.recordSale(payload));
      checkQueue();
      if (res.synced > 0) {
        console.log(`Successfully synced ${res.synced} offline sales!`);
      }
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        background: !isOnline ? '#ef4444' : '#3b82f6',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}
    >
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>Offline Mode: POS billing will save locally</span>
        </>
      ) : (
        <>
          <RefreshCw size={16} className={syncing ? 'spin' : ''} />
          <span>{pendingCount} offline {pendingCount === 1 ? 'bill' : 'bills'} syncing...</span>
        </>
      )}
    </div>
  );
};
