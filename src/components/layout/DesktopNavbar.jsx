import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  BookOpen,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Store,
  ExternalLink,
  Bot,
  Sun,
  Moon,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { usePOS } from '../../context/POSContext';
import { ThemeLanguageBar } from '../common/ThemeLanguageBar';
import { MerchantCopilotModal } from '../common/MerchantCopilotModal';
import { getImageUrl } from '../../utils/imageUrl';

export const DesktopNavbar = () => {
  const navigate = useNavigate();
  const { user, shop, isOwner } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { itemCount } = usePOS();
  const { t, isHindi } = useLanguage();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <>
      <header className="desktop-navbar" role="banner">
        <div className="desktop-navbar-inner">
          {/* Left: Store Brand & Live Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div
              onClick={() => navigate('/merchant')}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                cursor: 'pointer',
              }}
              title={t('nav.dashboard')}
            >
              <Store size={20} />
            </div>

            <div>
              <div
                onClick={() => navigate('/merchant')}
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                  cursor: 'pointer',
                }}
              >
                {shop?.name || t('app_name')}
              </div>
              <div
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                {isHindi ? 'मर्चेंट बिलिंग ओएस' : 'MERCHANT OS'}
              </div>
            </div>

            {shop && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: shop.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: shop.is_active ? '#065f46' : '#991b1b',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: shop.is_active ? '#10b981' : '#ef4444',
                    boxShadow: shop.is_active ? '0 0 6px #10b981' : 'none',
                  }}
                />
                <span>{shop.is_active ? t('common.online') : t('common.offline')}</span>
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav
            style={{
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
            }}
            aria-label="Merchant desktop navigation"
          >
            <NavLink
              to="/merchant"
              end
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={17} />
              <span>{t('nav.dashboard')}</span>
            </NavLink>

            <NavLink
              to="/merchant/pos"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Receipt size={17} />
              <span>{t('nav.pos')}</span>
              {itemCount > 0 && <span className="desktop-nav-badge">{itemCount}</span>}
            </NavLink>

            <NavLink
              to="/merchant/inventory"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Package size={17} />
              <span>{t('nav.inventory')}</span>
            </NavLink>

            <NavLink
              to="/merchant/khata"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={17} />
              <span>{t('nav.khata')}</span>
            </NavLink>

            <NavLink
              to="/merchant/analytics"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <TrendingUp size={17} />
              <span>{t('nav.analytics')}</span>
            </NavLink>

            <NavLink
              to="/merchant/expenses"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Wallet size={17} />
              <span>{t('nav.expenses')}</span>
            </NavLink>

            <NavLink
              to="/merchant/pickups"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <ShieldCheck size={17} />
              <span>{t('nav.pickups')}</span>
            </NavLink>
          </nav>

          {/* Right: Storefront link, Copilot, Theme toggle, Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* View Customer Storefront */}
            {shop?.slug && (
              <a
                href={`/shop/${shop.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
                title={isHindi ? 'ग्राहक स्टोरफ़्रंट देखें' : 'View Customer Storefront'}
              >
                <ExternalLink size={14} />
                <span>{isHindi ? 'दुकान' : 'Storefront'}</span>
              </a>
            )}

            {/* AI Copilot Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(79, 70, 229, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '7px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title={isHindi ? 'एआई सहायक' : 'AI Copilot'}
            >
              <Bot size={15} />
              <span>{isHindi ? 'एआई सहायक' : 'AI Copilot'}</span>
            </button>

            {/* Compact Theme & Language Bar */}
            <ThemeLanguageBar compact={true} />

            {/* Merchant Profile Avatar */}
            {user ? (
              <button
                onClick={() => navigate('/profile')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: user.avatar_url ? 'transparent' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                  overflow: 'hidden',
                  padding: 0,
                }}
                title={t('nav.settings')}
              >
                {user.avatar_url ? (
                  <img
                    src={getImageUrl(user.avatar_url)}
                    alt={user?.name || user?.full_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (user?.name || user?.full_name)?.charAt(0)?.toUpperCase() || 'M'
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-sm"
              >
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* AI Copilot Modal */}
      {isCopilotOpen && (
        <MerchantCopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
      )}
    </>
  );
};
export default DesktopNavbar;
