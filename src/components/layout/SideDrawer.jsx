import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Receipt,
  Package,
  BookOpen,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Store,
  Users,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeLanguageBar } from '../common/ThemeLanguageBar';
import { getImageUrl } from '../../utils/imageUrl';

export const SideDrawer = ({ isOpen, onClose }) => {
  const { user, shop, isAuthenticated, logout } = useAuth();
  const { t, isHindi } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    if (window.confirm(isHindi ? 'क्या आप निश्चित रूप से लॉगआउट करना चाहते हैं?' : 'Are you sure you want to sign out?')) {
      logout();
      onClose();
      navigate('/login');
    }
  };

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <div
        className={`drawer-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside className={`drawer-content ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--color-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                overflow: 'hidden',
              }}
            >
              {shop?.logo_url ? (
                <img src={getImageUrl(shop.logo_url)} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Store size={22} />
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                {shop?.name || t('app_name')}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                {user ? user.full_name || user.name : (isHindi ? 'दुकानदार' : 'Merchant')}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Nav Items */}
        <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px' }}>
          <button className="drawer-nav-item" onClick={() => handleNav('/merchant')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutDashboard size={18} color="var(--color-primary)" />
              <span>{t('nav.dashboard')}</span>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>

          <button className="drawer-nav-item" onClick={() => handleNav('/merchant/pos')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Receipt size={18} color="#10b981" />
              <span>{t('nav.pos')}</span>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>

          <button className="drawer-nav-item" onClick={() => handleNav('/merchant/inventory')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={18} color="#f59e0b" />
              <span>{t('nav.inventory')}</span>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>

          <button className="drawer-nav-item" onClick={() => handleNav('/merchant/khata')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} color="#8b5cf6" />
              <span>{t('nav.khata')}</span>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>

          <button className="drawer-nav-item" onClick={() => handleNav('/merchant/analytics')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={18} color="#06b6d4" />
              <span>{t('nav.analytics')}</span>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>

          <button className="drawer-nav-item" onClick={() => handleNav('/merchant/expenses')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wallet size={18} color="#ec4899" />
              <span>{t('nav.expenses')}</span>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>

          <button className="drawer-nav-item" onClick={() => handleNav('/merchant/pickups')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="#10b981" />
              <span>{t('nav.pickups')}</span>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />

          <ThemeLanguageBar compact={false} />
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer" style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ width: '100%', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogOut size={16} />
              <span>{t('nav.logout')}</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('/login')}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {t('nav.login')}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
export default SideDrawer;
