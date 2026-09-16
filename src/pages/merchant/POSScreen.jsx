import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CheckCircle,
  AlertCircle,
  Printer,
  Package,
  Mic,
  FileText,
  Sparkles,
  BookOpen,
  User,
  UserCheck,
  X,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePOS } from '../../context/POSContext';
import { productApi } from '../../api/product.api';
import { posApi } from '../../api/pos.api';
import { AppLayout } from '../../components/layout/AppLayout';
import { getImageUrl } from '../../utils/imageUrl';
import { useDebounce } from '../../hooks/useDebounce';
import { playSoundboxAnnouncement, playSoundboxTone } from '../../utils/soundbox';
import { printReceiptWindow } from '../../utils/thermalPrinter';
import { offlineSyncQueue } from '../../utils/offlineSyncQueue';
import { AIVoicePOSModal } from '../../components/pos/AIVoicePOSModal';
import { POSParchiModal } from '../../components/pos/POSParchiModal';
import { KhataCustomerPickerModal } from '../../components/merchant/KhataCustomerPickerModal';

export const POSScreen = () => {
  const navigate = useNavigate();
  const { shop } = useAuth();
  const { t, isHindi } = useLanguage();
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    total,
    discountAmount,
    setDiscountAmount,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    selectedKhataCustomer,
    setSelectedKhataCustomer,
    paymentMethod,
    setPaymentMethod,
    amountReceived,
    setAmountReceived,
    changeDue,
  } = usePOS();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);

  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isParchiOpen, setIsParchiOpen] = useState(false);
  const [isKhataPickerOpen, setIsKhataPickerOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productApi.listMyProducts({ search: debouncedSearch, limit: 50 });
      const list = Array.isArray(res?.products) ? res.products : (Array.isArray(res) ? res : []);
      setProducts(list);
    } catch (err) {
      console.error('Failed to load products for POS:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setError('');
    setCompleting(true);

    const salePayload = {
      items: cart.map((item) => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal,
      discount: discountAmount,
      total_amount: total,
      payment_method: paymentMethod,
      customer_phone: customerPhone || undefined,
      customer_name: customerName || undefined,
      khata_customer_id: selectedKhataCustomer?.id || undefined,
      amount_received: Number(amountReceived) || total,
    };

    try {
      let receiptData;
      if (navigator.onLine) {
        const res = await posApi.createSale(salePayload);
        receiptData = res?.data || res;
      } else {
        // Offline Sync Queue
        await offlineSyncQueue.addSale(salePayload);
        receiptData = { ...salePayload, id: 'OFFLINE-' + Date.now(), is_offline: true };
      }

      setLastReceipt(receiptData);
      playSoundboxAnnouncement({
        amount: total,
        customerName: customerName || (isHindi ? 'ग्राहक' : 'Customer'),
        language: isHindi ? 'hi' : 'en',
      });

      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || (isHindi ? 'बिक्री दर्ज करने में त्रुटि' : 'Failed to complete sale'));
    } finally {
      setCompleting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastReceipt) return;
    printReceiptWindow({
      shopName: shop?.name || 'ShopMe Store',
      shopPhone: shop?.phone,
      shopAddress: shop?.address,
      billNumber: lastReceipt.id || 'BILL-' + Date.now(),
      date: new Date().toLocaleString(),
      items: lastReceipt.items || cart,
      subtotal: lastReceipt.subtotal || subtotal,
      discount: lastReceipt.discount || discountAmount,
      total: lastReceipt.total_amount || total,
      paymentMode: lastReceipt.payment_method || paymentMethod,
      customerName: lastReceipt.customer_name || customerName,
    });
  };

  return (
    <AppLayout title={t('nav.pos')} subtitle={isHindi ? 'तीव्र बिलिंग काउंटर एवं रसीद प्रिंटर' : 'Fast POS Counter & Receipt Printer'}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Left Column: Product Search & Quick Catalog */}
        <div>
          {/* Search & Actions Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder={t('pos.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <button
              onClick={() => setIsVoiceOpen(true)}
              className="btn btn-secondary"
              title={t('pos.voice_button')}
              style={{ padding: '8px 12px' }}
            >
              <Mic size={18} color="var(--color-primary)" />
            </button>

            <button
              onClick={() => setIsParchiOpen(true)}
              className="btn btn-secondary"
              title={t('pos.parchi_button')}
              style={{ padding: '8px 12px' }}
            >
              <FileText size={18} color="#10b981" />
            </button>
          </div>

          {/* Product Cards Grid */}
          <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {products.map((p) => {
              const stock = p.stock_quantity ?? p.available_quantity ?? 0;
              const inStock = stock > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  style={{
                    backgroundColor: 'var(--bg-card, var(--bg-surface))',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: inStock ? 'var(--text-secondary)' : '#ef4444', marginTop: '4px' }}>
                      {inStock ? `${stock} ${t('inventory.stock_qty')}` : t('common.offline')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)' }}>₹{p.price}</span>
                    <Plus size={16} color="var(--color-primary)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Current Bill & Checkout */}
        <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{t('pos.cart_summary')}</h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)' }}>
                <RotateCcw size={14} />
                <span>{t('pos.clear_cart')}</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '12px' }}>
              <Receipt size={40} color="var(--text-muted)" style={{ opacity: 0.4 }} />
              <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>{t('pos.cart_empty')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', marginBottom: '14px' }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="btn btn-secondary btn-icon" style={{ width: '26px', height: '26px' }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="btn btn-secondary btn-icon" style={{ width: '26px', height: '26px' }}>
                      <Plus size={12} />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="btn btn-secondary btn-icon" style={{ width: '26px', height: '26px', color: '#ef4444' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Method Selector */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('pos.payment_mode')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
              {['cash', 'upi', 'khata'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(mode);
                    if (mode === 'khata' && !selectedKhataCustomer) {
                      setIsKhataPickerOpen(true);
                    }
                  }}
                  className={`btn btn-sm ${paymentMethod === mode ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ textTransform: 'capitalize', fontWeight: 700 }}
                >
                  {mode === 'cash' ? t('pos.pay_cash') : mode === 'upi' ? t('pos.pay_upi') : t('pos.pay_khata')}
                </button>
              ))}
            </div>
          </div>

          {/* Bill Totals & Submit */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>{t('pos.subtotal')}:</span>
              <span>₹{subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: '12px' }}>
              <span>{t('pos.grand_total')}:</span>
              <span>₹{total}</span>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={completing || cart.length === 0}
              className="btn btn-primary"
              style={{ width: '100%', fontWeight: 800, padding: '12px' }}
            >
              {completing ? t('common.processing') : `${t('pos.complete_sale')} (₹${total})`}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isVoiceOpen && (
        <AIVoicePOSModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          onItemsAdded={(items) => {
            items.forEach((it) => addToCart(it));
            setIsVoiceOpen(false);
          }}
        />
      )}

      {isParchiOpen && (
        <POSParchiModal
          isOpen={isParchiOpen}
          onClose={() => setIsParchiOpen(false)}
          onItemsAdded={(items) => {
            items.forEach((it) => addToCart(it));
            setIsParchiOpen(false);
          }}
        />
      )}

      {isKhataPickerOpen && (
        <KhataCustomerPickerModal
          isOpen={isKhataPickerOpen}
          onClose={() => setIsKhataPickerOpen(false)}
          onSelect={(c) => {
            setSelectedKhataCustomer(c);
            setCustomerName(c.name);
            setCustomerPhone(c.phone);
            setIsKhataPickerOpen(false);
          }}
        />
      )}
    </AppLayout>
  );
};
export default POSScreen;
