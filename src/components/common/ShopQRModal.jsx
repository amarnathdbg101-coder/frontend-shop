import React from 'react';
import { X, ShieldCheck, Printer, MessageCircle, Copy, Check, Sparkles, Store } from 'lucide-react';
import { RealQRCode } from '../common/RealQRCode';

export const ShopQRModal = ({ isOpen, onClose, shop }) => {
  if (!isOpen || !shop) return null;

  const shopSlug = shop.slug || shop.id || 'store';
  const shopUrl = `${window.location.origin}/shop/${shopSlug}`;
  const upiId = shop.upi_id || shop.upi || `${shopSlug}@upi`;
  const upiPayUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shop.name || 'Store')}&cu=INR`;

  const handleShareWhatsApp = () => {
    const text = `🛒 *Order & Pickup from ${shop.name}*\n📍 Store: ${shop.address || 'Local Market'}\n📲 Open Live Catalog & Offers: ${shopUrl}\n\nScan or tap the link to order directly!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintStandee = () => {
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
            .store-meta {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 20px;
            }
            .qr-wrapper {
              background: #ffffff;
              border: 2px dashed #cbd5e1;
              border-radius: 20px;
              padding: 18px;
              display: inline-block;
              margin-bottom: 16px;
            }
            .qr-img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .upi-pill {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 8px 16px;
              border-radius: 12px;
              font-family: monospace;
              font-size: 15px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 20px;
              display: inline-block;
            }
            .accepted-row {
              font-size: 12px;
              font-weight: 800;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
              margin-top: 10px;
            }
            .apps-list {
              display: flex;
              justify-content: center;
              gap: 12px;
              margin-top: 8px;
              font-size: 13px;
              font-weight: 700;
              color: #2563eb;
            }
            .btn-print-action {
              display: block;
              margin: 0 auto 20px auto;
              padding: 10px 24px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 10px;
              font-weight: 700;
              cursor: pointer;
            }
            @media print {
              .btn-print-action { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <button class="btn-print-action" onclick="window.print()">Print Official Standee (A4/A5)</button>
          
          <div class="standee-frame">
            <div class="header-badge">ShopMe ? Verified Merchant Standee</div>
            <div class="store-title">${shop.name}</div>
            <div class="store-meta">${shop.category || 'General Store'} • ${shop.address || 'Local Bazar, Darbhanga'}</div>

            <div class="qr-wrapper">
              <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shopUrl)}&margin=1" alt="QR" />
            </div>

            <div>
              <div class="upi-pill">Scan to Order, Hold Items &amp; Pay: ${shopUrl}</div>
            </div>

            <div class="accepted-row">
              ACCEPTED HERE VIA ALL UPI &amp; SHOPME APP
              <div class="apps-list">
                <span>Google Pay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM UPI</span> • <span>ShopMe</span>
              </div>
            </div>
          </div>

          <script>
            setTimeout(() => {
              window.print();
            }, 400);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa', padding: '6px', borderRadius: '8px' }}>
              <Store size={18} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Official Counter Standee QR</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Verified BharatQR &amp; Catalog Standee</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Standee Preview Frame */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '20px 16px',
            border: '2px solid #2563eb',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.15)',
            marginBottom: '1.25rem',
            color: '#0f172a',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              marginBottom: '10px',
            }}
          >
            <ShieldCheck size={14} />
            <span>VERIFIED MERCHANT STANDEE</span>
          </div>

          <h3 style={{ margin: '0 0 2px 0', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
            {shop.name}
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#64748b' }}>
            {shop.category || 'General Store'} • {shop.city || 'Darbhanga'}
          </p>

          {/* Ultra Crisp Real Vector QR */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <RealQRCode
              value={shopUrl}
              size={210}
              logoText="ShopMe"
              showDownload={false}
              downloadFilename={`${shopSlug}-counter-qr`}
            />
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#334155',
              display: 'inline-block',
              marginBottom: '12px',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Scan to order &amp; pay: <strong>{shopUrl}</strong>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>
            ACCEPTED HERE VIA GOOGLE PAY • PHONEPE • PAYTM • BHIM UPI
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <button
            onClick={handlePrintStandee}
            style={{
              padding: '11px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--color-primary, #3b82f6)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Printer size={16} />
            Print Standee
          </button>

          <button
            onClick={handleShareWhatsApp}
            style={{
              padding: '11px',
              borderRadius: '12px',
              border: 'none',
              background: '#25D366',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <MessageCircle size={16} />
            WhatsApp Share
          </button>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(shopUrl);
            alert('Store link copied to clipboard!');
          }}
          style={{
            width: '100%',
            padding: '9px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Copy Direct Storefront Link
        </button>
      </div>
    </div>
  );
};
