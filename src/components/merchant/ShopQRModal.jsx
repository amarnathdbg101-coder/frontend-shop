import React from 'react';
import QRCode from 'qrcode';
import { X, ShieldCheck, Printer, MessageCircle, Copy, Check, Sparkles, Store } from 'lucide-react';
import { RealQRCode } from '../common/RealQRCode';

export const ShopQRModal = ({ isOpen, onClose, shop }) => {
  if (!isOpen || !shop) return null;

  const shopSlug = shop.slug || shop.id || 'store';
  const shopUrl = `${window.location.origin}/shop/${shopSlug}`;
  const upiId = shop.upi_id || shop.upi || `${shopSlug}@upi`;

  const handleShareWhatsApp = () => {
    const text = `🛒 *Order & Pickup from ${shop.name}*\n📍 Store: ${shop.address || 'Local Market'}\n🔗 Open Live Catalog & Offers: ${shopUrl}\n\nScan or tap the link to order directly!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintStandee = async () => {
    try {
      // Generate ultra high-resolution 2000px vector dataURL
      const qrDataUrl = await QRCode.toDataURL(shopUrl, {
        errorCorrectionLevel: 'H',
        scale: 16,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });

      const printWindow = window.open('', '_blank', 'width=700,height=900');
      if (!printWindow) {
        alert('Please allow popups to print official counter standee.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Official Counter Standee - ${shop.name}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justifyContent: center;
                background: #ffffff;
                color: #0f172a;
              }
              .standee-frame {
                width: 100%;
                max-width: 480px;
                border: 3px solid #1e3a8a;
                border-radius: 28px;
                padding: 30px 24px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
              }
              .header-badge {
                background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
                color: white;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 800;
                letter-spacing: 1px;
                text-transform: uppercase;
                display: inline-block;
                margin-bottom: 16px;
              }
              .store-title {
                font-size: 26px;
                font-weight: 900;
                margin: 4px 0;
                color: #0f172a;
              }
              .store-sub {
                font-size: 13px;
                color: #64748b;
                margin-bottom: 24px;
              }
              .qr-box {
                background: #ffffff;
                padding: 16px;
                border: 2px solid #e2e8f0;
                border-radius: 20px;
                display: inline-block;
                margin-bottom: 20px;
              }
              .qr-img {
                width: 240px;
                height: 240px;
                display: block;
              }
              .instructions {
                font-size: 15px;
                font-weight: 700;
                color: #1e3a8a;
                margin: 8px 0 4px 0;
              }
              .features-list {
                display: flex;
                justify-content: center;
                gap: 16px;
                margin-top: 18px;
                font-size: 12px;
                font-weight: 600;
                color: #475569;
              }
              .feature-item {
                background: #f1f5f9;
                padding: 6px 12px;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="standee-frame">
              <div class="header-badge">⚡ ShopMe Verified Store</div>
              <div class="store-title">${shop.name}</div>
              <div class="store-sub">${shop.address || 'Local Market'} • Live Catalog & Counter Pickups</div>

              <div class="qr-box">
                <img class="qr-img" src="${qrDataUrl}" alt="Shop QR" />
              </div>

              <div class="instructions">📱 SCAN WITH ANY CAMERA OR QR APP</div>
              <div style="font-size: 12px; color: #64748b;">Browse in-stock items, bargain prices & reserve for 30-min pickup</div>

              <div class="features-list">
                <div class="feature-item">✓ Live Stock</div>
                <div class="feature-item">✓ Instant Hold</div>
                <div class="feature-item">✓ Digital Bill</div>
              </div>
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error('Error printing standee:', err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-subtle, #334155)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '460px',
          padding: '1.75rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <Store size={18} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Official Storefront QR</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Countertop Standee & Customer Scan</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Standee Body Preview */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px 16px', border: '2px solid #3b82f6', marginBottom: '1.25rem', color: '#0f172a' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '8px' }}>
            <Sparkles size={12} /> VERIFIED LOCAL STORE
          </div>

          <h3 style={{ margin: '0 0 2px 0', fontSize: '1.3rem', fontWeight: 800 }}>
            {shop.name}
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#64748b' }}>
            {shop.address || 'Local Market'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <RealQRCode
              value={shopUrl}
              size={200}
              logoText="SHOP"
              showDownload={true}
              downloadFilename={`${shopSlug}-counter-qr`}
            />
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a' }}>
            Scan with any Camera or QR App
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Live Inventory • Instant Counter Pickup • Best Deals
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={handlePrintStandee}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Printer size={16} /> Print Standee
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, background: '#25D366', borderColor: '#25D366' }}
          >
            <MessageCircle size={16} /> WhatsApp Share
          </button>
        </div>
      </div>
    </div>
  );
};
export default ShopQRModal;
