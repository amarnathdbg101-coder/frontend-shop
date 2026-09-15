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
  HelpCircle,
  FileText,
  CreditCard,
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
  const [viewParchiUrl, setViewParchiUrl] = useState(null);

  // Express Quick Udhar Modal State
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressCustomer, setExpressCustomer] = useState(null);
  const [expressAmount, setExpressAmount] = useState('');
  const [expressSelectedItems, setExpressSelectedItems] = useState([]);
  const [expressCustomNotes, setExpressCustomNotes] = useState('');
  const [expressParchiUrl, setExpressParchiUrl] = useState('');
  const [expressUploading, setExpressUploading] = useState(false);

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

  // Load Khata Summary & Customer list
  const loadKhata = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const [sumRes, custRes] = await Promise.all([
        khataApi.getSummary().catch(() => ({ total_outstanding_amount: 0, total_customers: 0 })),
        khataApi.listCustomers(query).catch(() => []),
      ]);
      setSummary(sumRes || { total_outstanding_amount: 0, total_customers: 0 });
      const list = Array.isArray(custRes) ? custRes : (custRes?.customers || []);
      setCustomers(list);

      // Auto-select first customer if none selected on desktop
      if (list.length > 0 && !selectedCustomer) {
        handleOpenCustomer(list[0]);
      }
    } catch (err) {
      console.error('Khata load error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer]);

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

  // Open Express Quick Udhar Modal
  const handleOpenExpressModal = (cust) => {
    setExpressCustomer(cust);
    setExpressAmount('');
    setExpressSelectedItems([]);
    setExpressCustomNotes('');
    setExpressParchiUrl('');
    setShowExpressModal(true);
  };

  // QR Code scanned handler
  const handleCustomerScanned = (scannedData) => {
    setShowQRScannerModal(false);
    const cleanPhone = (scannedData.phone || '').replace(/\D/g, '').slice(-10);
    const existing = customers.find(
      (c) => (c.customer_mobile || c.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone
    );

    if (existing) {
      handleOpenExpressModal(existing);
    } else {
      setCreditForm({
        customer_name: scannedData.name || `Customer ${cleanPhone.slice(-4)}`,
        customer_mobile: cleanPhone,
        amount: '',
        notes: '',
        bill_number: '',
        parchi_image_url: '',
      });
      setShowAddCreditModal(true);
    }
  };

  // Trigger 5-Second Undo Toast
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

  // Undo action
  const handlePerformUndo = async () => {
    if (!undoToast) return;
    const { customer, amount, type } = undoToast;
    setUndoToast(null);

    try {
      const phone = customer.customer_mobile || customer.phone;
      if (type === 'CREDIT') {
        await khataApi.recordPayment(phone, {
          customer_name: customer.customer_name || customer.name,
          amount,
          payment_mode: 'reversal',
          notes: 'Auto-Undo typo mistake',
        });
      } else {
        await khataApi.addCredit({
          customer_name: customer.customer_name || customer.name,
          customer_mobile: phone,
          amount,
          notes: 'Auto-Undo payment typo',
        });
      }
      playSoundboxTone('reversal');
      alert('Galti sudhar di gayi hai aur balance restore ho gaya hai.');
      loadKhata(debouncedSearch);
      if (selectedCustomer) handleOpenCustomer(selectedCustomer);
    } catch {
      alert('Undo nahi ho paya. Kripya passbook me jakar check karein.');
    }
  };

  // Submit Express Quick Credit
  const handleExpressSubmit = async (type = 'CREDIT') => {
    const numAmt = parseFloat(expressAmount);
    if (!numAmt || numAmt <= 0) {
      alert('Kripya sahi rakam (amount > ₹0) chunein ya enter karein.');
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

  // Submit Standard Add Credit
  const handleAddCredit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await khataApi.addCredit({
        customer_name: creditForm.customer_name.trim(),
        customer_mobile: creditForm.customer_mobile.trim(),
        amount: parseFloat(creditForm.amount),
        notes: creditForm.notes.trim(),
        bill_number: creditForm.bill_number.trim(),
        parchi_image_url: creditForm.parchi_image_url || undefined,
      });

      playSoundboxTone('credit');
      setShowAddCreditModal(false);
      setCreditForm({ customer_name: '', customer_mobile: '', amount: '', notes: '', bill_number: '', parchi_image_url: '' });
      await loadKhata(debouncedSearch);
      if (selectedCustomer) handleOpenCustomer(selectedCustomer);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Udhar entry darj nahi ho payi.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setActionLoading(true);

    try {
      const phone = selectedCustomer.customer_mobile || selectedCustomer.phone;
      await khataApi.recordPayment(phone, {
        customer_name: selectedCustomer.customer_name || selectedCustomer.name,
        amount: parseFloat(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        notes: paymentForm.notes.trim(),
        upi_ref_no: paymentForm.upi_ref_no.trim(),
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

  // Save Credit Limit
  const handleSaveCreditLimit = async () => {
    if (!selectedCustomer) return;
    const limit = parseFloat(newCreditLimit);
    if (isNaN(limit) || limit < 0) {
      alert('Kripya sahi credit seema amount enter karein.');
      return;
    }

    try {
      const phone = selectedCustomer.customer_mobile || selectedCustomer.phone;
      await khataApi.setCreditLimit(phone, limit);
      alert(`Customer ki Credit Limit ₹${limit.toLocaleString('en-IN')} set ho gayi hai.`);
      setShowCreditLimitModal(false);
      await loadKhata(debouncedSearch);
      handleOpenCustomer(selectedCustomer);
    } catch {
      alert('Credit limit set nahi ho payi.');
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

  // Counter UPI URI
  const counterUpiUri = useMemo(() => {
    if (!selectedCustomer) return '';
    const shopUpi = shop?.upi_id || 'merchant@upi';
    const shopTitle = encodeURIComponent(shop?.name || 'Hamari Dukan');
    const bal = selectedCustomer.current_balance || selectedCustomer.outstanding_amount || 100;
    const mobile = selectedCustomer.customer_mobile || selectedCustomer.phone;
    return `upi://pay?pa=${shopUpi}&pn=${shopTitle}&am=${bal}&cu=INR&tn=${encodeURIComponent(`Khata_${mobile}`)}`;
  }, [selectedCustomer, shop]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Bahi-Khata & Ledger
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Instant 1-Tap udhar, WhatsApp reminders, aur zero-dispute audit trail
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowQRScannerModal(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm rounded-xl border border-gray-200 transition"
              >
                <QrCode className="w-4 h-4 text-gray-600" />
                <span>Scan QR</span>
              </button>

              <button
                onClick={() => {
                  setCreditForm({ customer_name: '', customer_mobile: '', amount: '', notes: '', bill_number: '', parchi_image_url: '' });
                  setShowAddCreditModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-red-200"
              >
                <Plus className="w-4 h-4" />
                <span>+ Naya Khata</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-5 pt-5 border-t border-gray-100">
            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3.5">
              <p className="text-[11px] font-extrabold text-red-600 uppercase tracking-wider">Kul Udhar Baki</p>
              <p className="text-lg sm:text-2xl font-black text-red-700 mt-0.5">
                ₹{(summary?.total_outstanding_amount ?? 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5">
              <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">Total Accounts</p>
              <p className="text-lg sm:text-2xl font-black text-blue-700 mt-0.5">
                {summary?.total_customers ?? customers.length}
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3.5">
              <p className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">📅 Aaj Due</p>
              <p className="text-lg sm:text-2xl font-black text-amber-800 mt-0.5">{dueTodayCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customer by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  selectedFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({customers.length})
              </button>

              <button
                onClick={() => setSelectedFilter('due_today')}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  selectedFilter === 'due_today'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                📅 Due Today ({dueTodayCount})
              </button>

              <button
                onClick={() => setSelectedFilter('high_due')}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  selectedFilter === 'high_due'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                &gt; ₹2k
              </button>
            </div>
          </div>

          {/* Quick Pick Horizontal Strip */}
          {customers.length > 0 && !search && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                Quick Pick:
              </span>
              {customers.slice(0, 8).map((cust) => {
                const bal = cust.current_balance || cust.outstanding_amount || 0;
                const name = cust.customer_name || cust.name || 'Customer';
                return (
                  <button
                    key={cust.id || cust.customer_mobile || cust.phone}
                    onClick={() => handleOpenExpressModal(cust)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 text-left transition shrink-0 group"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-gray-800 group-hover:text-amber-900">{name}</span>
                    <span className={`text-[11px] font-black ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{bal.toLocaleString('en-IN')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Customer Accounts List */}
          <div className="lg:col-span-5 space-y-2.5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredCustomers.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-2">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-700">Koi Khata Account Nahi Mila</p>
                <p className="text-xs text-gray-400">
                  Naya khata shuru karne ke liye upar "+ Naya Khata" dabayein.
                </p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const bal = cust.current_balance || cust.outstanding_amount || 0;
                const isSelected =
                  selectedCustomer &&
                  (selectedCustomer.id === cust.id ||
                    (selectedCustomer.customer_mobile || selectedCustomer.phone) === (cust.customer_mobile || cust.phone));
                const phone = cust.customer_mobile || cust.phone;
                const name = cust.customer_name || cust.name || 'Customer';
                const ptpDate = cust.promise_to_pay_date ? new Date(cust.promise_to_pay_date) : null;
                const isDueToday = ptpDate && ptpDate.toDateString() === new Date().toDateString() && bal > 0;
                const isOverdue = ptpDate && ptpDate < new Date() && bal > 0;

                return (
                  <div
                    key={cust.id || phone}
                    onClick={() => handleOpenCustomer(cust)}
                    className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-50 bg-indigo-50/15'
                        : 'border-gray-200/90 hover:border-gray-300 hover:shadow'
                    }`}
                  >
                    {/* Selected Active Bar Indicator */}
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600" />}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-black flex items-center justify-center text-sm shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm">{name}</h3>
                            {cust.is_registered && (
                              <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                                App User
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium">📞 +91 {phone}</p>

                          {ptpDate && bal > 0 && (
                            <div className="mt-1.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  isOverdue
                                    ? 'bg-red-100 text-red-700'
                                    : isDueToday
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                {isOverdue ? 'Overdue: ' : isDueToday ? 'Due Today: ' : 'Promise: '}
                                {ptpDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-base font-black ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{bal.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {bal > 0 ? 'Udhar Baki' : 'Chukta'}
                        </p>
                      </div>
                    </div>

                    {/* 1-Tap Action Buttons Row */}
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenExpressModal(cust);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition"
                      >
                        <Zap className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                        <span>⚡ 1-Tap Entry</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const text = encodeURIComponent(
                            `Namaste ${name} ji! ${shop?.name || 'Hamari Dukan'} se aapka baki hisab ₹${bal.toLocaleString('en-IN')} hai. Kripya payment karein. Dhanyawad!`
                          );
                          window.open(`https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${text}`, '_blank');
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs rounded-xl border border-green-200 transition"
                        title="WhatsApp Reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Customer Passbook / Bahi-Khata Panna */}
          <div className="lg:col-span-7">
            {!selectedCustomer ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-indigo-200 mx-auto" />
                <h3 className="text-base font-bold text-gray-800">Customer Panna Select Karein</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Left side se kisi bhi customer par click karein unka complete bahi-khata dekhne ke liye.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-5">
                {/* Panna Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-gray-900">
                        {selectedCustomer.customer_name || selectedCustomer.name}
                      </h2>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        Trust: {selectedCustomer.trust_score || 750}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      📞 +91 {selectedCustomer.customer_mobile || selectedCustomer.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCounterUpiModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold hover:bg-green-100 transition"
                      title="Show Live UPI QR on Screen"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Counter QR</span>
                    </button>

                    <button
                      onClick={() => {
                        setNewCreditLimit(selectedCustomer.credit_limit || 5000);
                        setShowCreditLimitModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-100 transition"
                      title="Set Credit Limit"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Limit</span>
                    </button>

                    <button
                      onClick={() => {
                        const phone = selectedCustomer.customer_mobile || selectedCustomer.phone;
                        window.open(khataApi.getStatementPdfUrl(phone), '_blank');
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Big Balance Banner */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50/40 border border-red-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-black tracking-wider text-red-700 uppercase">
                      KUL BAKI (CUSTOMER OWES)
                    </span>
                    <p className="text-3xl font-black text-red-600 mt-0.5">
                      ₹{(selectedCustomer.current_balance || selectedCustomer.outstanding_amount || 0).toLocaleString('en-IN')}
                    </p>
                    {selectedCustomer.credit_limit > 0 && (
                      <p className="text-xs text-gray-500 font-semibold mt-1">
                        Seema: ₹{selectedCustomer.credit_limit.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenExpressModal(selectedCustomer)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>⚡ 1-Tap Entry</span>
                    </button>

                    <button
                      onClick={() => setShowRecordPaymentModal(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Jama (Paise Mile)</span>
                    </button>
                  </div>
                </div>

                {/* Passbook Transactions List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Passbook Transactions History
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">
                      {customerHistory?.transactions?.length || 0} Entries
                    </span>
                  </div>

                  {loadingHistory ? (
                    <SkeletonRow />
                  ) : !customerHistory?.transactions || customerHistory.transactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-100">
                      Is khate me abhi koi transaction record nahi hai.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {customerHistory.transactions.map((tx) => {
                        const isCredit = tx.type === 'GIVE_CREDIT' || tx.type === 'CREDIT';
                        const isPayment = tx.type === 'RECEIVE_PAYMENT' || tx.type === 'PAYMENT';

                        return (
                          <div
                            key={tx.id}
                            className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/60 hover:bg-gray-50 transition flex items-start justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isCredit ? 'bg-red-100 text-red-600' : isPayment ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>

                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-gray-900">
                                  {isCredit ? 'Udhar Diya' : isPayment ? 'Jama Liya' : 'Reversal Entry'}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {new Date(tx.created_at).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {tx.notes && <p className="text-xs text-gray-600 font-medium">📝 {tx.notes}</p>}
                                {tx.bill_number && (
                                  <p className="text-[11px] text-gray-400">Bill #{tx.bill_number}</p>
                                )}

                                {tx.parchi_image_url && (
                                  <button
                                    onClick={() => setViewParchiUrl(tx.parchi_image_url)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100 mt-1"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>Parchi Saboot Dekhein</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className={`text-sm font-black ${isCredit ? 'text-red-600' : 'text-green-600'}`}>
                                {isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                              </p>
                              {tx.balance_after !== undefined && (
                                <p className="text-[10px] text-gray-400 font-bold">Baki: ₹{tx.balance_after}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5-Second Floating Undo Banner */}
        {undoToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in">
            <div>
              <p className="text-xs font-bold text-gray-300">
                {undoToast.type === 'CREDIT' ? 'Udhar Darj Hua' : 'Jama Darj Hua'} ✅
              </p>
              <p className="text-sm font-black text-white">
                {undoToast.customer.customer_name || undoToast.customer.name}: ₹{undoToast.amount.toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={handlePerformUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs rounded-xl transition shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>UNDO</span>
            </button>
            <button onClick={() => setUndoToast(null)} className="text-gray-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODAL 1: ⚡ EXPRESS QUICK UDHAR MODAL */}
        {showExpressModal && expressCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-200">
                    <Zap className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">⚡ Express Quick Khata</h3>
                    <p className="text-xs text-gray-500">1-Tap Fast Udhar & Jama</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExpressModal(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Identity Card */}
              <div className="bg-gray-50 rounded-2xl p-3.5 flex items-center justify-between border border-gray-200">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {expressCustomer.customer_name || expressCustomer.name}
                  </p>
                  <p className="text-xs text-gray-500">📞 +91 {expressCustomer.customer_mobile || expressCustomer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-red-600">
                    ₹{(expressCustomer.current_balance || expressCustomer.outstanding_amount || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Pehle ka Baki</p>
                </div>
              </div>

              {/* Big Amount Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  autoFocus
                  value={expressAmount}
                  onChange={(e) => setExpressAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-green-50/50 border-2 border-green-500 rounded-2xl text-2xl font-black text-gray-900 focus:ring-4 focus:ring-green-100 outline-none"
                />
              </div>

              {/* Quick Amount Preset Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">⚡ Quick Amount (1-Tap):</span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(expressAmount) || 0;
                        setExpressAmount(String(cur + amt));
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition"
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Item Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">📦 Samaan (Zero Typing):</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ITEMS.map((item) => {
                    const isSelected = expressSelectedItems.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setExpressSelectedItems((prev) => prev.filter((i) => i !== item));
                          } else {
                            setExpressSelectedItems((prev) => [...prev, item]);
                          }
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2 Big Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleExpressSubmit('CREDIT')}
                  disabled={actionLoading || !expressAmount || parseFloat(expressAmount) <= 0}
                  className="flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-lg shadow-red-200"
                >
                  <ArrowDownLeft className="w-5 h-5" />
                  <span>Udhar Diya (+₹{expressAmount || 0})</span>
                </button>

                <button
                  onClick={() => handleExpressSubmit('PAYMENT')}
                  disabled={actionLoading || !expressAmount || parseFloat(expressAmount) <= 0}
                  className="flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-lg shadow-green-200"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span>Jama Liya (-₹{expressAmount || 0})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: COUNTER UPI QR */}
        {showCounterUpiModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-base">Counter UPI QR Code</h3>
                <button
                  onClick={() => setShowCounterUpiModal(false)}
                  className="p-1 rounded-xl text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Customer ko scan karayein. Payment aate hi hisab update karein.
              </p>

              <div className="p-4 bg-white border-2 border-green-500 rounded-2xl inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(counterUpiUri)}&size=200x200`}
                  alt="Counter UPI QR"
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <div>
                <p className="font-black text-gray-900 text-base">{shop?.name || 'Hamari Dukan'}</p>
                <p className="text-xs text-gray-500">{shop?.upi_id || 'merchant@upi'}</p>
                <p className="text-xl font-black text-green-600 mt-1">
                  ₹{(selectedCustomer.current_balance || selectedCustomer.outstanding_amount || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => setShowCounterUpiModal(false)}
                className="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* MODAL 3: SET CREDIT LIMIT */}
        {showCreditLimitModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-gray-900 text-base">Set Credit Limit (Seema)</h3>
              <p className="text-xs text-gray-500">
                {selectedCustomer.customer_name || selectedCustomer.name} ke liye maximum udhar limit set karein:
              </p>

              <input
                type="number"
                placeholder="e.g. 5000"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreditLimitModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCreditLimit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Save Limit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: RECORD PAYMENT */}
        {showRecordPaymentModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-base">Jama Liya (Record Payment)</h3>
                <button
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Rakam (Amount ₹) *</label>
                  <input
                    type="number"
                    required
                    autoFocus
                    placeholder="₹ 500"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-lg font-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Payment Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['cash', 'upi', 'bank'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentForm((prev) => ({ ...prev, payment_mode: mode }))}
                        className={`py-2 text-xs font-bold rounded-xl border capitalize ${
                          paymentForm.payment_mode === mode
                            ? 'bg-green-50 text-green-700 border-green-300 ring-2 ring-green-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Notes / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Counter payment"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecordPaymentModal(false)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-green-600 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    {actionLoading ? 'Saving...' : 'Jama Record Karein'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: ADD CREDIT (NAYA KHATA) */}
        {showAddCreditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-base">Naya Khata Panna Kholein</h3>
                <button
                  onClick={() => setShowAddCreditModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCredit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Customer Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={creditForm.customer_mobile}
                    onChange={(e) => setCreditForm((prev) => ({ ...prev, customer_mobile: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Sharma"
                    value={creditForm.customer_name}
                    onChange={(e) => setCreditForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Udhar Rakam (Amount ₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="₹ 500"
                    value={creditForm.amount}
                    onChange={(e) => setCreditForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-lg font-black text-red-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Samaan / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 packet doodh, chini"
                    value={creditForm.notes}
                    onChange={(e) => setCreditForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCreditModal(false)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    {actionLoading ? 'Saving...' : 'Udhar Likhein'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PARCHI PREVIEW MODAL */}
        {viewParchiUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900 text-sm">Parchi Saboot (Receipt Proof)</h4>
                <button onClick={() => setViewParchiUrl(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img src={getImageUrl(viewParchiUrl)} alt="Parchi Proof" className="w-full rounded-xl max-h-96 object-contain" />
            </div>
          </div>
        )}

        {/* QR SCANNER MODAL */}
        <KhataCustomerQRScannerModal
          isOpen={showQRScannerModal}
          onClose={() => setShowQRScannerModal(false)}
          onScanSuccess={handleCustomerScanned}
        />
      </div>
    </AppLayout>
  );
};
export default KhataScreen;
