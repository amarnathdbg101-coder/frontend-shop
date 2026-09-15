import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  MessageSquare,
  QrCode,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Camera,
  Upload,
  Printer,
  ShieldCheck,
  AlertTriangle,
  X,
  ExternalLink,
  DollarSign,
  Share2,
} from 'lucide-react';
import { khataApi } from '../../api/khata.api';
import { uploadApi } from '../../api/upload.api';
import { useAuth } from '../../context/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { useDebounce } from '../../hooks/useDebounce';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { playSoundboxTone } from '../../utils/soundbox';
import { KhataCustomerQRScannerModal } from '../../components/merchant/KhataCustomerQRScannerModal';
import { getImageUrl } from '../../utils/imageUrl';

export const KhataScreen = () => {
  const { shop } = useAuth();
  const [summary, setSummary] = useState({ total_outstanding_amount: 0, total_customers: 0 });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'due_today' | '0_30' | '30_60' | '60_plus'

  // Selected customer passbook
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [showCounterUpiModal, setShowCounterUpiModal] = useState(false);
  const [showCreditLimitModal, setShowCreditLimitModal] = useState(false);
  const [viewParchiUrl, setViewParchiUrl] = useState(null);

  // Forms
  const [creditForm, setCreditForm] = useState({
    customer_name: '',
    customer_mobile: '',
    amount: '',
    notes: '',
    bill_number: '',
    parchi_image_url: '',
  });
  const [parchiUploading, setParchiUploading] = useState(false);
  const [parchiPreview, setParchiPreview] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'cash',
    notes: '',
    upi_ref_no: '',
  });

  const [newCreditLimit, setNewCreditLimit] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  // Load Khata Summary & Customer list
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

  // Open Customer Passbook
  const handleOpenCustomer = async (cust) => {
    try {
      setSelectedCustomer(cust);
      setLoadingHistory(true);
      const phone = cust.customer_mobile || cust.phone;
      const history = await khataApi.getCustomerKhataHistory(phone);
      setCustomerHistory(history);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // QR Code scanned handler
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
      setShowAddCreditModal(true);
    }
  };

  // Upload Parchi Image
  const handleParchiFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    setParchiPreview(URL.createObjectURL(file));

    try {
      setParchiUploading(true);
      const res = await uploadApi.uploadProductImages([file]);
      const url = res.images?.[0] || '';
      if (url) {
        setCreditForm((prev) => ({ ...prev, parchi_image_url: url }));
      }
    } catch (err) {
      console.warn('Parchi slip upload error:', err);
    } finally {
      setParchiUploading(false);
    }
  };

  // Record Credit (Udhar)
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
      setCreditForm({
        customer_name: '',
        customer_mobile: '',
        amount: '',
        notes: '',
        bill_number: '',
        parchi_image_url: '',
      });
      setParchiPreview(null);
      await loadKhata();
    } catch (err) {
      setError(err.message || 'Udhar add nahi ho saka');
    } finally {
      setActionLoading(false);
    }
  };

  // Record Payment (Jama)
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
        upi_ref_no: paymentForm.upi_ref_no || undefined,
      });
      playSoundboxTone('payment', amt);
      setShowRecordPaymentModal(false);
      setPaymentForm({ amount: '', payment_mode: 'cash', notes: '', upi_ref_no: '' });
      const history = await khataApi.getCustomerKhataHistory(phone);
      setCustomerHistory(history);
      await loadKhata();
    } catch (err) {
      setError(err.message || 'Payment record nahi ho saki');
    } finally {
      setActionLoading(false);
    }
  };

  // Set Credit Limit
  const handleSaveCreditLimit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      setActionLoading(true);
      const phone = selectedCustomer.customer_mobile || selectedCustomer.phone;
      await khataApi.setCreditLimit(phone, newCreditLimit);
      alert('Credit limit safaltapoorvak update ho gayi!');
      setShowCreditLimitModal(false);
      const history = await khataApi.getCustomerKhataHistory(phone);
      setCustomerHistory(history);
      await loadKhata();
    } catch (err) {
      alert('Credit limit update karne me error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // WhatsApp Reminder Link
  const getWhatsAppReminderUrl = (customer) => {
    const shopName = shop?.name || 'Hamari Dukan';
    const cleanPhone = (customer.customer_mobile || customer.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const balance = customer.current_balance || customer.balance || 0;
    const shopVpa = shop?.vpa || shop?.upi_id || '';
    const upiPart = shopVpa ? `\n\nOnline UPI se pay karne ke liye:\nupi://pay?pa=${shopVpa}&am=${balance}&cu=INR` : '';
    const msg = encodeURIComponent(
      `Namaste ${customer.customer_name || customer.name || 'Ji'}! Aapka *${shopName}* par kul *₹${balance}* ka baki udhar hisaab hai. Kripya iska bhugtan karein.${upiPart}\n\nDhanyawad!`
    );
    return `https://wa.me/${phoneWithCountry}?text=${msg}`;
  };

  // WhatsApp Full Statement Link
  const getWhatsAppStatementUrl = (customer, history) => {
    const shopName = shop?.name || 'Hamari Dukan';
    const cleanPhone = (customer.customer_mobile || customer.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const balance = customer.current_balance || customer.balance || 0;

    let text = `📜 *Khata Statement - ${shopName}*\n`;
    text += `Grahak: ${customer.customer_name || customer.name}\n`;
    text += `Kul Baki Udhar: *₹${balance}*\n\n`;
    text += `*Recent Transactions:*\n`;

    const txs = (history?.transactions || []).slice(0, 5);
    txs.forEach((t, i) => {
      const isCredit = t.type === 'GIVE_CREDIT' || t.type === 'credit';
      const date = new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      text += `${i + 1}. ${date}: ${isCredit ? 'Udhar +₹' : 'Jama -₹'}${t.amount} (${t.notes || 'Hisaab'})\n`;
    });

    text += `\nShukriya! Aapka vishwas hamari dukan ki taqat hai.`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  // Dynamic Counter UPI URI
  const getCounterUpiUri = () => {
    if (!selectedCustomer) return '';
    const shopVpa = shop?.vpa || shop?.upi_id || 'paytmqr2810050501011@paytm';
    const shopName = shop?.name || 'Merchant';
    const amt = selectedCustomer.current_balance || selectedCustomer.balance || 0;
    return `upi://pay?pa=${encodeURIComponent(shopVpa)}&pn=${encodeURIComponent(shopName)}&am=${amt}&cu=INR&tn=${encodeURIComponent(`Khata_${selectedCustomer.customer_mobile || 'Payment'}`)}`;
  };

  // Filter Customers based on selected tab
  const filteredCustomers = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return customers.filter((c) => {
      const balance = Number(c.current_balance ?? c.balance ?? 0);
      const promiseDate = c.promise_to_pay_date ? new Date(c.promise_to_pay_date).toISOString().split('T')[0] : null;

      if (selectedFilter === 'due_today') {
        return promiseDate === todayStr && balance > 0;
      }

      const lastDate = c.last_transaction_at || c.updated_at || c.created_at;
      if (!lastDate) return selectedFilter === 'all' || selectedFilter === '0_30';

      const diffDays = Math.floor((now - new Date(lastDate)) / (1000 * 60 * 60 * 24));
      if (selectedFilter === '0_30') return diffDays <= 30;
      if (selectedFilter === '30_60') return diffDays > 30 && diffDays <= 60;
      if (selectedFilter === '60_plus') return diffDays > 60;

      return true;
    });
  }, [customers, selectedFilter]);

  return (
    <AppLayout title="Customer Khata Book" subtitle="Grahako ke Udhar aur Jama ka Bahi-Khata">
      <title>Customer Khata — ShopMe Dukan OS</title>

      {/* Top Summary Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)',
          color: '#ffffff',
          padding: '20px',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '16px',
          boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Market Me Total Baki Udhar
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '2px', letterSpacing: '-0.5px' }}>
              ₹{Number(summary.total_outstanding_amount || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '2px' }}>
              {summary.total_customers || customers.length} grahako ka hisaab darj hai
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowQRScannerModal(true)}
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                fontWeight: 700,
                gap: '6px',
              }}
              title="Scan Customer's My Khata QR"
            >
              <QrCode size={16} />
              <span>Scan Customer QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCreditForm({
                  customer_name: '',
                  customer_mobile: '',
                  amount: '',
                  notes: '',
                  bill_number: '',
                  parchi_image_url: '',
                });
                setParchiPreview(null);
                setShowAddCreditModal(true);
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: '#ffffff',
                color: '#991b1b',
                fontWeight: 800,
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <Plus size={16} />
              <span>+ Naya Udhar Jodein</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => setSelectedFilter('all')}
          className={`btn btn-sm ${selectedFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          Sabhi Grahak ({customers.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('due_today')}
          className={`btn btn-sm ${selectedFilter === 'due_today' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <Calendar size={13} />
          <span>📅 Aaj Ka Promise</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('0_30')}
          className={`btn btn-sm ${selectedFilter === '0_30' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          0-30 Din (Naya)
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('30_60')}
          className={`btn btn-sm ${selectedFilter === '30_60' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          30-60 Din (Overdue)
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('60_plus')}
          className={`btn btn-sm ${selectedFilter === '60_plus' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          60+ Din Purana ⚠️
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="search-box" style={{ marginBottom: '14px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="search"
          placeholder="Grahak ka naam ya phone number likhein..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customers List Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
        {loading ? (
          <div style={{ padding: '16px' }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <BookOpen size={40} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Koi Khata Record Nahi Mila
            </div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              Naya udhar likhne ke liye upar "+ Naya Udhar Jodein" dabayein.
            </div>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const balance = Number(cust.current_balance ?? cust.balance ?? 0);
            const phone = cust.customer_mobile || cust.phone || '';
            const name = cust.customer_name || cust.name || 'Grahak';
            const trustBadge = cust.trust_badge || (balance > 10000 ? 'HIGH_RISK' : 'TRUSTED');
            const promiseDate = cust.promise_to_pay_date;

            // Compute days to promise
            let promiseTag = null;
            if (promiseDate && balance > 0) {
              const diffDays = Math.ceil((new Date(promiseDate) - new Date()) / (1000 * 60 * 60 * 24));
              if (diffDays === 0) {
                promiseTag = <span style={{ color: '#d97706', fontWeight: 800 }}>• 🟡 Due Today</span>;
              } else if (diffDays > 0) {
                promiseTag = <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>• 🟢 Due in {diffDays}d</span>;
              } else {
                promiseTag = <span style={{ color: 'var(--color-danger)', fontWeight: 800 }}>• 🔴 Overdue by {Math.abs(diffDays)}d</span>;
              }
            }

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
                  transition: 'background 0.1s ease',
                }}
                onClick={() => handleOpenCustomer(cust)}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name}
                    </span>
                    {cust.credit_limit > 0 && (
                      <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
                        Limit: ₹{cust.credit_limit}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Phone size={11} /> {phone}
                    </span>
                    {promiseTag}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <div
                      style={{
                        fontSize: '1.08rem',
                        fontWeight: 900,
                        color: balance > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                      }}
                    >
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
                      style={{ padding: '6px 10px', fontSize: '0.74rem', gap: '4px', display: 'flex', alignItems: 'center' }}
                      title="WhatsApp Tagada Reminder Bheinjein"
                    >
                      <MessageSquare size={13} />
                      <span>Tagada</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL 1: CUSTOMER PASSBOOK LEDGER ================= */}
      {selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div
            className="bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="sheet-handle" />

            {/* Customer Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedCustomer.customer_name || selectedCustomer.name}
                  </h3>
                  {selectedCustomer.credit_limit > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      Limit: ₹{selectedCustomer.credit_limit}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedCustomer.customer_mobile || selectedCustomer.phone}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>NET OUTSTANDING</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-danger)' }}>
                  ₹{Number(selectedCustomer.current_balance || selectedCustomer.balance || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Top Ledger Shortcuts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px', margin: '10px 0' }}>
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal(true)}
                className="btn btn-success btn-sm"
                style={{ gap: '4px', fontWeight: 800, fontSize: '0.75rem' }}
              >
                <ArrowDownLeft size={14} />
                <span>Paise Jama</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCounterUpiModal(true)}
                className="btn btn-primary btn-sm"
                style={{ gap: '4px', fontWeight: 800, fontSize: '0.75rem' }}
              >
                <QrCode size={14} />
                <span>Show UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewCreditLimit(String(selectedCustomer.credit_limit || ''));
                  setShowCreditLimitModal(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{ gap: '4px', fontSize: '0.75rem' }}
              >
                <ShieldCheck size={14} />
                <span>Set Limit</span>
              </button>

              <a
                href={getWhatsAppStatementUrl(selectedCustomer, customerHistory)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: '4px', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Share2 size={13} color="#25D366" />
                <span>Share Bill</span>
              </a>
            </div>

            {/* Passbook Transactions Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Passbook load ho rahi hai...</div>
              ) : !customerHistory?.transactions || customerHistory.transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Koi transactions record nahi hain.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customerHistory.transactions.map((tx) => {
                    const isCredit = tx.type === 'GIVE_CREDIT' || tx.type === 'credit';
                    const isDisputed = tx.status === 'DISPUTED';

                    return (
                      <div
                        key={tx.id}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          border: isDisputed ? '1px dashed var(--color-danger)' : '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: isCredit ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                color: isCredit ? 'var(--color-danger)' : 'var(--color-success)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {isCredit ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                {isCredit ? 'Udhar Diya' : 'Jama Hua (Payment)'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontWeight: 900,
                                fontSize: '1rem',
                                color: isCredit ? 'var(--color-danger)' : 'var(--color-success)',
                              }}
                            >
                              {isCredit ? '+' : '-'}₹{tx.amount}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Bal: ₹{tx.balance_after}
                            </div>
                          </div>
                        </div>

                        {tx.notes && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', paddingLeft: '36px' }}>
                            {tx.notes}
                          </div>
                        )}

                        {/* Parchi Photo & Dispute Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingLeft: '36px', fontSize: '0.74rem' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {tx.parchi_image_url && (
                              <button
                                type="button"
                                onClick={() => setViewParchiUrl(getImageUrl(tx.parchi_image_url))}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-primary)',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <ImageIcon size={12} />
                                <span>View Bill Slip</span>
                              </button>
                            )}
                            {tx.payment_mode && !isCredit && (
                              <span style={{ color: 'var(--text-muted)' }}>Mode: {tx.payment_mode}</span>
                            )}
                          </div>

                          {isDisputed && (
                            <span style={{ color: 'var(--color-danger)', fontWeight: 800 }}>
                              ⚠️ Grahak Dispute: "{tx.dispute_reason || 'Disputed'}"
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => setSelectedCustomer(null)}
              >
                Band Karein
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD CREDIT (NAYA UDHAR) WITH PARCHI ================= */}
      {showAddCreditModal && (
        <div className="modal-backdrop" onClick={() => setShowAddCreditModal(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '12px', color: 'var(--color-danger)' }}>
              + Naya Udhar Darj Karein
            </h3>

            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: '8px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddCredit}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Grahak Ka Naam</label>
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
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Mobile Number (10 Digits)</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  className="form-input"
                  placeholder="9876543210"
                  value={creditForm.customer_mobile}
                  onChange={(e) => setCreditForm({ ...creditForm, customer_mobile: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Udhar Amount (₹)</label>
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

              {/* Parchi / Bill Slip Photo Attachment */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Parchi / Bill Slip Photo Proof (Optional)</span>
                  {parchiUploading && <span style={{ color: 'var(--color-primary)' }}>Uploading...</span>}
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                    }}
                  >
                    <Camera size={16} />
                    <span>{parchiPreview ? 'Parchi Badlein' : 'Photo Khinchein / Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleParchiFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {parchiPreview && (
                    <img
                      src={parchiPreview}
                      alt="Parchi preview"
                      style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Notes / Saman Ka Vivaran (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 5kg aata aur 1L sarso tel"
                  value={creditForm.notes}
                  onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-danger btn-block" disabled={actionLoading || parchiUploading}>
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

      {/* ================= MODAL 3: RECORD PAYMENT (PAISE JAMA) ================= */}
      {showRecordPaymentModal && selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setShowRecordPaymentModal(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '12px', color: 'var(--color-success)' }}>
              Paise Jama Karein ({selectedCustomer.customer_name || selectedCustomer.name})
            </h3>

            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: '8px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Jama Amount (₹)</label>
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
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Payment Mode</label>
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
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Notes (Optional)</label>
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

      {/* ================= MODAL 4: COUNTER UPI QR MODAL ================= */}
      {showCounterUpiModal && selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setShowCounterUpiModal(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '20px' }}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Scan & Pay ₹{selectedCustomer.current_balance || selectedCustomer.balance || 0}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Customer ko yeh QR code scan karwayein
            </p>

            <div style={{ margin: '16px auto', display: 'inline-block', backgroundColor: '#fff', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(getCounterUpiUri())}&size=200x200&margin=2`}
                alt="Counter UPI QR"
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {shop?.name || 'Shop'} • {shop?.vpa || 'paytmqr@paytm'}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-block"
              style={{ marginTop: '16px' }}
              onClick={() => setShowCounterUpiModal(false)}
            >
              Band Karein
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: SET CREDIT LIMIT ================= */}
      {showCreditLimitModal && selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setShowCreditLimitModal(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '8px' }}>
              Credit Limit Set Karein ({selectedCustomer.customer_name || selectedCustomer.name})
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Is grahak ke liye maximum udhar cap set karein taaki hadd se zyada udhar na chadh sake.
            </p>

            <form onSubmit={handleSaveCreditLimit}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Maximum Credit Limit (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  className="form-input"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary btn-block" disabled={actionLoading}>
                  {actionLoading ? 'Save ho raha hai...' : 'Limit Save Karein'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreditLimitModal(false)}
                >
                  Radd
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: PARCHI SLIP FULLSCREEN VIEWER ================= */}
      {viewParchiUrl && (
        <div className="modal-backdrop" onClick={() => setViewParchiUrl(null)}>
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              backgroundColor: '#000',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewParchiUrl(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
            <img
              src={viewParchiUrl}
              alt="Physical Parchi Slip"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
            />
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
