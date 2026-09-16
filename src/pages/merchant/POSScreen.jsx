import { printPOSInvoice } from '../../utils/pdfGenerator';
/**
 * Counter POS (Point of Sale) Screen
 * 
 * Features:
 * 1. Barcode scanner & instant product search.
 * 2. AI Voice POS Billing (speaks items in Hindi/English -> directly added to cart).
 * 3. WhatsApp Parchi Parser (paste grocery list -> converted to cart).
 * 4. Soundbox Audio + Hindi Voice Feedback on payment success.
 * 5. Payment Modes: Cash, UPI, and Udhar Khata.
 * 6. Digital Tax Receipt PDF viewer/printing.
 */

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
import { usePOS } from '../../context/POSContext';
import { productApi } from '../../api/product.api';
import { posApi } from '../../api/pos.api';
import { AppLayout } from '../../components/layout/AppLayout';
import { getImageUrl } from '../../utils/imageUrl';
import { useDebounce } from '../../hooks/useDebounce';
import { Skeleton } from '../../components/ui/Skeleton';
import { playSoundboxTone } from '../../utils/soundbox';
import { AIVoicePOSModal } from '../../components/pos/AIVoicePOSModal';
import { POSParchiModal } from '../../components/pos/POSParchiModal';
import { KhataCustomerPickerModal } from '../../components/merchant/KhataCustomerPickerModal';

