/**
 * Shop Owner SideDrawer Component (Dukan OS Navigation)
 * 
 * Pixel-Perfect Match with Shopsilo Mobile OS Side Menu Drawer:
 * - Profile header with avatar, name, email/phone & role badge (SHOP OWNER)
 * - "Aapki Dukan (Tap for Settings)" live status card (Khuli Hai / Band)
 * - Section 1: MAIN BILLING & COUNTER (Dashboard, POS, Catalog, Khata)
 * - Section 2: CATALOG & PROMOTIONS (Add Product, Mandi List, Offers)
 * - Section 3: FINANCE & STORE TOOLS (Expenses, Profit Analytics, Settings, Pickups)
 * - Section 4: CUSTOMER STOREFRONT (Switch to Customer Mode)
 * - Section 5: APPEARANCE (Light, Dark, System 3-pill toggle)
 * - Footer: Merchant OS Hub Banner & Sign Out action
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Home,
  Receipt,
  Boxes,
  BookOpen,
  PackagePlus,
  ClipboardList,
  Tag,
  IndianRupee,
  TrendingUp,
  Settings,
  PackageCheck,
  ShoppingBag,
  Sun,
  Moon,
  Monitor,
  Store,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getImageUrl } from '../../utils/imageUrl';
import { getCustomerStoreUrl } from '../../utils/storeUrl';

export const SideDrawer = ({ isOpen, onClose }) => {
  const { user, shop, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isHindi } = useLanguage();
  const navigate = useNavigate();

  const [systemMode, setSystemMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    if (window.confirm(isHindi ? 'Kya aap sign out karna chahte hain?' : 'Are you sure you want to sign out?')) {
      logout();
      onClose();
      navigate('/login');
    }
  };

  const handleNavigate = (path) => {
    onClose();
    if (path.startsWith('http')) {
      window.open(path, '_blank');
    } else {
      navigate(path);
    }
  };

  const handleThemeChange = (mode) => {
    if (mode === 'system') {
      setSystemMode(true);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setSystemMode(false);
      setTheme(mode);
    }
  };

  const currentThemeMode = systemMode ? 'system' : theme === 'dark' ? 'dark' : 'light';

  const isMerchant = user?.role === 'shop' || user?.role === 'admin' || !!shop;
  const isAdmin = user?.role === 'admin';

  // Navigation Data Groups
  const billingItems = [
    { label: 'Dashboard Overview', path: '/merchant', icon: Home, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)' },
    { label: 'Fast POS Billing', path: '/merchant/pos', icon: Receipt, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' },
    { label: 'Store Product List & Catalog', path: '/merchant/inventory', icon: Boxes, color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
    { label: 'Customer Khata Book', path: '/merchant/khata', icon: BookOpen, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
  ];

  const catalogItems = [
    { label: 'Add New Product', path: '/merchant/inventory', icon: PackagePlus, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
    { label: 'Mandi Khareed List', path: '/merchant/procurement-list', icon: ClipboardList, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' },
    { label: 'Offers & Live Promotions', path: '/merchant/offers', icon: Tag, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  ];

  const financeItems = [
    { label: 'Daily Expenses (Kharcha)', path: '/merchant/expenses', icon: IndianRupee, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
    { label: 'Asli Munafa & Analytics', path: '/merchant/analytics', icon: TrendingUp, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' },
    { label: 'Shop Profile & Settings', path: '/profile', icon: Settings, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
    { label: 'Counter Pickups Desk', path: '/merchant/pickups', icon: PackageCheck, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' },
  ];

  const customerItems = [
    {
      label: 'Switch to Customer Mode',
      path: getCustomerStoreUrl(shop?.slug || ''),
      icon: ShoppingBag,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.22s ease, visibility 0.22s ease',
        }}
      />

      {/* Side Drawer Body */}
      <aside
        className={`side-drawer ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '82vw',
          maxWidth: '320px',
          height: '100vh',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRight: '1px solid var(--border-subtle, #e2e8f0)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '8px 0 32px rgba(0, 0, 0, 0.18)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
      >
        {/* =========================================================================
            1. DRAWER PROFILE HEADER
           ========================================================================= */}
        <div
          style={{
            padding: '16px 16px 14px 16px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            {/* Avatar Image / Circle */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
                border: '1.5px solid #ea580c',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={getImageUrl(user.avatar_url)}
                  alt={user?.name || user?.full_name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user?.name || user?.full_name || shop?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>

            {/* Name, Email & Role Badge */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {shop?.name || user?.name || user?.full_name || 'Valued Shopkeeper'}
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary, #64748b)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '1px',
                }}
              >
                {user?.email || user?.phone || 'omvastralaydbg@gmail.com'}
              </div>

              {/* Role Badge Pill */}
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: isAdmin ? '#fef3c7' : isMerchant ? '#e0e7ff' : '#dcfce7',
                  color: isAdmin ? '#92400e' : isMerchant ? '#3730a3' : '#166534',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginTop: '4px',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                {isAdmin ? 'SUPER-ADMIN' : isMerchant ? 'SHOP OWNER' : 'CUSTOMER'}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Drawer"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #64748b)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* =========================================================================
            2. SCROLLABLE NAVIGATION LIST
           ========================================================================= */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Shop Status Card if Merchant */}
          {isMerchant && (
            <div
              onClick={() => handleNavigate('/profile')}
              style={{
                borderRadius: '12px',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                padding: '12px',
                marginBottom: '10px',
                backgroundColor: 'var(--bg-surface, #ffffff)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface, #ffffff)')}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      color: 'var(--text-secondary, #64748b)',
                      textTransform: 'uppercase',
                    }}
                  >
                    AAPKI DUKAN (TAP FOR SETTINGS)
                  </div>
                  <div
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: 'var(--text-primary, #0f172a)',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {shop?.name || 'hmm'}
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    backgroundColor: shop?.is_active
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: shop?.is_active ? '#10b981' : '#ef4444',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: shop?.is_active ? '#047857' : '#b91c1c',
                    }}
                  >
                    {shop?.is_active ? 'Khuli Hai' : 'Band'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Group 1: MAIN BILLING & COUNTER */}
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: 'var(--text-secondary, #64748b)',
              padding: '0 6px',
              marginBottom: '2px',
              textTransform: 'uppercase',
            }}
          >
            MAIN BILLING & COUNTER
          </div>

          {billingItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                onClick={() => handleNavigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={18} color={item.color} />
                </div>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </span>
                <ChevronRight size={16} color="var(--text-secondary, #94a3b8)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}

          {/* Group 2: CATALOG & PROMOTIONS */}
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: 'var(--text-secondary, #64748b)',
              padding: '0 6px',
              marginTop: '10px',
              marginBottom: '2px',
              textTransform: 'uppercase',
            }}
          >
            CATALOG & PROMOTIONS
          </div>

          {catalogItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                onClick={() => handleNavigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={18} color={item.color} />
                </div>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </span>
                <ChevronRight size={16} color="var(--text-secondary, #94a3b8)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}

          {/* Group 3: FINANCE & STORE TOOLS */}
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: 'var(--text-secondary, #64748b)',
              padding: '0 6px',
              marginTop: '10px',
              marginBottom: '2px',
              textTransform: 'uppercase',
            }}
          >
            FINANCE & STORE TOOLS
          </div>

          {financeItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                onClick={() => handleNavigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={18} color={item.color} />
                </div>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </span>
                <ChevronRight size={16} color="var(--text-secondary, #94a3b8)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}

          {/* Group 4: CUSTOMER STOREFRONT */}
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: 'var(--text-secondary, #64748b)',
              padding: '0 6px',
              marginTop: '10px',
              marginBottom: '2px',
              textTransform: 'uppercase',
            }}
          >
            CUSTOMER STOREFRONT
          </div>

          {customerItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                onClick={() => handleNavigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={18} color={item.color} />
                </div>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </span>
                <ChevronRight size={16} color="var(--text-secondary, #94a3b8)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}

          {/* Group 5: APPEARANCE SELECTOR */}
          <div style={{ marginTop: '14px', marginBottom: '8px' }}>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.6px',
                color: 'var(--text-secondary, #64748b)',
                padding: '0 6px',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              APPEARANCE
            </div>

            <div
              style={{
                display: 'flex',
                borderRadius: '12px',
                padding: '3px',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                gap: '2px',
              }}
            >
              {[
                { label: 'Light', value: 'light', icon: Sun },
                { label: 'Dark', value: 'dark', icon: Moon },
                { label: 'System', value: 'system', icon: Monitor },
              ].map((opt) => {
                const isSelected = currentThemeMode === opt.value;
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleThemeChange(opt.value)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '7px 0',
                      borderRadius: '9px',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--color-primary, #4f46e5)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary, #64748b)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(79, 70, 229, 0.3)' : 'none',
                    }}
                  >
                    <IconComp size={14} color={isSelected ? '#ffffff' : 'var(--text-secondary, #64748b)'} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. DRAWER FOOTER ACTIONS
           ========================================================================= */}
        <div
          style={{
            padding: '14px 16px 20px 16px',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Merchant OS Hub Box */}
          <div
            onClick={() => handleNavigate('/merchant')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              backgroundColor: '#e0e7ff',
              border: '1px solid #c7d2fe',
              cursor: 'pointer',
            }}
          >
            <Store size={20} color="#4338ca" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#312e81' }}>
                Merchant OS Hub
              </div>
              <div style={{ fontSize: '0.7rem', color: '#4338ca', marginTop: '1px' }}>
                Counter POS, Khata & Sales
              </div>
            </div>
          </div>

          {/* Sign Out Item */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 4px',
                background: 'transparent',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              <LogOut size={18} color="#dc2626" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default SideDrawer;
