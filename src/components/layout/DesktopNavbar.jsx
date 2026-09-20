/**
 * Desktop Top Navbar
 * Clean, modern, responsive app bar with quick action pills and full SideDrawer Menu integration
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  Store,
  Receipt,
  BookOpen,
  Package,
  Tag,
  Bot,
  Sun,
  Moon,
  ExternalLink,
  ChevronDown,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePOS } from '../../context/POSContext';
import { MerchantCopilotModal } from '../common/MerchantCopilotModal';
import { SideDrawer } from './SideDrawer';
import { getImageUrl } from '../../utils/imageUrl';
import { getCustomerStoreUrl } from '../../utils/storeUrl';

export const DesktopNavbar = () => {
  const navigate = useNavigate();
  const { user, shop } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { setLanguage, isHindi } = useLanguage();
  const { itemCount } = usePOS();
  
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="desktop-navbar">
        <div className="desktop-navbar-inner">
          {/* Left Brand & Menu Drawer Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                color: 'var(--text-primary, #0f172a)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={isHindi ? 'सभी फीचर्स और सेटिंग्स मेनू खोलें' : 'Open All Features & Settings Menu'}
            >
              <Menu size={18} color="var(--color-primary, #4f46e5)" />
              <span>{isHindi ? 'मेनू' : 'Menu'}</span>
            </button>

            {/* Shop Brand Logo */}
            <NavLink
              to="/merchant"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
                  flexShrink: 0,
                }}
              >
                <Store size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.96rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    ShopSilo
                  </span>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      color: '#4f46e5',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    MERCHANT
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    maxWidth: '180px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {shop ? shop.name : (isHindi ? 'दुकानदार ओएस' : 'Merchant OS')}
                </div>
              </div>
            </NavLink>
          </div>

          {/* Center: Essential Primary Fast-Access Pills */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-surface-subtle, #f1f5f9)',
              padding: '4px',
              borderRadius: 'var(--radius-full, 9999px)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
            }}
          >
            <NavLink
              to="/merchant"
              end
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
            >
              <span>{isHindi ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </NavLink>

            <NavLink
              to="/merchant/pos"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
            >
              <Receipt size={15} />
              <span>{isHindi ? 'फास्ट बिलिंग' : 'POS Billing'}</span>
              {itemCount > 0 && <span className="nav-badge">{itemCount}</span>}
            </NavLink>

            <NavLink
              to="/merchant/inventory"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
            >
              <Package size={15} />
              <span>{isHindi ? 'सामान व स्टॉक' : 'Inventory'}</span>
            </NavLink>

            <NavLink
              to="/merchant/khata"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
            >
              <BookOpen size={15} />
              <span>{isHindi ? 'खाता बही' : 'Khata'}</span>
            </NavLink>

            {/* All Features Drawer Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-primary, #4f46e5)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <LayoutGrid size={15} />
              <span>{isHindi ? 'अन्य फीचर्स...' : 'All Features...'}</span>
            </button>
          </nav>

          {/* Right Quick Actions & Preferences */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Customer Marketplace Direct Link */}
            <a
              href={getCustomerStoreUrl(shop?.slug || "")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-full)',
                textDecoration: 'none',
                border: '1px solid var(--border-subtle)',
              }}
              title={isHindi ? 'ग्राहक हाइपरलोकल बाजार खोलें' : 'Open Customer Marketplace'}
            >
              <span>🛍️ {isHindi ? 'ग्राहक बाज़ार' : 'Marketplace'}</span>
              <ExternalLink size={12} />
            </a>

            {/* AI Copilot Trigger */}
            <button
              type="button"
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
                type="button"
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
                type="button"
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
              type="button"
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

            {/* Profile Avatar / Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
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
              title={isHindi ? 'मेनू और सेटिंग्स' : 'Menu & Settings'}
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
                  <img loading="lazy" decoding="async" 
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

      {/* Side Navigation Drawer for Desktop, Tablet, and Mobile */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* AI Copilot Modal */}
      <MerchantCopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </>
  );
};