export const POSScreen = () => {
  const navigate = useNavigate();
  const { shop } = useAuth();
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
    itemCount,
  } = usePOS();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [billSuccess, setBillSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isParchiModalOpen, setIsParchiModalOpen] = useState(false);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!shop?.slug) return;
    try {
      setLoadingProducts(true);
      const data = await productApi.listByShopSlug(shop.slug);
      setProducts(data.products || data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, [shop?.slug]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      setErrorMessage('');
      const scannedProduct = await productApi.scanProduct(barcodeInput.trim());
      if (scannedProduct) {
        addToCart(scannedProduct, 1);
        playSoundboxTone('credit');
        setBarcodeInput('');
      }
    } catch (err) {
      const match = products.find(
        (p) => p.sku?.toLowerCase() === barcodeInput.trim().toLowerCase()
      );
      if (match) {
        addToCart(match, 1);
        playSoundboxTone('credit');
        setBarcodeInput('');
      } else {
        setErrorMessage(`Barcode "${barcodeInput}" nahi mila`);
      }
    }
  };

  const handleAddItemsFromModal = (items) => {
    items.forEach((item) => {
      addToCart(item.product, item.quantity, item.unitPrice);
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('Cart khali hai, pehle koi saman chuniye');
      return;
    }

    if (paymentMethod === 'credit' && !customerPhone.trim()) {
      setErrorMessage('Khata me udhar likhne ke liye Customer Mobile Number zaroori hai!');
      return;
    }

    try {
      setBillingLoading(true);
      setErrorMessage('');

      const payload = {
        customer_phone: customerPhone.trim() || undefined,
        customer_name: customerName.trim() || undefined,
        discount_amount: Number(discountAmount) || 0,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          custom_price: item.customPrice,
        })),
      };

      const result = await posApi.createSale(payload);
      setBillSuccess(result);

      // Play Soundbox Tone & Hindi Speech Announcement
      const billTotal = result.bill?.final_amount || result.total_amount || total;
      playSoundboxTone(paymentMethod === 'credit' ? 'credit' : 'payment', billTotal);

      clearCart();
    } catch (err) {
      setErrorMessage(err.message || 'Sale record karne me error aaya');
    } finally {
      setBillingLoading(false);
    }
  };

  const debouncedSearch = useDebounce(searchTerm, 200);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch.trim()) return products;
    const s = debouncedSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(s) ||
        p.sku?.toLowerCase().includes(s)
    );
  }, [products, debouncedSearch]);

  return (
    <AppLayout title="Counter POS" subtitle="Tez Billing Terminal">
      <title>POS Counter Billing — ShopSilo Dukan OS</title>

      <div className="pos-screen-layout">
        {/* Left Column: Barcode, Voice/Parchi, Search, & Product Catalog */}
        <div className="pos-catalog-panel">
          {/* Top Quick Actions: Voice POS & Parchi Reader */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
                borderColor: 'rgba(79, 70, 229, 0.25)',
                color: 'var(--color-primary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Mic size={16} />
              <span>Voice POS Billing</span>
            </button>

            <button
              type="button"
              onClick={() => setIsParchiModalOpen(true)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.12) 100%)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
                color: '#059669',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <FileText size={16} />
              <span>WhatsApp Parchi</span>
            </button>
          </div>

          {/* Fast Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} style={{ marginBottom: '12px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Barcode size={20} style={{ position: 'absolute', left: '12px', color: 'var(--color-primary)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                style={{
                  paddingLeft: '40px',
                  paddingRight: barcodeInput ? '36px' : '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-surface)',
                }}
                placeholder="Barcode scan karein ya SKU likh ke Enter dabayein..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => setBarcodeInput('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                  title="Clear barcode"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {/* Search Bar for manual product tap */}
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Product ka naam dhundhein..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-surface)',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Search saaf karein"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {errorMessage && (
            <div
              style={{
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Quick-Tap Catalog */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {searchTerm ? `KHHOJE GAYE SAMAN (${filteredProducts.length})` : `TAP KARKE ADD KAREIN (${filteredProducts.length})`}
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Sabhi Dekhein
                </button>
              )}
            </div>

            <div className="pos-products-grid" style={{ overflowY: 'auto' }}>
              {loadingProducts ? (
                <>
                  <Skeleton height="54px" borderRadius="var(--radius-md)" />
                  <Skeleton height="54px" borderRadius="var(--radius-md)" />
                  <Skeleton height="54px" borderRadius="var(--radius-md)" />
                  <Skeleton height="54px" borderRadius="var(--radius-md)" />
                </>
              ) : filteredProducts.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '24px 12px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Package size={28} style={{ margin: '0 auto 6px auto', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    "{searchTerm}" nahi mila
                  </div>
                  <div style={{ fontSize: '0.74rem', marginTop: '2px', color: 'var(--text-muted)' }}>
                    Naam ya SKU check karein ya search saaf karein
                  </div>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '10px' }}
                    >
                      <RotateCcw size={13} />
                      <span>Search Reset Karein</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.slice(0, 30).map((prod) => (
                  <div
                    key={prod.id}
                    className="card-clickable"
                    onClick={() => {
                      addToCart(prod, 1);
                      playSoundboxTone('credit');
                    }}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 10px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Product Thumbnail */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {prod.image_url ? (
                        <img
                          src={getImageUrl(prod.image_url)}
                          alt={prod.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Package size={18} color="var(--text-muted)" />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--color-primary)', fontWeight: 800 }}>
                          ₹{prod.price}
                        </span>
                        {prod.sku && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-family-mono)' }}>
                            {prod.sku}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: POS Cart & Checkout */}
        <div className="pos-cart-panel card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={20} color="var(--color-primary)" />
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>Grahak Ka Thela ({itemCount})</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.72rem', padding: '3px 8px', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                Khali Karein
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <Package size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cart Khali Hai</div>
              <div style={{ fontSize: '0.74rem' }}>Samano ko barcode scan ya tap karke jodein</div>
            </div>
          ) : (
            <div className="pos-cart-items-list">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    gap: '8px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ₹{item.customPrice ?? item.product.price} × {item.quantity} = <strong>₹{((item.customPrice ?? item.product.price) * item.quantity).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center', fontSize: '0.85rem' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer Selection & Payment Mode */}
          {cart.length > 0 && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Payment Method Selector */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  Payment Mode (Bhugtan Ka Tarika)
                </label>
                <div className="tab-pills">
                  <button
                    type="button"
                    className={`tab-pill ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    className={`tab-pill ${paymentMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    📱 UPI
                  </button>
                  <button
                    type="button"
                    className={`tab-pill ${paymentMethod === 'credit' ? 'active' : ''}`}
                    onClick={() => {
                      setPaymentMethod('credit');
                      if (!selectedKhataCustomer && !customerPhone) {
                        setIsCustomerPickerOpen(true);
                      }
                    }}
                    style={{ color: paymentMethod === 'credit' ? 'var(--color-danger)' : undefined, fontWeight: 800 }}
                  >
                    📖 Khata Udhar
                  </button>
                </div>
              </div>

              {/* Customer Selector Section */}
              {paymentMethod === 'credit' ? (
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                    Khata Grahak (Customer) *
                  </label>
                  
                  {selectedKhataCustomer ? (
                    <div
                      style={{
                        backgroundColor: '#eff6ff',
                        border: '1.5px solid #bfdbfe',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#3b82f6',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                            }}
                          >
                            {(selectedKhataCustomer.name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e3a8a' }}>
                              {selectedKhataCustomer.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {selectedKhataCustomer.phone || customerPhone}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setIsCustomerPickerOpen(true)}
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700 }}
                          >
                            Badlein
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedKhataCustomer(null);
                              setCustomerPhone('');
                              setCustomerName('');
                            }}
                            className="btn btn-outline"
                            style={{ padding: '3px 6px', fontSize: '0.72rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Grahak hatayein"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderTop: '1px dashed #cbd5e1',
                          paddingTop: '6px',
                        }}
                      >
                        <span style={{ color: '#64748b' }}>
                          Puraana Udhar: <strong style={{ color: '#dc2626' }}>₹{(selectedKhataCustomer.current_balance || 0).toLocaleString('en-IN')}</strong>
                        </span>
                        <span style={{ color: '#1e3a8a' }}>
                          Naya Kul: <strong>₹{((selectedKhataCustomer.current_balance || 0) + total).toLocaleString('en-IN')}</strong>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                      <button
                        type="button"
                        onClick={() => setIsCustomerPickerOpen(true)}
                        className="btn btn-secondary btn-block"
                        style={{
                          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                          borderColor: '#c7d2fe',
                          color: '#4338ca',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          padding: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <UserCheck size={16} />
                        <span>👥 Khata Se Grahak Chunein / Search</span>
                      </button>

                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="tel"
                          placeholder="Ya direct mobile number likhein..."
                          className="form-input"
                          style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Customer Mobile No. (Optional)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="tel"
                      placeholder="Grahak ka mobile number"
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: '0.85rem', flex: 1 }}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomerPickerOpen(true)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                      title="Select customer from Khata"
                    >
                      <User size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Bill Totals */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>Total Amount:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={billingLoading}
                className={`btn btn-block btn-lg ${paymentMethod === 'credit' ? 'btn-danger' : 'btn-success'}`}
                style={{ marginTop: '8px' }}
              >
                {billingLoading ? 'Parchi ban rahi hai...' : `₹${total.toFixed(2)} Ka Bill Banayein`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bill Success Receipt Bottom Sheet */}
      {billSuccess && (
        <div className="modal-backdrop" onClick={() => setBillSuccess(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <CheckCircle size={52} color="var(--color-success)" style={{ margin: '0 auto 8px auto' }} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Bill Ban Gaya!</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Bill Number: <strong>{billSuccess.bill?.bill_number}</strong>
              </p>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  margin: '16px 0',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Amount:</span>
                  <span style={{ fontWeight: 800 }}>₹{billSuccess.bill?.final_amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Payment Mode:</span>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{billSuccess.bill?.payment_method}</span>
                </div>
                {billSuccess.loyalty_points_credited > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Loyalty Points:</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      +{billSuccess.loyalty_points_credited} pts
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => printPOSInvoice({ bill: billSuccess.bill, shop, format: 'thermal' })}
                    className="btn btn-primary"
                    style={{ fontWeight: 800, fontSize: '0.82rem', padding: '10px 8px' }}
                  >
                    <Printer size={16} /> Thermal Print
                  </button>

                  <button
                    type="button"
                    onClick={() => printPOSInvoice({ bill: billSuccess.bill, shop, format: 'standard' })}
                    className="btn btn-secondary"
                    style={{ fontWeight: 800, fontSize: '0.82rem', padding: '10px 8px' }}
                  >
                    <FileText size={16} /> A4 Tax Invoice
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `🛒 *Tax Invoice - ${shop?.name || 'Store'}*\n📄 Bill No: ${billSuccess.bill?.bill_number}\n💰 Amount: ₹${billSuccess.bill?.final_amount}\n💳 Payment: ${(billSuccess.bill?.payment_method || 'cash').toUpperCase()}\n🔗 Digital PDF: ${posApi.getReceiptUrl(billSuccess.bill?.bill_number)}`;
                      window.open(`https://wa.me/${(billSuccess.bill?.customer_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn"
                    style={{ background: '#25D366', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: '0.82rem' }}
                  >
                    <MessageSquare size={16} /> WhatsApp Share
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBillSuccess(null)}
                    style={{ fontWeight: 700 }}
                  >
                    New Bill (+)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Voice POS Modal */}
      <AIVoicePOSModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        inventory={products}
        onAddItems={handleAddItemsFromModal}
      />

      {/* WhatsApp Parchi Modal */}
      <POSParchiModal
        isOpen={isParchiModalOpen}
        onClose={() => setIsParchiModalOpen(false)}
        inventory={products}
        onImportItems={handleAddItemsFromModal}
        onOpenMandiList={() => navigate('/merchant/procurement-list')}
      />

      {/* Khata Customer Choice & Search Modal */}
      <KhataCustomerPickerModal
        isOpen={isCustomerPickerOpen}
        onClose={() => setIsCustomerPickerOpen(false)}
        onSelectCustomer={(cust) => {
          setSelectedKhataCustomer(cust);
          setCustomerPhone(cust.phone);
          setCustomerName(cust.name);
        }}
        currentTotal={total}
      />
    </AppLayout>
  );
};
