/**
 * Customer Khata (Udhar & Credit Book) Screen
 * Inspired by: Khatabook, OkCredit
 * 
 * Features:
 * - Grahako ke udhar aur jama ka live bahi-khata
 * - Aging Buckets (All, 0-30 Din, 30-60 Din, 60+ Din Overdue)
 * - Customer QR Scanner Modal Integration (instantly look up by QR code)
 * - 1-Click WhatsApp Payment Reminder button (wa.me link with pre-filled text & UPI)
 * - Soundbox Audio & Voice Feedback on Recording Payment & Credit
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  ArrowDownLeft,
  Phone,
  MessageSquare,
  QrCode,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { khataApi } from '../../api/khata.api';
import { useAuth } from '../../context/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { useDebounce } from '../../hooks/useDebounce';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { playSoundboxTone } from '../../utils/soundbox';
import { KhataCustomerQRScannerModal } from '../../components/merchant/KhataCustomerQRScannerModal';

export const KhataScreen = () => {
  const { shop } = useAuth();
  const [summary, setSummary] = useState({ total_outstanding_amount: 0, total_customers: 0 });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAgingBucket, setSelectedAgingBucket] = useState('all'); // 'all' | '0_30' | '30_60' | '60_plus'

  // Selected customer passbook
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);

  // Forms
  const [creditForm, setCreditForm] = useState({
    customer_name: '',
    customer_mobile: '',
    amount: '',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'cash',
    notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  // Initial data load
  const loadKhata = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const [sumRes, custRes] = await Promise.all([
        khataApi.getSummary().catch(() => ({ total_outstanding_amount: 0, total_customers: 0 })),
        khataApi.listCustomers(query).catch(() => []),
      ]);
      setSummary(sumRes || { total_outstanding_amount: 0, total_customers: 0 });
      setCustomers(Array.isArray(custRes) ? custRes : (custRes?.customers || []));
    } catch (err) {
      console.error('Khata load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKhata(debouncedSearch);
  }, [debouncedSearch, loadKhata]);

  // Grahak ki passbook kholna
  const handleOpenCustomer = async (cust) => {
    try {
      setSelectedCustomer(cust);
      setLoadingHistory(true);
      const history = await khataApi.getCustomerKhataHistory(cust.customer_mobile || cust.phone);
      setCustomerHistory(history);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // QR code scan listener
  const handleCustomerScanned = (scannedData) => {
    const found = customers.find(
      (c) => (c.customer_mobile || c.phone || '').replace(/[^0-9]/g, '').slice(-10) === scannedData.phone
    );
    if (found) {
      handleOpenCustomer(found);
    } else {
      setSearch(scannedData.phone);
      setCreditForm((prev) => ({
        ...prev,
        customer_mobile: scannedData.phone,
        customer_name: scannedData.name || '',
      }));
    }
  };

  // WhatsApp Reminder Link Generator
  const getWhatsAppReminderUrl = (customer) => {
    const shopName = shop?.name || 'Hamari Dukan';
    const cleanPhone = (customer.customer_mobile || customer.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const balance = customer.current_balance || customer.balance || 0;
    const msg = encodeURIComponent(
      `Namaste ${customer.customer_name || customer.name || 'Ji'}! Aapka ${shopName} par kul ₹${balance} ka baki udhar hisaab hai. Kripya iska bhugtan karein. Dhanyawad!`
    );
    return `https://wa.me/${phoneWithCountry}?text=${msg}`;
  };

  // Naya Udhar Save karna
  const handleAddCredit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError('');
      const amt = Number(creditForm.amount);
      await khataApi.recordCredit({
        ...creditForm,
        amount: amt,
      });
      playSoundboxTone('credit', amt);
      setShowAddCreditModal(false);
      setCreditForm({ customer_name: '', customer_mobile: '', amount: '', notes: '' });
      await loadKhata();
    } catch (err) {
      setError(err.message || 'Udhar add nahi ho saka');
    } finally {
      setActionLoading(false);
    }
  };

  // Payment Jama karna
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      setActionLoading(true);
      setError('');
      const amt = Number(paymentForm.amount);
      const phone = selectedCustomer.customer_mobile || selectedCustomer.phone;
      await khataApi.recordPayment(phone, {
        customer_name: selectedCustomer.customer_name || selectedCustomer.name,
        amount: amt,
        payment_mode: paymentForm.payment_mode,
        notes: paymentForm.notes,
      });
      playSoundboxTone('payment', amt);
      setShowRecordPaymentModal(false);
      setPaymentForm({ amount: '', payment_mode: 'cash', notes: '' });
      const history = await khataApi.getCustomerKhataHistory(phone);
      setCustomerHistory(history);
      await loadKhata();
    } catch (err) {
      setError(err.message || 'Payment record nahi ho saki');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter customers by aging bucket
  const filteredCustomers = useMemo(() => {
    if (selectedAgingBucket === 'all') return customers;

    const now = new Date();
    return customers.filter((c) => {
      const lastDate = c.last_transaction_at || c.updated_at || c.created_at;
      if (!lastDate) return selectedAgingBucket === '0_30';

      const diffDays = Math.floor((now - new Date(lastDate)) / (1000 * 60 * 60 * 24));
      if (selectedAgingBucket === '0_30') return diffDays <= 30;
      if (selectedAgingBucket === '30_60') return diffDays > 30 && diffDays <= 60;
      if (selectedAgingBucket === '60_plus') return diffDays > 60;
      return true;
    });
  }, [customers, selectedAgingBucket]);

  return (
    <AppLayout title="Khata Book" subtitle="Grahak Udhar & Jama">
      <title>Customer Khata — ShopMe Dukan OS</title>

      {/* Total Udhar Summary Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
          color: '#ffffff',
          border: 'none',
          padding: '18px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Market Me Baki Total Udhar
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '3px' }}>
              ₹{(summary.total_outstanding_amount || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowQRScannerModal(true)}
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                fontWeight: 700,
                gap: '5px',
              }}
              title="Scan Customer Khata QR"
            >
              <QrCode size={15} />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => setShowAddCreditModal(true)}
              className="btn btn-sm"
              style={{
                backgroundColor: '#ffffff',
                color: '#991b1b',
                fontWeight: 800,
                gap: '5px',
              }}
            >
              <Plus size={15} />
              <span>Naya Udhar Likhein</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aging Buckets Filter Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => setSelectedAgingBucket('all')}
          className={`btn btn-sm ${selectedAgingBucket === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          Sabhi Grahak ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedAgingBucket('0_30')}
          className={`btn btn-sm ${selectedAgingBucket === '0_30' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          0-30 Din (Naya)
        </button>
        <button
          type="button"
          onClick={() => setSelectedAgingBucket('30_60')}
          className={`btn btn-sm ${selectedAgingBucket === '30_60' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          30-60 Din (Overdue)
        </button>
        <button
          type="button"
          onClick={() => setSelectedAgingBucket('60_plus')}
          className={`btn btn-sm ${selectedAgingBucket === '60_plus' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          60+ Din Purana ⚠️
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-box" style={{ marginBottom: '14px' }}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Grahak ka naam ya phone number dhundhein..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customer List */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '16px' }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <BookOpen size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Koi Khata Record Nahi Mila
            </div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              Naya udhar jodne ke liye upar "+ Naya Udhar Likhein" par click karein.
            </div>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const balance = cust.current_balance || cust.balance || 0;
            const phone = cust.customer_mobile || cust.phone || '';
            const name = cust.customer_name || cust.name || 'Grahak';

            return (
              <div
                key={cust.id || phone}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onClick={() => handleOpenCustomer(cust)}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Phone size={12} />
                    <span>{phone}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: balance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      ₹{balance.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {balance > 0 ? 'Udhar Baaki' : 'Chukta'}
                    </div>
                  </div>

                  {balance > 0 && (
                    <a
                      href={getWhatsAppReminderUrl(cust)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="btn btn-sm btn-success"
                      style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px', display: 'flex', alignItems: 'center' }}
                      title="WhatsApp Payment Reminder Bheinjein"
                    >
                      <MessageSquare size={14} />
                      <span>Tagada</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Passbook Modal */}
      {selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {selectedCustomer.customer_name || selectedCustomer.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {selectedCustomer.customer_mobile || selectedCustomer.phone}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Kul Baki Udhar</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-danger)' }}>
                  ₹{(selectedCustomer.current_balance || selectedCustomer.balance || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Actions: Jama Karein vs WhatsApp */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                className="btn btn-success btn-block btn-sm"
                onClick={() => setShowRecordPaymentModal(true)}
                style={{ gap: '6px', fontWeight: 800 }}
              >
                <ArrowDownLeft size={16} /> Paise Jama Karein
              </button>
              <a
                href={getWhatsAppReminderUrl(selectedCustomer)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-block btn-sm"
                style={{ gap: '6px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <MessageSquare size={16} color="#25D366" /> WhatsApp Reminder
              </a>
            </div>

            {/* Passbook History */}
            <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px' }}>
              Transaction Passbook:
            </div>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>Passbook load ho rahi hai...</div>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {customerHistory?.transactions?.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {t.transaction_type === 'credit' ? 'Udhar Diya' : 'Jama Hua (Payment)'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {t.notes || (t.transaction_type === 'payment' ? `Mode: ${t.payment_mode}` : 'POS Billing')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: t.transaction_type === 'credit' ? 'var(--color-danger)' : 'var(--color-success)',
                        }}
                      >
                        {t.transaction_type === 'credit' ? '+' : '-'}₹{t.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn btn-secondary btn-block"
              style={{ marginTop: '16px' }}
              onClick={() => setSelectedCustomer(null)}
            >
              Band Karein
            </button>
          </div>
        </div>
      )}

      {/* Add Credit Modal */}
      {showAddCreditModal && (
        <div className="modal-backdrop" onClick={() => setShowAddCreditModal(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px' }}>Naya Udhar Jodein</h3>
            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: '8px' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleAddCredit}>
              <div className="form-group">
                <label className="form-label">Grahak Ka Naam</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={creditForm.customer_name}
                  onChange={(e) => setCreditForm({ ...creditForm, customer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  placeholder="9876543210"
                  value={creditForm.customer_mobile}
                  onChange={(e) => setCreditForm({ ...creditForm, customer_mobile: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Udhar Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="form-input"
                  placeholder="500"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Atta aur tel liya tha"
                  value={creditForm.notes}
                  onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-danger btn-block" disabled={actionLoading}>
                  {actionLoading ? 'Save ho raha hai...' : 'Udhar Darj Karein'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddCreditModal(false)}
                >
                  Radd
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <div className="modal-backdrop" onClick={() => setShowRecordPaymentModal(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px' }}>
              Paise Jama Karein ({selectedCustomer?.customer_name || selectedCustomer?.name})
            </h3>
            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: '8px' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">Jama Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="form-input"
                  placeholder="Kitna paisa mila?"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-select"
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                >
                  <option value="cash">💵 Cash (Nakad)</option>
                  <option value="upi">📱 UPI (GPay/PhonePe/Paytm)</option>
                  <option value="card">💳 Card</option>
                  <option value="other">Koyi Aur</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aadha hisab chukta kiya"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-success btn-block" disabled={actionLoading}>
                  {actionLoading ? 'Jama ho raha hai...' : 'Jama Confirm Karein'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRecordPaymentModal(false)}
                >
                  Radd
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Khata Customer QR Scanner Modal */}
      <KhataCustomerQRScannerModal
        isOpen={showQRScannerModal}
        onClose={() => setShowQRScannerModal(false)}
        onCustomerScanned={handleCustomerScanned}
      />
    </AppLayout>
  );
};
