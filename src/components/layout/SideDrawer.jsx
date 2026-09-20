/**
 * Merchant Side Navigation Drawer (Menu Bar)
 * 
 * Comprehensive, pixel-perfect sidebar menu for Mobile, Tablet, and Desktop:
 * - Shop & Merchant Profile Header with Online/Offline status
 * - Categorized feature groups:
 *   1. Core Operations (Dashboard, POS Billing, Inventory, Khata)
 *   2. Marketing & Growth (Offers & Deals, AI Campaigns)
 *   3. Store Management (Procurement, Analytics, Expenses, Pickups, Staff)
 *   4. Customer Storefront (Open Marketplace, Store QR Standee)
 *   5. Preferences & Appearance (Light/Dark/System theme, Profile, Logout)
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  BookOpen,
  Tag,
  TrendingUp,
  Wallet,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  Users,
  QrCode,
  ExternalLink,
  Store,
  User,
  LogOut,
  X,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Settings,
  Flame,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { StaffManagementModal } from '../merchant/StaffManagementModal';
import { AIMarketingCampaignModal } from '../merchant/AIMarketingCampaignModal';
import { ShopQRModal } from '../merchant/ShopQRModal';
import { EditShopModal } from '../common/EditShopModal';
import { getImageUrl } from '../../utils/imageUrl';
import { getCustomerStoreUrl } from '../../utils/storeUrl';

export const SideDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, shop, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, setThemeMode } = useTheme();
  const { isHindi } = useLanguage();

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isEditShopOpen, setIsEditShopOpen] = useState(false);

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  // Group 1: CORE OPERATIONS (Counter & Ledger)
  const coreItems = [
    {
      label: isHindi ? 'डैशबोर्ड (होम)' : 'Dashboard (Home)',
      path: '/merchant',
      icon: LayoutDashboard,
      color: '#4f46e5',
      bg: '#eef2ff',
      badge: 'Main',
    },
    {
      label: isHindi ? 'काउंटर बिलिंग (POS)' : 'Counter Billing (POS)',
      path: '/merchant/pos',
      icon: Receipt,
      color: '#059669',
      bg: '#ecfdf5',
      badge: 'Fast',
    },
    {
      label: isHindi ? 'सामान व स्टॉक (Inventory)' : 'Catalog & Inventory',
      path: '/merchant/inventory',
      icon: Package,
      color: '#d97706',
      bg: '#fffbeb',
      badge: 'Stock',
    },
    {
      label: isHindi ? 'खाता बही (Udhar Khata)' : 'Khata Credit Ledger',
      path: '/merchant/khata',
      icon: BookOpen,
      color: '#dc2626',
      bg: '#fef2f2',
      badge: 'Udhar',
    },
  ];

  // Group 2: MARKETING & GROWTH
  const marketingItems = [
    {
      label: isHindi ? 'ऑफ़र्स व डिस्काउंट (Offers)' : 'Offers & Coupons',
      path: '/merchant/offers',
      icon: Tag,
      color: '#db2777',
      bg: '#fdf2f8',
      badge: 'Deals',
    },
    {
      label: isHindi ? 'एआई मार्केटिंग कैंपेन (AI)' : 'AI Marketing Campaign',
      action: () => {
        onClose();
        setIsMarketingModalOpen(true);
      },
      icon: Sparkles,
      color: '#7c3aed',
      bg: '#f5f3ff',
      badge: 'AI Gen',
    },
  ];

  // Group 3: STORE MANAGEMENT & LOGISTICS
  const storeItems = [
    {
      label: isHindi ? 'मंडी खरीदारी लिस्ट' : 'Mandi Procurement List',
      path: '/merchant/procurement',
      icon: ClipboardList,
      color: '#2563eb',
      bg: '#eff6ff',
      badge: 'Reorder',
    },
    {
      label: isHindi ? 'मुनाफ़ा व बिक्री (Analytics)' : 'Profit & Sales Analytics',
      path: '/merchant/analytics',
      icon: TrendingUp,
      color: '#10b981',
      bg: '#ecfdf5',
      badge: 'Reports',
    },
    {
      label: isHindi ? 'दुकान खर्चे (Expenses)' : 'Store Expense Manager',
      path: '/merchant/expenses',
      icon: Wallet,
      color: '#0891b2',
      bg: '#ecfeff',
      badge: 'Kharcha',
    },
    {
      label: isHindi ? 'ऑनलाइन पिकअप सत्यापन' : 'Online Pickup Verify',
      path: '/merchant/pickups',
      icon: ShieldCheck,
      color: '#4f46e5',
      bg: '#eef2ff',
      badge: 'Orders',
    },
    {
      label: isHindi ? 'स्टाफ व कैशियर (Staff)' : 'Staff & Cashier Roles',
      action: () => {
        onClose();
        setIsStaffModalOpen(true);
      },
      icon: Users,
      color: '#6366f1',
      bg: '#eef2ff',
      badge: 'Team',
    },
  ];

  // Group 4: CUSTOMER STOREFRONT & TOOLS
  const customerItems = [
    {
      label: isHindi ? 'ग्राहक बाज़ार (Live Store)' : 'Open Customer Store',
      action: () => {
        onClose();
        const url = getCustomerStoreUrl(shop?.slug || '');
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      icon: ExternalLink,
      color: '#2563eb',
      bg: '#eff6ff',
      badge: 'Live',
    },
    {
      label: isHindi ? 'काउंटर QR स्टैंडी (QR Code)' : 'Store Counter QR Standee',
      action: () => {
        onClose();
        setIsQRModalOpen(true);
      },
      icon: QrCode,
      color: '#059669',
      bg: '#ecfdf5',
      badge: 'Print',
    },
  ];

  const currentThemeMode = theme || 'system';

  const handleThemeChange = (mode) => {
    if (setThemeMode) {
      setThemeMode(mode);
    } else {
      toggleTheme();
    }
  };

  return (
    <>
      {/* Dark Blur Overlay Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          zIndex: 9998,
          transition: 'opacity 0.2s ease',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modern Slide-out Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '84vw',
          maxWidth: '340px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRight: '1px solid var(--border-subtle, #e2e8f0)',
        }}
        role="dialog"
        aria-label="Merchant Navigation Menu"
      >
        {/* =========================================================================
            1. DRAWER TOP HEADER (Shop Branding & Profile)
           ========================================================================= */}
        <div
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.05rem',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
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
                shop?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'S'
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.94rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {shop ? shop.name : (user?.full_name || user?.name || (isHindi ? 'मेरी दुकान' : 'My Shop'))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: shop?.is_active ? '#10b981' : '#ef4444',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: shop?.is_active ? '#059669' : '#dc2626',
                  }}
                >
                  {shop?.is_active ? (isHindi ? 'Online Counter' : 'Online Store') : (isHindi ? 'Offline' : 'Offline')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary, #64748b)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* =========================================================================
            2. SCROLLABLE CATEGORIZED NAVIGATION ITEMS
           ========================================================================= */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {/* Helper Section Renderer */}
          {[
            { title: isHindi ? 'काउंटर व खाता (CORE)' : 'CORE OPERATIONS', items: coreItems },
            { title: isHindi ? 'मार्केटिंग व ग्रोथ' : 'GROWTH & MARKETING', items: marketingItems },
            { title: isHindi ? 'दुकान मैनेजमेंट व रिपोर्ट्स' : 'STORE MANAGEMENT', items: storeItems },
            { title: isHindi ? 'कस्टमर स्टोरफ्रंट व क्यूआर' : 'CUSTOMER STOREFRONT', items: customerItems },
          ].map((section, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  color: 'var(--text-secondary, #64748b)',
                  padding: '0 8px',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {section.title}
              </div>

              {section.items.map((item, iIdx) => {
                const IconComp = item.icon;
                const isActive = item.path && location.pathname === item.path;

                return (
                  <div
                    key={iIdx}
                    onClick={() => (item.action ? item.action() : handleNavigate(item.path))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: isActive ? 'var(--color-primary-light, #eef2ff)' : 'transparent',
                      transition: 'all 0.15s ease',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle, #f1f5f9)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
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
                      <IconComp size={17} color={item.color} />
                    </div>

                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? 'var(--color-primary, #4f46e5)' : 'var(--text-primary, #0f172a)',
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </span>

                    {item.badge && (
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-surface-subtle, #f1f5f9)',
                          color: isActive ? '#4f46e5' : 'var(--text-secondary, #64748b)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}

                    <ChevronRight size={15} color="var(--text-secondary, #94a3b8)" style={{ flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          ))}

          {/* Group 5: APPEARANCE MODE */}
          <div style={{ marginTop: '8px', marginBottom: '10px' }}>
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                letterSpacing: '0.6px',
                color: 'var(--text-secondary, #64748b)',
                padding: '0 8px',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              {isHindi ? 'थीम (APPEARANCE)' : 'APPEARANCE'}
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
            3. DRAWER FOOTER (Profile & Sign Out)
           ========================================================================= */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Settings & Profile Button */}
          <button
            type="button"
            onClick={() => handleNavigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              color: 'var(--text-primary, #0f172a)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <Settings size={16} color="var(--color-primary, #4f46e5)" />
            <span style={{ flex: 1 }}>{isHindi ? 'दुकान सेटिंग्स व प्रोफ़ाइल' : 'Store Settings & Profile'}</span>
            <ChevronRight size={14} color="var(--text-secondary, #94a3b8)" />
          </button>

          {/* Sign Out Button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                background: 'transparent',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              <LogOut size={16} color="#dc2626" />
              <span>{isHindi ? 'लॉग आउट (Sign Out)' : 'Sign Out'}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Feature Modals */}
      <StaffManagementModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} />
      <AIMarketingCampaignModal isOpen={isMarketingModalOpen} onClose={() => setIsMarketingModalOpen(false)} />
      <ShopQRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <EditShopModal isOpen={isEditShopOpen} onClose={() => setIsEditShopOpen(false)} />
    </>
  );
};

export default SideDrawer;
