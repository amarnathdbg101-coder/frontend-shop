/**
 * Top App Header Component (Modern Glassy Style for Merchant App)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SideDrawer } from './SideDrawer';
import { getImageUrl } from '../../utils/imageUrl';

export const AppHeader = ({ title, subtitle, showBack = false }) => {
  const navigate = useNavigate();
  const { user, shop } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, isHindi } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
              }}
              title={isHindi ? 'पीछे जाएं' : 'Go Back'}
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
              }}
              title={isHindi ? 'साइड मेनू खोलें' : 'Open Menu'}
            >
              <Menu size={22} />
            </button>
          )}

          <div>
            <div className="header-title">
              {title || (shop ? shop.name : (isHindi ? 'दुकानदार ओएस' : 'Merchant OS'))}
            </div>
            {subtitle ? (
              <div className="header-subtitle">{subtitle}</div>
            ) : shop ? (
              <div className="header-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: shop.is_active ? '#10b981' : '#ef4444',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontWeight: 600, color: shop.is_active ? '#065f46' : '#991b1b' }}>
                  {shop.is_active ? (isHindi ? 'दुकान चालू (Online)' : 'Online Store') : (isHindi ? 'दुकान बंद (Offline)' : 'Offline')}
                </span>
              </div>
            ) : user ? (
              <div className="header-subtitle">
                {isHindi ? `नमस्ते, ${user.full_name || user.name}` : `Hello, ${user.full_name || user.name}`}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Language Switcher Pill */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setLanguage(isHindi ? 'en' : 'hi')}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--color-primary)',
                fontWeight: 800,
                fontSize: '0.74rem',
                padding: '3px 8px',
                cursor: 'pointer',
              }}
              title={isHindi ? 'Switch to English' : 'हिंदी भाषा चुनें'}
            >
              {isHindi ? 'EN' : 'हिंदी'}
            </button>
          </div>

          {/* Quick Dark/Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
            }}
            title={isDark ? (isHindi ? 'लाइट मोड' : 'Light Mode') : (isHindi ? 'डार्क मोड' : 'Dark Mode')}
          >
            {isDark ? <Sun size={19} color="#fbbf24" /> : <Moon size={19} />}
          </button>

          {user ? (
            <button
              onClick={() => navigate('/profile')}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: user.avatar_url ? 'transparent' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                overflow: 'hidden',
                padding: 0,
              }}
              title={isHindi ? 'दुकानदार प्रोफ़ाइल' : 'Merchant Profile'}
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
              {isHindi ? 'लॉगिन' : 'Login'}
            </button>
          )}
        </div>
      </header>

      {/* Side Navigation Drawer */}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
