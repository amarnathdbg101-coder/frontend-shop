import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  BookOpen,
  Wallet,
  Package,
  TrendingUp,
  QrCode,
  Power,
  AlertTriangle,
  Store,
  ChevronRight,
  ExternalLink,
  Tag,
  Bot,
  Sparkles,
  Settings,
  Volume2,
  Mic,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  MapPin,
  Flame,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { SkeletonStat } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { shopApi } from '../../api/shop.api';
import { posApi } from '../../api/pos.api';
import { khataApi } from '../../api/khata.api';
import { inventoryApi } from '../../api/inventory.api';
import { AppLayout } from '../../components/layout/AppLayout';
import { MerchantCopilotModal } from '../../components/common/MerchantCopilotModal';
import { EditShopModal } from '../../components/common/EditShopModal';
import { AIVoiceKhataModal } from '../../components/merchant/AIVoiceKhataModal';
import { StaffManagementModal } from '../../components/merchant/StaffManagementModal';
import { BulkImportModal } from '../../components/merchant/BulkImportModal';
import { playSoundboxAnnouncement } from '../../utils/soundbox';

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { shop, refreshShop, user } = useAuth();
  const { t, isHindi } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [showEditShopModal, setShowEditShopModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isVoiceKhataOpen, setIsVoiceKhataOpen] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [khataCustomers, setKhataCustomers] = useState([]);

  const [stats, setStats] = useState({
    todaySales: 0,
    todayBills: 0,
    marketUdhar: 0,
    lowStockCount: 0,
    pendingPickups: 0,
    estimatedProfit: 0,
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [posSummary, khataSummary, invSummary] = await Promise.allSettled([
        posApi.getTodaySummary().catch(() => ({ total_sales: 0, total_bills: 0, estimated_profit: 0 })),
        khataApi.getSummary().catch(() => ({ total_market_due: 0, customers_count: 0 })),
        inventoryApi.getLowStockCount().catch(() => ({ low_stock_count: 0 })),
      ]);

      const pos = posSummary.status === 'fulfilled' ? posSummary.value?.data || posSummary.value || {} : {};
      const khata = khataSummary.status === 'fulfilled' ? khataSummary.value?.data || khataSummary.value || {} : {};
      const inv = invSummary.status === 'fulfilled' ? invSummary.value?.data || invSummary.value || {} : {};

      setStats({
        todaySales: Number(pos.total_sales || pos.today_sales || 0),
        todayBills: Number(pos.total_bills || pos.today_orders || 0),
        marketUdhar: Number(khata.total_market_due || khata.total_credit || 0),
        lowStockCount: Number(inv.low_stock_count || inv.count || 0),
        pendingPickups: Number(pos.pending_pickups || 0),
        estimatedProfit: Number(pos.estimated_profit || pos.total_profit || (pos.total_sales ? pos.total_sales * 0.18 : 0)),
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleToggleShopStatus = async () => {
    if (!shop) return;
    try {
      await shopApi.updateShopStatus(!shop.is_active);
      await refreshShop();
    } catch (err) {
      alert(err.response?.data?.message || (isHindi ? 'दुकान की स्थिति बदलने में त्रुटि' : 'Failed to update shop status'));
    }
  };

  const testVoiceSoundbox = () => {
    playSoundboxAnnouncement({
      amount: 150,
      customerName: isHindi ? 'रमेश जी' : 'Ramesh',
      language: isHindi ? 'hi' : 'en',
    });
  };

  return (
    <AppLayout title={shop?.name || t('app_name')} subtitle={isHindi ? 'दुकान डैशबोर्ड एवं बिलिंग टर्मिनल' : 'Store Dashboard & Billing Counter'}>
      {/* Store Header Status Card */}
      <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{shop?.name || t('app_name')}</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {shop?.city ? `${shop.address || ''}, ${shop.city}` : (isHindi ? 'हाइपरलोकल मर्चेंट' : 'Hyperlocal Merchant')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleShopStatus}
              className={`btn btn-sm ${shop?.is_active ? 'btn-success' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
            >
              <Power size={14} />
              <span>{shop?.is_active ? t('common.online') : t('common.offline')}</span>
            </button>

            <button
              onClick={testVoiceSoundbox}
              className="btn btn-secondary btn-sm"
              title={t('soundbox.test_voice')}
            >
              <Volume2 size={16} />
            </button>

            <button
              onClick={() => setShowEditShopModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <Settings size={15} />
              <span>{t('common.edit')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {/* Today's Sales */}
        <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('dashboard.today_sales')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
            ₹{stats.todaySales.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {stats.todayBills} {isHindi ? 'बिल पूर्ण' : 'bills completed'}
          </div>
        </div>

        {/* Estimated Profit */}
        <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('dashboard.net_profit')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-primary)', marginTop: '4px' }}>
            ₹{Math.round(stats.estimatedProfit).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {isHindi ? 'सकल मार्जिन' : 'Estimated gross margin'}
          </div>
        </div>

        {/* Market Udhar / Khata Due */}
        <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('dashboard.total_udhar')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444', marginTop: '4px' }}>
            ₹{stats.marketUdhar.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {isHindi ? 'ग्राहक बकाया' : 'Customer receivable'}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('dashboard.low_stock_items')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: stats.lowStockCount > 0 ? '#f59e0b' : '#10b981', marginTop: '4px' }}>
            {stats.lowStockCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {stats.lowStockCount > 0 ? (isHindi ? 'रीस्टॉक आवश्यक' : 'Restock needed') : (isHindi ? 'स्टॉक पर्याप्त' : 'Stock healthy')}
          </div>
        </div>
      </div>

      {/* Quick Operations Launch Grid */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '14px' }}>
        {t('dashboard.quick_actions')}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {/* POS Fast Billing */}
        <div
          onClick={() => navigate('/merchant/pos')}
          style={{
            backgroundColor: 'var(--bg-card, var(--bg-surface))',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {t('nav.pos')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {isHindi ? 'बारकोड व थर्मल बिलिंग' : 'Barcode & POS checkout'}
            </div>
          </div>
        </div>

        {/* Khata Ledger */}
        <div
          onClick={() => navigate('/merchant/khata')}
          style={{
            backgroundColor: 'var(--bg-card, var(--bg-surface))',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {t('nav.khata')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {isHindi ? 'उधार खाता एवं WhatsApp तकादा' : 'Credit ledger & reminders'}
            </div>
          </div>
        </div>

        {/* Inventory & Stock */}
        <div
          onClick={() => navigate('/merchant/inventory')}
          style={{
            backgroundColor: 'var(--bg-card, var(--bg-surface))',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {t('nav.inventory')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {isHindi ? 'कीमत एवं स्टॉक प्रबंधन' : 'Prices & stock catalog'}
            </div>
          </div>
        </div>

        {/* Staff & Cashiers */}
        <div
          onClick={() => setShowStaffModal(true)}
          style={{
            backgroundColor: 'var(--bg-card, var(--bg-surface))',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {t('nav.staff')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {isHindi ? 'कैशियर पिन एवं अनुमतियां' : 'Cashier PINs & access'}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditShopModal && (
        <EditShopModal
          shop={shop}
          isOpen={showEditShopModal}
          onClose={() => setShowEditShopModal(false)}
          onUpdated={refreshShop}
        />
      )}

      {showStaffModal && (
        <StaffManagementModal
          isOpen={showStaffModal}
          onClose={() => setShowStaffModal(false)}
        />
      )}

      {showBulkImportModal && (
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={loadDashboardData}
        />
      )}
    </AppLayout>
  );
};
export default DashboardScreen;
