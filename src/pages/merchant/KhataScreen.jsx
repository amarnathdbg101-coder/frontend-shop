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
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Camera,
  Upload,
  Printer,
  ShieldCheck,
  AlertTriangle,
  X,
  Share2,
  Zap,
  RotateCcw,
  Sliders,
  ChevronRight,
  User,
  FileText,
  CreditCard,
  Mic,
  Sparkles,
  DollarSign,
  Send,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { khataApi } from '../../api/khata.api';
import { RealQRCode } from '../../components/common/RealQRCode';
import { uploadApi } from '../../api/upload.api';
import { useAuth } from '../../context/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { useDebounce } from '../../hooks/useDebounce';
import { playSoundboxTone } from '../../utils/soundbox';
import { KhataCustomerQRScannerModal } from '../../components/merchant/KhataCustomerQRScannerModal';
import { AIVoiceKhataModal } from '../../components/merchant/AIVoiceKhataModal';
import { getImageUrl } from '../../utils/imageUrl';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];
const QUICK_ITEMS = [
  'Doodh (Milk)',
  'Chini (Sugar)',
  'Atta (Flour)',
  'Chawal (Rice)',
  'Tel (Oil)',
  'Biscuits',
  'Sabji',
  'Ration Pack',
  'Daily Need',
];

