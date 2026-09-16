import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeLanguageBar } from '../common/ThemeLanguageBar';
import { SideDrawer } from './SideDrawer';
import { getImageUrl } from '../../utils/imageUrl';

export const AppHeader = ({ title, subtitle, showBack = false }) => {
  const navigate = useNavigate();
  const { user, shop } = useAuth();
  const { t, isHindi } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="app-header" role="banner">
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
              aria-label={t('common.close')}
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
              aria-label={t('nav.menu')}
            >
              <Menu size={22} />
            </button>
          )}

          <div>
            <div className="header-title">
              {title || (shop ? shop.name : t('app_name'))}
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
                    backgroundColor: shop.is_active ? 'var(--color-success)' : 'var(--color-danger)',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontWeight: 600, color: shop.is_active ? '#065f46' : '#991b1b' }}>
                  {shop.is_active ? t('common.online') : t('common.offline')}
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
          <ThemeLanguageBar compact={true} />

          {user ? (
            <button
              onClick={() => navigate('/profile')}
              style={{
                width: '34px',
                height: '34px',
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
              aria-label={t('nav.settings')}
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
      </header>

      {/* Side Navigation Drawer */}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
export default AppHeader;
