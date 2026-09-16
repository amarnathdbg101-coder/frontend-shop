/**
 * Merchant Bottom Navigation Bar
 * Optimized for quick counter billing and khata management
 */

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
  const { isHindi } = useLanguage();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Merchant counter navigation">
      <NavLink
        to="/merchant"
        end
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>{isHindi ? 'होम' : 'Home'}</span>
      </NavLink>

      <NavLink
        to="/merchant/pos"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Receipt size={20} />
        <span>{isHindi ? 'बिलिंग' : 'POS'}</span>
        {itemCount > 0 && <span className="nav-badge">{itemCount}</span>}
      </NavLink>

      <NavLink
        to="/merchant/inventory"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Package size={20} />
        <span>{isHindi ? 'स्टॉक' : 'Stock'}</span>
      </NavLink>

      <NavLink
        to="/merchant/khata"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <BookOpen size={20} />
        <span>{isHindi ? 'खाता' : 'Khata'}</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={20} />
        <span>{isHindi ? 'प्रोफ़ाइल' : 'Profile'}</span>
      </NavLink>
    </nav>
  );
};
