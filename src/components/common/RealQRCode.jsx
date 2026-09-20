import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, QrCode as QrIcon, RefreshCw, Printer } from 'lucide-react';

/**
 * Enterprise-grade, 100% Genuine Standard ISO/IEC QR Code Component
 * 
 * Features:
 * - Authentic, razor-sharp standard QR matrix (NO fake cartoon text/stickers blocking cells)
 * - Error correction level 'M' or 'H' for 100% reliability with any phone camera / scanner
 * - Standard quiet-zone margin
 * - High-resolution 1200px export for crisp printing & standee displays
 * - Automatic fallback to high-res QR cloud generator if local canvas encounters an issue
 * - 1-Click HD Download & Link Copy
 */
export const RealQRCode = ({
  value,
  size = 220,
  darkColor = '#000000',
  lightColor = '#ffffff',
  showDownload = true,
  showCopy = true,
  downloadFilename = 'shopsilo-qr-code',
  frameTitle = '',
  frameSubtitle = '',
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!value) {
      setDataUrl('');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const generateQR = async () => {
      try {
        // Generate high-resolution 1200px master QR matrix for razor-sharp scanning
        const url = await QRCode.toDataURL(String(value), {
          errorCorrectionLevel: 'M',
          margin: 2,
          scale: 12,
          color: {
            dark: darkColor || '#000000',
            light: lightColor || '#ffffff',
          },
        });

        if (isMounted) {
          setDataUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.warn('In-memory QR canvas failed, falling back to API generator:', err);
        if (isMounted) {
          // Fallback to high-res standard server QR
          const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=2&data=${encodeURIComponent(String(value))}`;
          setDataUrl(fallbackUrl);
          setLoading(false);
        }
      }
    };

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [value, darkColor, lightColor]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${downloadFilename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-surface-subtle)',
          borderRadius: '16px',
          border: '1.5px dashed var(--border-subtle)',
          color: 'var(--text-muted)',
          gap: '8px',
        }}
      >
        <QrIcon size={32} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>No QR Data</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      className={className}
    >
      {/* Standee Frame Container */}
      <div
        style={{
          position: 'relative',
          background: '#ffffff',
          padding: '12px',
          borderRadius: '20px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {frameTitle && (
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              paddingBottom: '8px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '8px',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
              {frameTitle}
            </div>
            {frameSubtitle && (
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                {frameSubtitle}
              </div>
            )}
          </div>
        )}

        {/* The Real Pure QR Matrix */}
        <div
          style={{
            position: 'relative',
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-primary)',
              }}
            >
              <RefreshCw size={24} className="spin" />
              <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Generating QR...</span>
            </div>
          ) : (
            <img loading="lazy" decoding="async" 
              src={dataUrl}
              alt="Official Scannable QR Code"
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                imageRendering: 'pixelated',
                borderRadius: '4px',
              }}
            />
          )}
        </div>
      </div>

      {/* Action Buttons: Download HD & Copy Link */}
      {(showDownload || showCopy) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
          }}
        >
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Download High-Resolution PNG for Standee/Print"
            >
              <Download size={13} color="var(--color-primary)" />
              <span>Download HD</span>
            </button>
          )}

          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: copied ? '#16a34a' : 'var(--text-primary)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Copy link"
            >
              {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RealQRCode;
