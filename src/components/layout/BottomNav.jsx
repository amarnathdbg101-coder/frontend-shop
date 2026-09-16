import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  Package,
  User,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { useLanguage } from '../../context/LanguageContext';

export const BottomNav = () => {
  const { itemCount } = usePOS();
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Merchant Navigation">
      <NavLink
        to="/merchant"
        end
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>{t('nav.dashboard')}</span>
      </NavLink>

      <NavLink
        to="/merchant/pos"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Receipt size={20} />
        <span>{t('nav.pos')}</span>
        {itemCount > 0 && <span className="nav-badge">{itemCount}</span>}
      </NavLink>

      <NavLink
        to="/merchant/inventory"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Package size={20} />
        <span>{t('nav.inventory')}</span>
      </NavLink>

      <NavLink
        to="/merchant/khata"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <BookOpen size={20} />
        <span>{t('nav.khata')}</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={20} />
        <span>{t('nav.settings')}</span>
      </NavLink>
    </nav>
  );
};
export default BottomNav;
