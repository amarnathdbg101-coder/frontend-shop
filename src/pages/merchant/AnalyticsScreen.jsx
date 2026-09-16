import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { posApi } from '../../api/pos.api';
import { useLanguage } from '../../context/LanguageContext';
import { AppLayout } from '../../components/layout/AppLayout';

export const AnalyticsScreen = () => {
  const { t, isHindi } = useLanguage();
  const [timeRange, setTimeRange] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await posApi.getTodaySummary();
      setData(res?.data || res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = Number(data?.total_sales || 0);
  const totalBills = Number(data?.total_bills || 0);
  const estProfit = Number(data?.estimated_profit || (totalSales * 0.18));

  return (
    <AppLayout title={t('nav.analytics')} subtitle={t('analytics.subtitle')}>
      {/* Time Range Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'today', label: t('analytics.today') },
          { key: 'week', label: t('analytics.this_week') },
          { key: 'month', label: t('analytics.this_month') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTimeRange(tab.key)}
            className={`btn btn-sm ${timeRange === tab.key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('analytics.gross_revenue')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>₹{totalSales.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>{totalBills} {isHindi ? 'बिल पूर्ण' : 'bills'}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('analytics.net_profit_earned')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary)', marginTop: '4px' }}>₹{Math.round(estProfit).toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>{isHindi ? 'अनुमानित मार्जिन' : 'Estimated margin'}</div>
        </div>
      </div>
    </AppLayout>
  );
};
export default AnalyticsScreen;