export const KhataScreen = () => {
  const { shop } = useAuth();
  const [summary, setSummary] = useState({ total_outstanding_amount: 0, total_customers: 0 });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'due_today' | 'high_due'

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
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [viewParchiUrl, setViewParchiUrl] = useState(null);

  // Express Quick Udhar Modal State
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressCustomer, setExpressCustomer] = useState(null);
  const [expressAmount, setExpressAmount] = useState('');
  const [expressSelectedItems, setExpressSelectedItems] = useState([]);
  const [expressCustomNotes, setExpressCustomNotes] = useState('');
  const [expressParchiUrl, setExpressParchiUrl] = useState('');

  // 5-Second Floating Undo Banner State
  const [undoToast, setUndoToast] = useState(null);

  // Forms
  const [creditForm, setCreditForm] = useState({
    customer_name: '',
    customer_mobile: '',
    amount: '',
    notes: '',
    bill_number: '',
    parchi_image_url: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'cash',
    notes: '',
    upi_ref_no: '',
  });

  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 250);

  // Load Khata Data
  const loadKhata = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const [sumRes, custRes] = await Promise.allSettled([
        khataApi.getSummary(),
        khataApi.listCustomers(query),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
      }
      if (custRes.status === 'fulfilled' && custRes.value) {
        const list = Array.isArray(custRes.value) ? custRes.value : custRes.value.customers || [];
        setCustomers(list);
      }
    } catch (err) {
      console.error('Failed to load khata:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKhata(debouncedSearch);
  }, [debouncedSearch, loadKhata]);

  // Load selected customer passbook
  const handleOpenCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setLoadingHistory(true);
    try {
      const phone = cust.customer_mobile || cust.phone;
      const data = await khataApi.getCustomerHistory(phone);
      setCustomerHistory(data);
    } catch (err) {
      console.error('Failed to load passbook:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 5-Second Floating Undo Trigger
  const triggerUndoToast = (cust, amount, type) => {
    if (undoToast?.timer) clearTimeout(undoToast.timer);
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 6000);

    setUndoToast({
      customer: cust,
      amount,
      type,
      timer,
    });
  };

  // Perform Undo
  const handlePerformUndo = async () => {
    if (!undoToast) return;
    const { customer, amount, type } = undoToast;
    setUndoToast(null);

    const phone = customer.customer_mobile || customer.phone;
    const name = customer.customer_name || customer.name || 'Customer';

    try {
      if (type === 'CREDIT') {
        await khataApi.recordPayment(phone, {
          customer_name: name,
          amount,
          payment_mode: 'cash',
          notes: 'Auto-Undo Mistake Reversal',
        });
      } else {
        await khataApi.addCredit({
          customer_name: name,
          customer_mobile: phone,
          amount,
          notes: 'Auto-Undo Payment Reversal',
        });
      }
      playSoundboxTone('reversal');
      alert('Undo Safal! Galti sudhar di gayi hai.');
      await loadKhata(debouncedSearch);
      if (selectedCustomer && (selectedCustomer.customer_mobile || selectedCustomer.phone) === phone) {
        handleOpenCustomer(selectedCustomer);
      }
    } catch {
      alert('Undo nahi ho paya. Passbook me jakar adjustment entry karein.');
    }
  };

  // Voice Khata Callback
  const handleVoiceSuccess = async (parsed) => {
    const custName = parsed.customerName || 'Customer';
    const finalPhone = parsed.customerMobile || (parsed.matchedCustomer ? parsed.matchedCustomer.customer_mobile || parsed.matchedCustomer.phone : '');

    if (!finalPhone || finalPhone.replace(/[^0-9]/g, '').slice(-10).length < 10) {
      // Auto open Add Khata modal prefilled
      setCreditForm({
        customer_name: custName,
        customer_mobile: '',
        amount: parsed.amount || '',
        notes: parsed.items || 'Voice Entry',
        bill_number: '',
        parchi_image_url: '',
      });
      setShowAddCreditModal(true);
      return;
    }

    try {
      if (parsed.type === 'CREDIT') {
        await khataApi.addCredit({
          customer_name: custName,
          customer_mobile: finalPhone,
          amount: parsed.amount,
          notes: parsed.items || 'Voice Entry',
          items_summary: parsed.items || 'Voice Entry',
        });
        playSoundboxTone('credit');
      } else {
        await khataApi.recordPayment(finalPhone, {
          customer_name: custName,
          amount: parsed.amount,
          payment_mode: 'cash',
          notes: parsed.items || 'Voice Payment',
        });
        playSoundboxTone('payment');
      }

      triggerUndoToast({ customer_name: custName, customer_mobile: finalPhone }, parsed.amount, parsed.type);
      await loadKhata(debouncedSearch);
      const newCust = {
        customer_name: custName,
        customer_mobile: finalPhone,
        current_balance: parsed.amount,
      };
      handleOpenCustomer(newCust);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Voice entry darj nahi ho payi.');
    }
  };

  // Open Express Quick Udhar Modal
  const handleOpenExpressModal = (cust) => {
    setExpressCustomer(cust);
    setExpressAmount('');
    setExpressSelectedItems([]);
    setExpressCustomNotes('');
    setExpressParchiUrl('');
    setShowExpressModal(true);
  };

  // Submit Express Quick Credit
  const handleExpressSubmit = async (type = 'CREDIT') => {
    const numAmt = parseFloat(expressAmount);
    if (!numAmt || numAmt <= 0) {
      alert('Kripya sahi rakam (amount > 0) chunein ya enter karein.');
      return;
    }

    const custPhone = expressCustomer.customer_mobile || expressCustomer.phone;
    const custName = expressCustomer.customer_name || expressCustomer.name;
    const creditLimit = expressCustomer.credit_limit || 0;
    const currentBal = expressCustomer.current_balance || expressCustomer.outstanding_amount || 0;

    if (type === 'CREDIT' && creditLimit > 0 && currentBal + numAmt > creditLimit) {
      const confirmExceed = window.confirm(
        `⚠️ Credit Limit Alert: ${custName} ki Seema ₹${creditLimit.toLocaleString('en-IN')} hai. Naya udhar milakar kul baaki ₹${(currentBal + numAmt).toLocaleString('en-IN')} ho jayega.\n\nKya aap phir bhi udhar likhna chahte hain?`
      );
      if (!confirmExceed) return;
    }

    setActionLoading(true);
    const finalNotes = [
      ...expressSelectedItems,
      expressCustomNotes.trim(),
    ].filter(Boolean).join(', ') || 'Express Khata Entry';

    try {
      if (type === 'CREDIT') {
        await khataApi.addCredit({
          customer_name: custName,
          customer_mobile: custPhone,
          amount: numAmt,
          notes: finalNotes,
          parchi_image_url: expressParchiUrl || undefined,
          items_summary: finalNotes,
        });
        playSoundboxTone('credit');
      } else {
        await khataApi.recordPayment(custPhone, {
          customer_name: custName,
          amount: numAmt,
          payment_mode: 'cash',
          notes: finalNotes,
        });
        playSoundboxTone('payment');
      }

      setShowExpressModal(false);
      triggerUndoToast(expressCustomer, numAmt, type);
      await loadKhata(debouncedSearch);
      if (selectedCustomer && (selectedCustomer.customer_mobile || selectedCustomer.phone) === custPhone) {
        handleOpenCustomer(selectedCustomer);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Khata entry darj nahi ho payi.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Standard Add New Khata / Credit
  const handleAddCredit = async (e) => {
    e.preventDefault();
    const cleanMobile = creditForm.customer_mobile.replace(/[^0-9]/g, '').slice(-10);
    if (cleanMobile.length < 10) {
      alert('Kripya 10-digit sahi mobile number enter karein.');
      return;
    }
    const cleanName = creditForm.customer_name.trim();
    if (cleanName.length < 2) {
      alert('Kripya customer ka naam (kam se kam 2 akshar) enter karein.');
      return;
    }
    const amt = parseFloat(creditForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Kripya valid udhar rakam (amount > 0) enter karein.');
      return;
    }

    setActionLoading(true);

    try {
      await khataApi.addCredit({
        customer_name: cleanName,
        customer_mobile: cleanMobile,
        amount: amt,
        notes: creditForm.notes.trim() || 'Naya Khata Account',
        bill_number: creditForm.bill_number.trim(),
        parchi_image_url: creditForm.parchi_image_url || undefined,
      });

      playSoundboxTone('credit');
      setShowAddCreditModal(false);
      setCreditForm({ customer_name: '', customer_mobile: '', amount: '', notes: '', bill_number: '', parchi_image_url: '' });
      await loadKhata(debouncedSearch);
      
      const newCust = {
        customer_name: cleanName,
        customer_mobile: cleanMobile,
        current_balance: amt,
        outstanding_amount: amt,
      };
      setSelectedCustomer(newCust);
      handleOpenCustomer(newCust);
      alert(`✅ ${cleanName} ka naya khata ₹${amt} udhar ke saath ban gaya hai!`);
    } catch (err) {
      console.error('Add credit error:', err);
      alert(err?.response?.data?.message || err?.message || 'Naya khata create nahi ho paya. Kripya check karein.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Kripya sahi jama rakam enter karein.');
      return;
    }

    setActionLoading(true);

    try {
      const phone = selectedCustomer.customer_mobile || selectedCustomer.phone;
      await khataApi.recordPayment(phone, {
        customer_name: selectedCustomer.customer_name || selectedCustomer.name,
        amount: amt,
        payment_mode: paymentForm.payment_mode,
        notes: paymentForm.notes.trim(),
      });

      playSoundboxTone('payment');
      setShowRecordPaymentModal(false);
      setPaymentForm({ amount: '', payment_mode: 'cash', notes: '', upi_ref_no: '' });
      await loadKhata(debouncedSearch);
      handleOpenCustomer(selectedCustomer);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Payment darj nahi ho payi.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const todayStr = new Date().toDateString();
    return customers.filter((cust) => {
      const bal = cust.current_balance || cust.outstanding_amount || 0;
      if (selectedFilter === 'due_today') {
        if (!cust.promise_to_pay_date || bal <= 0) return false;
        const d = new Date(cust.promise_to_pay_date);
        return d.toDateString() === todayStr || d < new Date();
      }
      if (selectedFilter === 'high_due') return bal >= 2000;
      return true;
    });
  }, [customers, selectedFilter]);

  const dueTodayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return customers.filter((c) => {
      const bal = c.current_balance || c.outstanding_amount || 0;
      if (!c.promise_to_pay_date || bal <= 0) return false;
      const d = new Date(c.promise_to_pay_date);
      return d.toDateString() === todayStr || d < new Date();
    }).length;
  }, [customers]);

  return (
    <AppLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* =========================================================================
            1. TOP HEADER & SUMMARY CARD
           ========================================================================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 18px rgba(239, 68, 68, 0.3)',
                }}
              >
                <BookOpen size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                  Customer Bahi-Khata Book
                </h1>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  AI Voice Entry, Express 1-Tap Udhar, WhatsApp Reminders & Digital Passbook
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowVoiceModal(true)}
                style={{
                  padding: '11px 18px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(124, 58, 237, 0.35)',
                }}
              >
                <Mic size={18} />
                <span>🎙️ Bol Kar Likhein</span>
              </button>

              <button
                onClick={() => setShowQRScannerModal(true)}
                style={{
                  padding: '11px 16px',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <QrCode size={18} color="#4f46e5" />
                <span>Scan QR</span>
              </button>

              <button
                onClick={() => {
                  setCreditForm({ customer_name: '', customer_mobile: '', amount: '', notes: '', bill_number: '', parchi_image_url: '' });
                  setShowAddCreditModal(true);
                }}
                style={{
                  padding: '11px 18px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(239, 68, 68, 0.3)',
                }}
              >
                <Plus size={18} />
                <span>+ Naya Khata</span>
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '18px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                Kul Market Udhar Baki
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#991b1b', marginTop: '2px' }}>
                ₹{(summary?.total_outstanding_amount ?? 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '16px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                Total Udhar Accounts
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e40af', marginTop: '2px' }}>
                {summary?.total_customers ?? customers.length}
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>
                ⏰ Aaj Due Date (PTP)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#92400e', marginTop: '2px' }}>
                {dueTodayCount} Customers
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. MASTER-DETAIL SPLIT SCREEN (LEFT: CUSTOMER LIST | RIGHT: PANNA LEDGER)
           ========================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {/* ----------------- LEFT PANEL: CUSTOMERS DIRECTORY ----------------- */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Search Box */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search customer by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 36px 11px 38px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setSelectedFilter('all')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: selectedFilter === 'all' ? 'none' : '1px solid #cbd5e1',
                  backgroundColor: selectedFilter === 'all' ? '#4f46e5' : '#f8fafc',
                  color: selectedFilter === 'all' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                }}
              >
                All ({customers.length})
              </button>
              <button
                onClick={() => setSelectedFilter('due_today')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: selectedFilter === 'due_today' ? 'none' : '1px solid #cbd5e1',
                  backgroundColor: selectedFilter === 'due_today' ? '#d97706' : '#f8fafc',
                  color: selectedFilter === 'due_today' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ⏰ Due Today ({dueTodayCount})
              </button>
              <button
                onClick={() => setSelectedFilter('high_due')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: selectedFilter === 'high_due' ? 'none' : '1px solid #cbd5e1',
                  backgroundColor: selectedFilter === 'high_due' ? '#dc2626' : '#f8fafc',
                  color: selectedFilter === 'high_due' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ⚠️ High Due &gt;₹2k
              </button>
            </div>

            {/* Customers List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  Khata accounts load ho rahe hain...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                  <BookOpen size={40} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ fontWeight: 700, margin: 0 }}>Koi customer nahi mila</p>
                  <span style={{ fontSize: '0.78rem' }}>Naya khata shuru karne ke liye upar "+ Naya Khata" dabayein.</span>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomer && (selectedCustomer.customer_mobile || selectedCustomer.phone) === (cust.customer_mobile || cust.phone);
                  const bal = cust.current_balance || cust.outstanding_amount || 0;
                  const name = cust.customer_name || cust.name || 'Customer';
                  const phone = cust.customer_mobile || cust.phone || '';

                  return (
                    <div
                      key={cust.id || phone}
                      onClick={() => handleOpenCustomer(cust)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '16px',
                        border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: bal > 0 ? '#fee2e2' : '#dcfce7',
                            color: bal > 0 ? '#ef4444' : '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                          }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                            {name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            📱 {phone}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.05rem', color: bal > 0 ? '#dc2626' : '#16a34a' }}>
                          ₹{bal.toLocaleString('en-IN')}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenExpressModal(cust);
                          }}
                          style={{
                            marginTop: '4px',
                            padding: '3px 8px',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fde68a',
                            borderRadius: '6px',
                            color: '#b45309',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Zap size={10} /> + Express
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ----------------- RIGHT PANEL: DETAILED PANNA LEDGER ----------------- */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: '1px solid #e2e8f0',
              minHeight: '600px',
            }}
          >
            {selectedCustomer ? (
              <div>
                {/* Panna Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', paddingBottom: '18px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                        {selectedCustomer.customer_name || selectedCustomer.name}
                      </h2>
                      <span
                        style={{
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        PANNA VERIFIED
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px' }}>
                      📱 {selectedCustomer.customer_mobile || selectedCustomer.phone}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Kul Baaki Balance
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: (selectedCustomer.current_balance || selectedCustomer.outstanding_amount || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                      ₹{(selectedCustomer.current_balance || selectedCustomer.outstanding_amount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Action Bar (Udhar Dena / Jama Lena / WhatsApp) */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => handleOpenExpressModal(selectedCustomer)}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '12px 14px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <ArrowUpRight size={18} />
                    <span>+ Udhar Diya</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentForm({ amount: '', payment_mode: 'cash', notes: '', upi_ref_no: '' });
                      setShowRecordPaymentModal(true);
                    }}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '12px 14px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <ArrowDownLeft size={18} />
                    <span>+ Jama Mila</span>
                  </button>

                  <a
                    href={`https://wa.me/91${(selectedCustomer.customer_mobile || selectedCustomer.phone).replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(
                      `Namaste ${selectedCustomer.customer_name || 'Customer'} ji, ${shop?.name || 'Hamari Dukan'} se aapka khata baki hisab ₹${(
                        selectedCustomer.current_balance || selectedCustomer.outstanding_amount || 0
                      ).toLocaleString('en-IN')} hai. Kripya samay par chukta karein. Dhanyawad!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#25d366',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <MessageSquare size={18} />
                    <span>WhatsApp Reminder</span>
                  </a>

                  <button
                    onClick={() => setShowCounterUpiModal(true)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#f8fafc',
                      color: '#334155',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <QrCode size={18} color="#4f46e5" />
                    <span>Counter UPI QR</span>
                  </button>
                </div>

                {/* Passbook History Ledger */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      📜 Passbook History Ledger
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {customerHistory?.transactions?.length || 0} Entries
                    </span>
                  </div>

                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                      Passbook entries load ho rahi hain...
                    </div>
                  ) : !customerHistory?.transactions || customerHistory.transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                      <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ fontWeight: 700, margin: 0 }}>Abhi koi transaction nahi hua hai</p>
                      <span style={{ fontSize: '0.78rem' }}>Upar diye gaye "+ Udhar Diya" button se pehli entry karein.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {customerHistory.transactions.map((tx) => {
                        const isCredit = tx.type === 'CREDIT' || tx.transaction_type === 'CREDIT' || tx.type === 'DEBIT';
                        return (
                          <div
                            key={tx.id}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '14px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: isCredit ? '#fff8f8' : '#f6fdf9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '10px',
                                  backgroundColor: isCredit ? '#fee2e2' : '#dcfce7',
                                  color: isCredit ? '#ef4444' : '#16a34a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {isCredit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                                  {tx.notes || tx.description || (isCredit ? 'Udhar Saaman' : 'Payment Received')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  {new Date(tx.created_at || tx.date).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {tx.bill_number && ` • Bill #${tx.bill_number}`}
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: isCredit ? '#dc2626' : '#16a34a' }}>
                                  {isCredit ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${tx.amount.toLocaleString('en-IN')}`}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  Bal: ₹{(tx.balance_after || tx.running_balance || 0).toLocaleString('en-IN')}
                                </div>
                              </div>

                              {tx.parchi_image_url && (
                                <button
                                  type="button"
                                  onClick={() => setViewParchiUrl(getImageUrl(tx.parchi_image_url))}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '8px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    cursor: 'pointer',
                                  }}
                                  title="Parchi Photo Dekhein"
                                >
                                  <ImageIcon size={16} color="#4f46e5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '120px 20px', color: '#64748b' }}>
                <BookOpen size={56} color="#cbd5e1" style={{ margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  Customer Panna Chunein
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '6px', maxWidth: '340px', margin: '6px auto 0 auto' }}>
                  Left side se kisi bhi customer par click karein uska bahi-khata ledger aur passbook dekhne ke liye.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. EXPRESS QUICK UDHAR MODAL (ZERO-TYPING 1-TAP ENTRY)
         ========================================================================= */}
      {showExpressModal && expressCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
          onClick={() => setShowExpressModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                  ⚡ Zero-Typing Express Entry
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>
                  {expressCustomer.customer_name || expressCustomer.name}
                </h3>
              </div>
              <button
                onClick={() => setShowExpressModal(false)}
                style={{ padding: '6px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* Amount Input & Preset Chips */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Rakam (Amount ₹) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                placeholder="₹ 0"
                value={expressAmount}
                onChange={(e) => setExpressAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Preset Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setExpressAmount((prev) => String((parseFloat(prev) || 0) + amt))}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      cursor: 'pointer',
                    }}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Item Chips */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Saaman / Items (Quick Select):
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {QUICK_ITEMS.map((item) => {
                  const isSel = expressSelectedItems.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          setExpressSelectedItems((prev) => prev.filter((i) => i !== item));
                        } else {
                          setExpressSelectedItems((prev) => [...prev, item]);
                        }
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: isSel ? '#e0e7ff' : '#ffffff',
                        border: isSel ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                        color: isSel ? '#4338ca' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isSel && '✓ '} {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Koi aur note ya parchi no. (optional)..."
                value={expressCustomNotes}
                onChange={(e) => setExpressCustomNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Action Buttons: Udhar Dena (Red) vs Jama Lena (Green) */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                disabled={actionLoading || !expressAmount || parseFloat(expressAmount) <= 0}
                onClick={() => handleExpressSubmit('CREDIT')}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(239, 68, 68, 0.3)',
                }}
              >
                🔴 Udhar Likhein (Credit)
              </button>

              <button
                type="button"
                disabled={actionLoading || !expressAmount || parseFloat(expressAmount) <= 0}
                onClick={() => handleExpressSubmit('PAYMENT')}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                }}
              >
                🟢 Jama Likhein (Payment)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. 5-SECOND FLOATING UNDO TOAST
         ========================================================================= */}
      {undoToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            zIndex: 9999,
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>
              {undoToast.type === 'CREDIT' ? '🔴 Udhar Darj Hua' : '🟢 Jama Darj Hua'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {undoToast.customer.customer_name || undoToast.customer.name}: ₹{undoToast.amount.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            onClick={handlePerformUndo}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              color: '#f59e0b',
              fontWeight: 900,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={13} /> UNDO
          </button>

          <button
            onClick={() => setUndoToast(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =========================================================================
          5. MODALS (VOICE, QR SCANNER, PARCHI VIEWER, ADD KHATA)
         ========================================================================= */}
      <AIVoiceKhataModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        customers={customers}
        onConfirm={handleVoiceSuccess}
      />

      <KhataCustomerQRScannerModal
        isOpen={showQRScannerModal}
        onClose={() => setShowQRScannerModal(false)}
        onCustomerScanned={(scanned) => {
          setShowQRScannerModal(false);
          const cleanPhone = (scanned.phone || '').replace(/[^0-9]/g, '').slice(-10);
          const found = customers.find((c) => (c.customer_mobile || c.phone || '').includes(cleanPhone));
          if (found) {
            handleOpenCustomer(found);
          } else {
            setCreditForm({
              customer_name: scanned.name || '',
              customer_mobile: cleanPhone,
              amount: '',
              notes: 'QR Scanned Customer',
              bill_number: '',
              parchi_image_url: '',
            });
            setShowAddCreditModal(true);
          }
        }}
      />

      {/* View Parchi Photo Modal */}
      {viewParchiUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setViewParchiUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={viewParchiUrl} alt="Parchi receipt" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px' }} />
            <button
              onClick={() => setViewParchiUrl(null)}
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={20} color="#0f172a" />
            </button>
          </div>
        </div>
      )}

      {/* Add New Customer / Credit Modal */}
      {showAddCreditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
          onClick={() => setShowAddCreditModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Naya Khata Panna Kholein
              </h3>
              <button
                onClick={() => setShowAddCreditModal(false)}
                style={{ padding: '6px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleAddCredit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Customer Ka Naam <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={creditForm.customer_name}
                  onChange={(e) => setCreditForm({ ...creditForm, customer_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  10-Digit Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={creditForm.customer_mobile}
                  onChange={(e) => setCreditForm({ ...creditForm, customer_mobile: e.target.value.replace(/[^0-9]/g, '') })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Pehla Udhar Rakam (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="₹ 0"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem', fontWeight: 800, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Saaman / Items Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 packet doodh, 1kg chini"
                  value={creditForm.notes}
                  onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCreditModal(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {actionLoading ? 'Darj Ho Raha Hai...' : 'Khata Shuru Karein'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
          onClick={() => setShowRecordPaymentModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                  Payment Entry
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>
                  {selectedCustomer.customer_name || selectedCustomer.name}
                </h3>
              </div>
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                style={{ padding: '6px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Jama Rakam (Amount ₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="₹ 0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1.2rem', fontWeight: 900, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Payment Mode
                </label>
                <select
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' }}
                >
                  <option value="cash">💵 Cash / Nagad</option>
                  <option value="upi">📱 UPI / QR Code</option>
                  <option value="card">💳 Card / Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Purana hisab chukta"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {actionLoading ? 'Darj Ho Raha Hai...' : 'Jama Record Karein'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter UPI QR Modal */}
      {showCounterUpiModal && selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
          onClick={() => setShowCounterUpiModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '380px',
              width: '100%',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
              Counter UPI QR Payment
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
              {selectedCustomer.customer_name || 'Grahak'} ({selectedCustomer.customer_mobile}) ke liye
            </p>

            {(() => {
              const merchantUpiId = (shop?.upi_id || '').trim();
              const bal = selectedCustomer.current_balance || selectedCustomer.outstanding_amount || 0;
              const shopTitle = shop?.name || 'Shop';
              const upiUri = merchantUpiId ? `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(shopTitle)}&am=${bal}&cu=INR&tn=${encodeURIComponent(`Khata_${selectedCustomer.customer_mobile || ''}`)}` : '';

              if (!merchantUpiId) {
                return (
                  <div style={{ padding: '16px', backgroundColor: '#fffbeb', borderRadius: '16px', border: '1px solid #fde68a', color: '#92400e', textAlign: 'left', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '6px' }}>⚠️ UPI ID Set Nahi Hai</div>
                    <div style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                      Aapne abhi tak apni dukan ka real UPI ID (jaise: <strong>9876543210@paytm</strong> ya <strong>dukan@okaxis</strong>) profile/settings me add nahi kiya hai.
                    </div>
                    <div style={{ fontSize: '0.76rem', marginTop: '8px', color: '#78350f' }}>
                      Kripya Shop Profile edit karke <strong>Real UPI & QR</strong> tab me apna UPI ID save karein.
                    </div>
                  </div>
                );
              }

              return (
                <>
                  <div
                    style={{
                      width: '210px',
                      height: '210px',
                      margin: '0 auto',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      padding: '8px',
                    }}
                  >
                    <RealQRCode value={upiUri} size={200} logoText="UPI" showDownload={true} downloadFilename="counter-upi-collect" />
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>UPI ID:</span>
                    <strong style={{ fontSize: '0.84rem', color: '#4f46e5' }}>{merchantUpiId}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(merchantUpiId);
                        alert(`UPI ID copy ho gayi: ${merchantUpiId}`);
                      }}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        color: '#4f46e5',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </>
              );
            })()}

            <div style={{ marginTop: '14px', fontSize: '1.3rem', fontWeight: 900, color: '#dc2626' }}>
              ₹{(selectedCustomer.current_balance || selectedCustomer.outstanding_amount || 0).toLocaleString('en-IN')}
            </div>

            <button
              onClick={() => setShowCounterUpiModal(false)}
              style={{
                marginTop: '18px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Band Karein
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
