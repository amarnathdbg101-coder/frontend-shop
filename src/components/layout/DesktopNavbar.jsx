/**
 * Merchant Desktop Top Navbar Component (Screens >= 1024px)
 * SaaS-grade retail management header with bilingual language switch & quick actions
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Store,
  LayoutDashboard,
  Receipt,
  Package,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Wallet,
  ShieldCheck,
  ExternalLink,
  Sun,
  Moon,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePOS } from '../../context/POSContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getImageUrl } from '../../utils/imageUrl';
import { MerchantCopilotModal } from '../common/MerchantCopilotModal';

export const DesktopNavbar = () => {
  const navigate = useNavigate();
  const { user, shop } = useAuth();
  const { itemCount } = usePOS();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, isHindi } = useLanguage();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <>
      <header className="desktop-navbar" role="banner">
        <div className="desktop-navbar-inner">
          {/* Shop Brand & Status */}
          <div
            onClick={() => navigate('/merchant')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {shop?.name || (isHindi ? 'दुकानदार ओएस' : 'Merchant OS')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: shop?.is_active ? '#10b981' : '#ef4444',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: shop?.is_active ? '#059669' : '#dc2626' }}>
                  {shop?.is_active ? (isHindi ? 'दुकान चालू (Online)' : 'Online Store') : (isHindi ? 'दुकान बंद (Offline)' : 'Offline')}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <NavLink
              to="/merchant"
              end
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={17} />
              <span>{isHindi ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </NavLink>

            <NavLink
              to="/merchant/pos"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Receipt size={17} />
              <span>{isHindi ? 'बिलिंग काउंटर' : 'POS Billing'}</span>
              {itemCount > 0 && <span className="nav-badge" style={{ position: 'static', marginLeft: '4px' }}>{itemCount}</span>}
            </NavLink>

            <NavLink
              to="/merchant/inventory"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Package size={17} />
              <span>{isHindi ? 'स्टॉक एवं उत्पाद' : 'Inventory'}</span>
            </NavLink>

            <NavLink
              to="/merchant/khata"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={17} />
              <span>{isHindi ? 'खाता बही' : 'Khata Ledger'}</span>
            </NavLink>

            <NavLink
              to="/merchant/procurement"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <ClipboardList size={17} />
              <span>{isHindi ? 'मंडी खरीदारी' : 'Procurement'}</span>
            </NavLink>

            <NavLink
              to="/merchant/analytics"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <TrendingUp size={17} />
              <span>{isHindi ? 'मुनाफ़ा' : 'Profit'}</span>
            </NavLink>

            <NavLink
              to="/merchant/expenses"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Wallet size={17} />
              <span>{isHindi ? 'खर्चे' : 'Expenses'}</span>
            </NavLink>

            <NavLink
              to="/merchant/pickups"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <ShieldCheck size={17} />
              <span>{isHindi ? 'पिकअप' : 'Pickups'}</span>
            </NavLink>
          </nav>

          {/* Quick Actions & Preferences */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
            {/* AI Copilot Trigger */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(147, 51, 234, 0.12) 100%)',
                borderColor: 'rgba(79, 70, 229, 0.3)',
                color: 'var(--color-primary)',
                fontWeight: 800,
                fontSize: '0.8rem',
              }}
              title={isHindi ? 'शॉपसिलो एआई असिस्टेंट' : 'ShopSilo AI Assistant'}
            >
              <Bot size={16} />
              <span>{isHindi ? 'एआई कोपायलट' : 'AI Copilot'}</span>
            </button>

            {/* Language Switcher Pill */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '2px',
              }}
              role="radiogroup"
              aria-label="Language selection"
            >
              <button
                onClick={() => setLanguage('hi')}
                style={{
                  border: 'none',
                  background: isHindi ? 'var(--color-primary)' : 'transparent',
                  color: isHindi ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="हिंदी भाषा चुनें"
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                style={{
                  border: 'none',
                  background: !isHindi ? 'var(--color-primary)' : 'transparent',
                  color: !isHindi ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Select English language"
              >
                EN
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
              title={isDark ? (isHindi ? 'लाइट मोड' : 'Light Mode') : (isHindi ? 'डार्क मोड' : 'Dark Mode')}
            >
              {isDark ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} />}
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 10px 4px 4px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  overflow: 'hidden',
                }}
              >
                {user?.avatar_url ? (
                  <img
                    src={getImageUrl(user.avatar_url)}
                    alt={user.name || user.full_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (user?.name || user?.full_name)?.charAt(0)?.toUpperCase() || 'M'
                )}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.name || user?.full_name || (isHindi ? 'मेरी दुकान' : 'My Shop')}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* AI Copilot Modal */}
      <MerchantCopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </>
  );
};
