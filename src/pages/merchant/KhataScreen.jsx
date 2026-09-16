import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
  QrCode,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { khataApi } from '../../api/khata.api';
import { useLanguage } from '../../context/LanguageContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { KhataCustomerQRScannerModal } from '../../components/merchant/KhataCustomerQRScannerModal';

export const KhataScreen = () => {
  const { t, isHindi } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const fetchKhata = async () => {
    setLoading(true);
    try {
      const res = await khataApi.getCustomers({ search: searchTerm });
      const list = Array.isArray(res?.customers) ? res.customers : (Array.isArray(res) ? res : []);
      setCustomers(list);
    } catch (err) {
      console.error('Failed to load khata customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhata();
  }, [searchTerm]);

  const handleSendReminder = (customer) => {
    const text = isHindi
      ? `नमस्ते ${customer.name} जी, आपकी दुकान पर बकाया राशि ₹${customer.balance || customer.due_amount} है। कृपया जल्द भुगतान करें। धन्यवाद!`
      : `Dear ${customer.name}, your outstanding khata balance is ₹${customer.balance || customer.due_amount}. Please clear at your earliest convenience. Thank you!`;
    window.open(`https://wa.me/91${customer.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <AppLayout title={t('nav.khata')} subtitle={t('khata.subtitle')}>
      {/* Action Header */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t('khata.search_customer')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button onClick={() => setShowScanner(true)} className="btn btn-secondary btn-sm" title={isHindi ? 'क्यूआर स्कैन' : 'Scan QR'}>
          <QrCode size={16} />
        </button>
      </div>

      {/* Customers List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('common.loading')}</div>
      ) : customers.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '14px' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ opacity: 0.4 }} />
          <p style={{ marginTop: '10px' }}>{t('common.no_results')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {customers.map((c) => {
            const bal = Number(c.balance || c.due_amount || 0);
            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--bg-card, var(--bg-surface))',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{c.name}</h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.phone}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: bal > 0 ? '#ef4444' : '#10b981' }}>
                      ₹{Math.abs(bal).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {bal > 0 ? (isHindi ? 'उधार बाकी' : 'Due') : (isHindi ? 'चुकता' : 'Settled')}
                    </div>
                  </div>

                  {bal > 0 && (
                    <button
                      onClick={() => handleSendReminder(c)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#059669' }}
                    >
                      <MessageCircle size={15} />
                      <span>{isHindi ? 'तकादा' : 'Remind'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showScanner && (
        <KhataCustomerQRScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onCustomerFound={(cust) => {
            setShowScanner(false);
            setSearchTerm(cust.phone || cust.name);
          }}
        />
      )}
    </AppLayout>
  );
};
export default KhataScreen;
