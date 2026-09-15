import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Scan,
  Camera,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { playSoundboxTone } from '../../utils/soundbox';

export const KhataCustomerQRScannerModal = ({ isOpen, onClose, onCustomerScanned }) => {
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setManualPhone('');
      setManualName('');
      setErrorMsg('');
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setErrorMsg('');
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setCameraActive(false);
      }
    } catch (err) {
      console.warn('Camera access denied:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanPhone = manualPhone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setErrorMsg('Kripya valid 10-digit mobile number daalein');
      return;
    }

    playSoundboxTone('credit');
    if (onCustomerScanned) {
      onCustomerScanned({
        phone: cleanPhone,
        name: manualName.trim() || undefined,
      });
    }
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Scan Customer Khata QR
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Grahak ka My Khata QR scan karein ya phone number se hisaab kholein
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'var(--bg-surface-subtle)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Camera Scanner View */}
          {cameraActive ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '220px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '160px',
                  height: '160px',
                  border: '2px solid #f59e0b',
                  borderRadius: '16px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 16px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface-subtle)',
                marginBottom: '16px',
              }}
            >
              <Camera size={36} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Camera Scan Uplabdh Nahi
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Niche grahak ka 10-digit phone number daal kar seedhe ledger kholein
              </div>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Ya Phone Number Se Dhundhein:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <input
                type="tel"
                placeholder="Grahak ka 10-digit Phone Number (e.g. 9876543210)"
                value={manualPhone}
                onChange={(e) => {
                  setManualPhone(e.target.value);
                  setErrorMsg('');
                }}
                maxLength={10}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              />
              <input
                type="text"
                placeholder="Grahak ka Naam (Optional)"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginBottom: '10px' }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={manualPhone.trim().length < 10}
              className="btn btn-primary btn-block"
              style={{ gap: '6px', fontWeight: 800, padding: '11px' }}
            >
              <span>Grahak Ka Khata Kholein</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
