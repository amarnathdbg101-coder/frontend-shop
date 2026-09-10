/**
 * Merchant Desktop Top Navbar Component (Screens >= 1024px)
 * 
 * Hinglish Hint:
 * Laptop & Desktop screens ke liye premium Dukan OS Header:
 * - Dukan ka Brand & Logo
 * - Live Online / Offline Status Indicator
 * - Navigation links:
 *   - Dashboard (Overview)
 *   - POS Billing (Counter terminal with live cart badge)
 *   - Stock & Catalog (Inventory)
 *   - Khata Book (Udhar ledger)
 *   - Pocket Profit (Analytics)
 *   - Daily Expenses (Kharche)
 *   - Pickup Counter (OTP verify)
 * - Actions:
 *   - Customer Storefront Link (View shop as a customer)
 *   - AI Merchant Copilot trigger
 *   - Dark / Light Mode Switcher
 *   - Merchant Profile / Settings Avatar
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Store,
  LayoutDashboard,
  Receipt,
  Package,
  BookOpen,
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
import { getImageUrl } from '../../utils/imageUrl';
import { MerchantCopilotModal } from '../common/MerchantCopilotModal';

export const DesktopNavbar = () => {
  const navigate = useNavigate();
  const { user, shop } = useAuth();
  const { itemCount } = usePOS();
  const { isDark, toggleTheme } = useTheme();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <>
      <header className="desktop-navbar" role="banner">
        <div className="desktop-navbar-inner">
          {/* Left: Brand & Live Dukan Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <div
              onClick={() => navigate('/merchant')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                }}
              >
                <Store size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {shop?.name || 'ShopMe Merchant'}
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.4px' }}>
                  DUKAN OS • {shop?.category || 'Retail Counter'}
                </div>
              </div>
            </div>

            {/* Shop Live Status Dot */}
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
                <span>{shop.is_active ? 'Online (Khuli Hai)' : 'Offline (Band)'}</span>
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav
            style={{
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
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/merchant/pos"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Receipt size={17} />
              <span>POS Billing</span>
              {itemCount > 0 && <span className="desktop-nav-badge">{itemCount}</span>}
            </NavLink>

            <NavLink
              to="/merchant/inventory"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Package size={17} />
              <span>Stock & Catalog</span>
            </NavLink>

            <NavLink
              to="/merchant/khata"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={17} />
              <span>Customer Khata</span>
            </NavLink>

            <NavLink
              to="/merchant/analytics"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <TrendingUp size={17} />
              <span>Pocket Profit</span>
            </NavLink>

            <NavLink
              to="/merchant/expenses"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Wallet size={17} />
              <span>Kharche</span>
            </NavLink>

            <NavLink
              to="/merchant/pickups"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <ShieldCheck size={17} />
              <span>Pickups</span>
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
                  transition: 'all 0.15s ease',
                }}
                title="Customer Storefront Nayi Tab me Kholein"
              >
                <ExternalLink size={14} />
                <span>Storefront</span>
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
              title="Shop AI Assistant"
            >
              <Bot size={15} />
              <span>AI Copilot</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} />}
            </button>

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
                title="Dukan Settings & Profile"
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
                Login
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
