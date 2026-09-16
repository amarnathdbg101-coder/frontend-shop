import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Phone,
  LogOut,
  Settings,
  Users,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { ThemeLanguageBar } from '../../components/common/ThemeLanguageBar';

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, shop, logout } = useAuth();
  const { t, isHindi } = useLanguage();

  const handleLogout = () => {
    if (window.confirm(isHindi ? 'क्या आप निश्चित रूप से साइन आउट करना चाहते हैं?' : 'Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <AppLayout title={t('settings.title')} subtitle={t('settings.subtitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Shop Info Card */}
        <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={28} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{shop?.name || t('app_name')}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.full_name || user?.name} • {shop?.phone || user?.phone}</div>
            </div>
          </div>
        </div>

        {/* Theme and Language Settings */}
        <ThemeLanguageBar compact={false} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: '100%', color: 'var(--color-danger)', fontWeight: 800, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <LogOut size={16} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </AppLayout>
  );
};
export default ProfileScreen;
