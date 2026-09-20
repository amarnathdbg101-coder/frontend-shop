/**
 * Merchant Dashboard Screen (Shopkeeper Main Terminal)
 * 
 * High-Impact Pixel-Perfect Design Matching Shopsilo Mobile OS:
 * - Top Store Card with Brand Icon, Category subtitle, QR Standee & Settings actions
 * - Instant Live Store Online/Offline Toggle Bar
 * - Context Greeting & Live Date Pill
 * - Smart Worklist Card ("Today's focus plan") with progress track & quick task actions
 * - 2x2 Financial & Operational KPI Grid (Sales, Khata Market Debt, Catalog, Stock Alerts)
 * - Customer Discovery & Footfall Card with real-time telemetry stats
 * - Move Faster "Counter Quick Actions" (POS, Scan & Price Check, Add Product, Bulk Import, Voice Khata)
 * - Full modal integrations (QR standee, Voice Khata, Bulk Import, Edit Shop, Side Drawer)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Menu,
  QrCode,
  Settings,
  Power,
  Check,
  ChevronRight,
  BarChart3,
  PackageSearch,
  Tag,
  Truck,
  CreditCard,
  BookOpen,
  Boxes,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Receipt,
  ScanBarcode,
  PackagePlus,
  FileSpreadsheet,
  Mic,
  ExternalLink,
  MapPin,
  Volume2,
  X,
  Plus,
} from 'lucide-react';
import { SkeletonStat } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { shopApi } from '../../api/shop.api';
import { posApi } from '../../api/pos.api';
import { khataApi } from '../../api/khata.api';
import { inventoryApi } from '../../api/inventory.api';
import { productApi } from '../../api/product.api';
import { offersApi } from '../../api/offers.api';
import { reservationApi } from '../../api/reservation.api';
import { AppLayout } from '../../components/layout/AppLayout';
import { SideDrawer } from '../../components/layout/SideDrawer';
import { MerchantCopilotModal } from '../../components/common/MerchantCopilotModal';
import { EditShopModal } from '../../components/common/EditShopModal';
import { AIVoiceKhataModal } from '../../components/merchant/AIVoiceKhataModal';
import { BulkImportModal } from '../../components/merchant/BulkImportModal';
import { ShopQRModal } from '../../components/merchant/ShopQRModal';
import { playSoundboxAnnouncement, speakSoundboxPayment } from '../../utils/soundbox';
import { getImageUrl } from '../../utils/imageUrl';

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { shop, refreshShop, user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [showEditShopModal, setShowEditShopModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isVoiceKhataOpen, setIsVoiceKhataOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);

  const [khataCustomers, setKhataCustomers] = useState([]);
  const [activeOffersCount, setActiveOffersCount] = useState(0);
  const [activeReservations, setActiveReservations] = useState(0);

  const [stats, setStats] = useState({
    todaySales: 0,
    salesCount: 0,
    totalUdhar: 0,
    udharCustomersCount: 0,
    lowStockCount: 0,
    catalogCount: 0,
    netProfit: 0,
  });

  // Local optimistic store status state
  const [localIsOpen, setLocalIsOpen] = useState(shop?.is_active ?? true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  useEffect(() => {
    if (shop) {
      setLocalIsOpen(shop.is_active ?? true);
    }
  }, [shop]);

  // Shop Setup Form State (for unregistered shop owners)
  const [newShop, setNewShop] = useState({
    name: '',
    category: 'General Store / Kirana',
    address: '',
    city: 'Darbhanga',
    phone: user?.phone || '',
    description: '',
    latitude: 26.1542,
    longitude: 85.8918,
  });
  const [creatingShop, setCreatingShop] = useState(false);
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    if (!shop && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setNewShop((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, [shop]);

  // Load consolidated dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!shop) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [posSummary, khataSummary, lowStock, custRes, prodRes, offersRes, resvRes] =
        await Promise.allSettled([
          posApi.getDailySummary(),
          khataApi.getSummary(),
          inventoryApi.getLowStockAlerts(),
          khataApi.getCustomers(),
          shop?.slug ? productApi.listByShopSlug(shop.slug) : Promise.resolve([]),
          shop?.slug ? offersApi.getShopOffers(shop.slug) : Promise.resolve([]),
          reservationApi.listShopReservations(),
        ]);

      let todaySales = 0;
      let salesCount = 0;
      if (posSummary.status === 'fulfilled' && posSummary.value?.data) {
        todaySales = posSummary.value.data.total_sales || 0;
        salesCount = posSummary.value.data.transaction_count || 0;
      }

      let totalUdhar = 0;
      let udharCustomersCount = 0;
      if (khataSummary.status === 'fulfilled' && khataSummary.value?.data) {
        totalUdhar =
          khataSummary.value.data.total_receivable ||
          khataSummary.value.data.total_udhar ||
          0;
        udharCustomersCount = khataSummary.value.data.customer_count || 0;
      }

      let lowStockCount = 0;
      if (lowStock.status === 'fulfilled' && lowStock.value?.data) {
        const items = lowStock.value.data.items || lowStock.value.data || [];
        lowStockCount = Array.isArray(items) ? items.length : 0;
      }

      if (custRes.status === 'fulfilled' && custRes.value?.data) {
        const custs = custRes.value.data.customers || custRes.value.data || [];
        setKhataCustomers(Array.isArray(custs) ? custs : []);
      }

      let catalogCount = 0;
      if (prodRes.status === 'fulfilled') {
        const prods = prodRes.value?.products || prodRes.value?.data || prodRes.value || [];
        catalogCount = Array.isArray(prods) ? prods.length : 0;
      }

      let offersCount = 0;
      if (offersRes.status === 'fulfilled') {
        const ofs = offersRes.value?.offers || offersRes.value?.data || offersRes.value || [];
        offersCount = Array.isArray(ofs) ? ofs.length : 0;
        setActiveOffersCount(offersCount);
      }

      let reservationsCount = 0;
      if (resvRes.status === 'fulfilled') {
        const resvs = resvRes.value?.reservations || resvRes.value?.data || resvRes.value || [];
        reservationsCount = Array.isArray(resvs)
          ? resvs.filter((r) => r.status === 'pending' || r.status === 'ready').length
          : 0;
        setActiveReservations(reservationsCount);
      }

      const estProfit = Math.round(todaySales * 0.18);

      setStats({
        todaySales,
        salesCount,
        totalUdhar,
        udharCustomersCount,
        lowStockCount,
        catalogCount,
        netProfit: estProfit,
      });
    } catch (err) {
      console.error('Dashboard data load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Live Shop Status Toggle (Online / Offline)
  const handleToggleStatus = async () => {
    if (!shop || isTogglingStatus) return;
    const nextStatus = !localIsOpen;
    setLocalIsOpen(nextStatus);
    setIsTogglingStatus(true);
    try {
      await shopApi.toggleShopStatus();
      await refreshShop();
      playSoundboxAnnouncement(
        nextStatus
          ? 'Dukan ab Online hai. Grahak order kar sakte hain.'
          : 'Dukan ab Offline kar di gayi hai.'
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setLocalIsOpen(!nextStatus); // revert on failure
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Soundbox Test Announcement
  const handleTestSoundbox = () => {
    playSoundboxAnnouncement('Shopsilo Soundbox: ₹1,150 prapt hue. Shukriya!');
  };

  // Create Shop Submission
  const handleCreateShop = async (e) => {
    e.preventDefault();
    setSetupError('');
    if (!newShop.name.trim() || !newShop.address.trim()) {
      setSetupError('Kripya dukan ka naam aur pata enter karein.');
      return;
    }

    try {
      setCreatingShop(true);
      await shopApi.createShop(newShop);
      await refreshShop();
    } catch (err) {
      setSetupError(
        err?.response?.data?.message || 'Dukan banate waqt error aaya. Dobara try karein.'
      );
    } finally {
      setCreatingShop(false);
    }
  };

  // Greetings & Today formatted label
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  // Smart Focus Plan Tasks
  const focusTasks = [
    {
      label:
        stats.lowStockCount > 0
          ? `Restock ${stats.lowStockCount} low-stock item${stats.lowStockCount === 1 ? '' : 's'}`
          : 'Inventory looks healthy',
      meta: stats.lowStockCount > 0 ? "Protect today's sales" : 'No urgent stock alerts',
      done: stats.lowStockCount === 0,
      icon: PackageSearch,
      onPress: () => navigate('/merchant/inventory'),
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      label:
        activeReservations > 0
          ? `Prepare ${activeReservations} pickup${activeReservations === 1 ? '' : 's'}`
          : 'Pickup desk is clear',
      meta: activeReservations > 0 ? 'Keep the counter moving' : 'No pending reservations',
      done: activeReservations === 0,
      icon: Truck,
      onPress: () => navigate('/merchant/pickups'),
      color: '#0891b2',
      bgColor: '#ecfeff',
    },
    {
      label: activeOffersCount > 0 ? 'Review live offers' : 'Create a customer offer',
      meta:
        activeOffersCount > 0
          ? `${activeOffersCount} offer${activeOffersCount === 1 ? '' : 's'} active`
          : 'Bring shoppers back today',
      done: activeOffersCount > 0,
      icon: Tag,
      onPress: () => navigate('/merchant/offers'),
      color: '#db2777',
      bgColor: '#fdf2f8',
    },
  ];

  const completedTasks = focusTasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedTasks / focusTasks.length) * 100);

  // If user does not have a registered shop
  if (!shop) {
    return (
      <AppLayout title="Dukan Shuru Karein" showBack={false}>
        <div
          style={{
            maxWidth: '560px',
            margin: '16px auto 0 auto',
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '18px',
            padding: '12px 18px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div
            onClick={() => navigate('/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            title="Meri Profile Dekhein"
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: user?.avatar_url
                  ? 'transparent'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={getImageUrl(user.avatar_url)}
                  alt={user?.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user?.name || user?.full_name)?.charAt(0)?.toUpperCase() || 'M'
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {user?.name || user?.full_name || 'Merchant User'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {user?.phone || user?.email || 'Logged in'} •{' '}
                <span style={{ color: 'var(--color-primary, #4f46e5)', fontWeight: 700 }}>
                  Profile
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '0.76rem', fontWeight: 700, padding: '5px 10px' }}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Kya aap log out karna chahte hain?')) {
                  logout();
                  navigate('/login');
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '5px 8px',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            maxWidth: '560px',
            margin: '20px auto',
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '24px',
            padding: '28px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
                marginBottom: '12px',
              }}
            >
              <Store size={32} />
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 900 }}>
              Apni Dukan Register Karein
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Shopsilo Merchant Terminal se counter billing, khata aur catalog manage karein.
            </p>
          </div>

          {setupError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              {setupError}
            </div>
          )}

          <form onSubmit={handleCreateShop} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Dukan Ka Naam (Shop Name) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Ramesh Kirana & General Store"
                value={newShop.name}
                onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Category
              </label>
              <select
                className="form-input"
                value={newShop.category}
                onChange={(e) => setNewShop({ ...newShop, category: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
              >
                <option value="General Store / Kirana">🏪 General Store / Kirana</option>
                <option value="Electronics & Mobile">📱 Electronics & Mobile</option>
                <option value="Clothing & Fashion">👗 Clothing & Fashion</option>
                <option value="Pharmacy / Medical">💊 Pharmacy / Medical</option>
                <option value="Bakery & Dairy">🥛 Bakery & Dairy</option>
                <option value="Hardware & Tools">🔧 Hardware & Tools</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Dukan Ka Pura Pata (Address) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Shop No. 4, Main Bazar Road"
                value={newShop.address}
                onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  City / Shahar
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Darbhanga"
                  value={newShop.city}
                  onChange={(e) => setNewShop({ ...newShop, city: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Contact Phone
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="10 digit number"
                  value={newShop.phone}
                  onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingShop}
              style={{
                marginTop: '12px',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {creatingShop ? 'Dukan Tayar Ho Rahi Hai...' : '🚀 Dukan Shuru Karein'}
            </button>
          </form>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '780px', margin: '0 auto', paddingBottom: '36px' }}>
        {/* =========================================================================
            1. TOP STORE CARD (BRAND, CATEGORY, QR, SETTINGS & INSTANT TOGGLE)
           ========================================================================= */}
        <div
          style={{
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            padding: '12px 14px',
            marginBottom: '14px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Top Row: Hamburger | Store Brand | Action Icons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            {/* Side Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsSideDrawerOpen(true)}
              aria-label="Open Side Menu"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            >
              <Menu size={18} />
            </button>

            {/* Store Brand Column */}
            <div
              style={{
                flex: 1,
                padding: '0 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                }}
              >
                <Store size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {shop?.name || 'ShopSilo Partner'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  color: '#64748b',
                  letterSpacing: '0.8px',
                  marginTop: '1px',
                  textTransform: 'uppercase',
                }}
              >
                {shop?.category ? shop.category.toUpperCase() : 'SHOP OWNER'}
              </span>
            </div>

            {/* Right Action Icons: QR & Settings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                aria-label="Shop QR Code"
                title="Counter Standee & QR Code"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              >
                <QrCode size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowEditShopModal(true)}
                aria-label="Store Settings"
                title="Dukan Settings & Details"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              >
                <Settings size={15} />
              </button>
            </div>
          </div>

          {/* Bottom Row: Store Open/Closed Toggle Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '8px 12px',
            }}
          >
            {/* Status Live Dot + Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1 }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: localIsOpen ? '#22c55e' : '#ef4444',
                  boxShadow: localIsOpen ? '0 0 8px #22c55e' : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#475569',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {localIsOpen ? 'Store Open • Counter Active' : 'Store Closed Right Now'}
              </span>
            </div>

            {/* OPEN / CLOSED Badge + Smooth Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  padding: '2px 7px',
                  borderRadius: '6px',
                  backgroundColor: localIsOpen ? '#dcfce7' : '#fee2e2',
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    color: localIsOpen ? '#15803d' : '#b91c1c',
                  }}
                >
                  {localIsOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>

              {/* iOS-like Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={localIsOpen}
                disabled={isTogglingStatus}
                onClick={handleToggleStatus}
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '12px',
                  backgroundColor: localIsOpen ? '#15803d' : '#94a3b8',
                  border: 'none',
                  padding: '2px',
                  cursor: isTogglingStatus ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background-color 0.2s',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transform: localIsOpen ? 'translateX(18px)' : 'translateX(0px)',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. CONTEXT GREETING & LIVE DATE
           ========================================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            padding: '0 2px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
              {greeting}, shopkeeper
            </div>
            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#0f172a',
                margin: '2px 0 0 0',
                letterSpacing: '-0.2px',
              }}
            >
              Your store at a glance
            </h2>
          </div>

          <div
            style={{
              backgroundColor: '#eef2ff',
              border: '1px solid #e0e7ff',
              color: '#4f46e5',
              fontSize: '0.76rem',
              fontWeight: 800,
              padding: '5px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {todayLabel}
          </div>
        </div>

        {/* =========================================================================
            3. SMART WORKLIST CARD ("Today's focus plan")
           ========================================================================= */}
        <div
          style={{
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            padding: '14px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          {/* Worklist Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 size={17} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    letterSpacing: '1.1px',
                    color: '#4f46e5',
                    textTransform: 'uppercase',
                  }}
                >
                  SMART WORKLIST
                </div>
                <div
                  style={{
                    fontSize: '0.96rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    marginTop: '1px',
                  }}
                >
                  Today's focus plan
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>
              {completedTasks}/{focusTasks.length} done
            </div>
          </div>

          {/* Slim Progress Track */}
          <div
            style={{
              height: '5px',
              borderRadius: '3px',
              backgroundColor: '#f1f5f9',
              marginTop: '12px',
              marginBottom: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: '#4f46e5',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Task List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {focusTasks.map((task, idx) => {
              const Icon = task.icon;
              return (
                <div
                  key={idx}
                  onClick={task.onPress}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '7px 4px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: task.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {task.done ? (
                      <Check size={15} color="#15803d" />
                    ) : (
                      <Icon size={15} color={task.color} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {task.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {task.meta}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            4. SECTION INTRO: TODAY - "YOUR NUMBERS"
           ========================================================================= */}
        <div style={{ marginBottom: '10px', padding: '0 2px' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 900,
              letterSpacing: '1px',
              color: '#4f46e5',
              textTransform: 'uppercase',
            }}
          >
            TODAY
          </div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#0f172a',
              margin: '2px 0 0 0',
            }}
          >
            Your numbers
          </h3>
        </div>

        {/* =========================================================================
            5. 2x2 FINANCIAL & OPERATIONAL KPI GRID
           ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {/* Card 1: Today Sales */}
          <div
            onClick={() => navigate('/merchant/pos')}
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '13px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '112px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <CreditCard size={18} color="#16a34a" />
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#16a34a',
                  backgroundColor: '#dcfce7',
                  padding: '2px 6px',
                  borderRadius: '6px',
                }}
              >
                Today
              </span>
            </div>

            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#0f172a',
                marginTop: '4px',
              }}
            >
              ₹{stats.todaySales.toLocaleString('en-IN')}
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {stats.salesCount} Sales Bills →
            </div>
          </div>

          {/* Card 2: Market Khata */}
          <div
            onClick={() => navigate('/merchant/khata')}
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '13px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '112px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <BookOpen size={18} color="#dc2626" />
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#dc2626',
                  backgroundColor: '#fee2e2',
                  padding: '2px 6px',
                  borderRadius: '6px',
                }}
              >
                Market
              </span>
            </div>

            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#0f172a',
                marginTop: '4px',
              }}
            >
              ₹{stats.totalUdhar.toLocaleString('en-IN')}
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {stats.udharCustomersCount || khataCustomers.length} Udhar Customers →
            </div>
          </div>

          {/* Card 3: Catalog */}
          <div
            onClick={() => navigate('/merchant/inventory')}
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '13px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '112px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Boxes size={18} color="#2563eb" />
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#2563eb',
                  backgroundColor: '#dbeafe',
                  padding: '2px 6px',
                  borderRadius: '6px',
                }}
              >
                Catalog
              </span>
            </div>

            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#0f172a',
                marginTop: '4px',
              }}
            >
              {stats.catalogCount > 0 ? `${stats.catalogCount} Products` : 'Store Products'}
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              View & Edit Catalog →
            </div>
          </div>

          {/* Card 4: Alerts */}
          <div
            onClick={() => navigate('/merchant/inventory')}
            style={{
              backgroundColor: stats.lowStockCount > 0 ? '#fffbeb' : 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: stats.lowStockCount > 0 ? '1px solid #fde68a' : '1px solid var(--border-subtle, #e2e8f0)',
              padding: '13px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '112px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <AlertTriangle size={18} color="#f59e0b" />
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  padding: '2px 6px',
                  borderRadius: '6px',
                }}
              >
                Alerts
              </span>
            </div>

            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: stats.lowStockCount > 0 ? '#b45309' : '#0f172a',
                marginTop: '4px',
              }}
            >
              {stats.lowStockCount}
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              Items Low on Stock →
            </div>
          </div>
        </div>

        {/* =========================================================================
            6. CUSTOMER DISCOVERY & FOOTFALL CARD
           ========================================================================= */}
        <div
          style={{
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            padding: '14px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          {/* Header with real-time telemetry badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="#eab308" />
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                Customer Discovery & Footfall
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                padding: '3px 8px',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                }}
              />
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#10b981',
                  letterSpacing: '0.4px',
                }}
              >
                Real-Time Telemetry
              </span>
            </div>
          </div>

          {/* 3 Telemetry Stat Boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <div
              onClick={() => navigate('/merchant/pos')}
              style={{
                backgroundColor: '#f8fafc',
                padding: '12px 4px',
                borderRadius: '12px',
                textAlign: 'center',
                minHeight: '84px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4f46e5' }}>
                {stats.salesCount || 0}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                Counter Buyers
              </div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b', marginTop: '1px' }}>
                This week
              </div>
            </div>

            <div
              onClick={() => navigate('/merchant/khata')}
              style={{
                backgroundColor: '#f8fafc',
                padding: '12px 4px',
                borderRadius: '12px',
                textAlign: 'center',
                minHeight: '84px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>
                {khataCustomers.length || stats.udharCustomersCount || 0}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                Khata Active
              </div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b', marginTop: '1px' }}>
                Customers
              </div>
            </div>

            <div
              onClick={() => setShowEditShopModal(true)}
              style={{
                backgroundColor: '#f8fafc',
                padding: '12px 4px',
                borderRadius: '12px',
                textAlign: 'center',
                minHeight: '84px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f59e0b' }}>
                {shop?.rating ? Number(shop.rating).toFixed(1) : '5.0'}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                Customer Rating
              </div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b', marginTop: '1px' }}>
                Verified store
              </div>
            </div>
          </div>

          {/* Discovery Footer Ticker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '10px',
              marginTop: '10px',
            }}
          >
            {activeOffersCount > 0 ? (
              <>
                <Tag size={13} color="#ec4899" />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Active Deals:{' '}
                  <strong style={{ color: '#0f172a' }}>{activeOffersCount} offer(s)</strong> live in
                  customer explore feed
                </span>
              </>
            ) : (
              <>
                <TrendingUp size={13} color="#10b981" />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Local buyers discover your catalog via explore search & counter QR
                </span>
              </>
            )}
          </div>
        </div>

        {/* =========================================================================
            7. SECTION INTRO: MOVE FASTER - "COUNTER QUICK ACTIONS"
           ========================================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '12px',
            marginTop: '4px',
            padding: '0 2px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 900,
                letterSpacing: '1.1px',
                color: '#4f46e5',
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}
            >
              MOVE FASTER
            </div>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#0f172a',
                margin: 0,
              }}
            >
              Counter quick actions
            </h3>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>
            Common tasks
          </span>
        </div>

        {/* =========================================================================
            8. MOVE FASTER ACTION TILES
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          {/* Tool 1: Fast POS Billing */}
          <div
            onClick={() => navigate('/merchant/pos')}
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Receipt size={24} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Fast POS Billing
                </span>
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                  }}
                >
                  Fast Billing
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  margin: '2px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Quick SKU scan, Cash/UPI/Split checkout & WhatsApp receipt
              </p>
            </div>

            <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
          </div>

          {/* Tool 2: Scan & Price Check */}
          <div
            onClick={() => navigate('/merchant/inventory')}
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(124, 58, 237, 0.08)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ScanBarcode size={24} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Scan & Price Check
                </span>
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                  }}
                >
                  Price & Stock
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  margin: '2px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Instant barcode & SKU scanner to verify retail price, MRP & live stock
              </p>
            </div>

            <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
          </div>

          {/* Tool 3: Add New Product */}
          <div
            onClick={() => navigate('/merchant/inventory')}
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(5, 150, 105, 0.08)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PackagePlus size={24} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Add New Product
                </span>
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                  }}
                >
                  Catalog
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  margin: '2px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Add items with prices, categories & stock to your catalog
              </p>
            </div>

            <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
          </div>

          {/* Tool 4: Bulk CSV / Excel Import */}
          <div
            onClick={() => setShowBulkImportModal(true)}
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 132, 199, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={24} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Bulk CSV / Excel Saman Import
                </span>
                <span
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                  }}
                >
                  500+ ITEMS
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  margin: '2px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                1-click upload entire wholesale kirana/electronics inventory from Excel
              </p>
            </div>

            <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
          </div>

          {/* Tool 5: Voice Khata */}
          <div
            onClick={() => setIsVoiceKhataOpen(true)}
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(192, 38, 211, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(192, 38, 211, 0.08)',
                color: '#c026d3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mic size={24} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Bol Kar Khata (Voice AI)
                </span>
                <span
                  style={{
                    backgroundColor: '#9333ea',
                    color: '#ffffff',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                  }}
                >
                  AI VOICE
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  margin: '2px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Speak in Hindi/Bhojpuri to add udhar, jama, or send customer reminders
              </p>
            </div>

            <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
          </div>
        </div>

        {/* =========================================================================
            9. MORE TOOLS BANNER (OPEN SIDE MENU)
           ========================================================================= */}
        <div
          onClick={() => setIsSideDrawerOpen(true)}
          style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface, #ffffff)')}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
              All Dukan Features in Side Menu
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
              Kharcha (Expenses), Asli Munafa, Khata Ledger, Offers & Settings
            </div>
          </div>

          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
        </div>
      </div>

      {/* =========================================================================
          MODALS & OVERLAYS
         ========================================================================= */}
      <SideDrawer isOpen={isSideDrawerOpen} onClose={() => setIsSideDrawerOpen(false)} />

      <ShopQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        shop={shop}
      />

      {showEditShopModal && (
        <EditShopModal
          shop={shop}
          onClose={() => setShowEditShopModal(false)}
          onSuccess={() => {
            setShowEditShopModal(false);
            refreshShop();
          }}
        />
      )}

      {showBulkImportModal && (
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={() => {
            setShowBulkImportModal(false);
            loadDashboardData();
          }}
        />
      )}

      {isVoiceKhataOpen && (
        <AIVoiceKhataModal
          isOpen={isVoiceKhataOpen}
          onClose={() => setIsVoiceKhataOpen(false)}
          onSuccess={() => {
            setIsVoiceKhataOpen(false);
            loadDashboardData();
          }}
        />
      )}

      {isCopilotOpen && (
        <MerchantCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          shop={shop}
          stats={stats}
        />
      )}
    </AppLayout>
  );
};

export default DashboardScreen;
