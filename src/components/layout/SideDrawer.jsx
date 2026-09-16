/**
 * Shop Owner SideDrawer Component (Dukan OS Navigation)
 * Full bilingual support & comprehensive retail operations links
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Receipt,
  BookOpen,
  ClipboardList,
  Package,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Tag,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getImageUrl } from '../../utils/imageUrl';
import { ThemeLanguageBar } from '../common/ThemeLanguageBar';

export const SideDrawer = ({ isOpen, onClose }) => {
  const { user, shop, isAuthenticated, logout } = useAuth();
  const { isHindi } = useLanguage();
  const navigate = useNavigate();

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
    if (window.confirm(isHindi ? 'क्या आप निश्चित रूप से लॉग आउट करना चाहते हैं?' : 'Are you sure you want to log out?')) {
      logout();
      onClose();
      navigate('/login');
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <div
        className={`drawer-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside className={`side-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: user?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={getImageUrl(user.avatar_url)}
                  alt={user?.name || 'Merchant'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'M'
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {shop ? shop.name : (user?.name || (isHindi ? 'दुकानदार' : 'Merchant'))}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user ? user.phone || user.email : (isHindi ? 'शॉपमी मर्चेंट ओएस' : 'ShopMe Merchant OS')}
              </div>
              <div style={{ marginTop: '2px' }}>
                <span
                  style={{
                    backgroundColor: shop?.is_active ? '#dcfce7' : '#fee2e2',
                    color: shop?.is_active ? '#15803d' : '#b91c1c',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-block',
                  }}
                >
                  {shop?.is_active ? (isHindi ? 'दुकान चालू' : 'Shop Online') : (isHindi ? 'दुकान बंद' : 'Shop Offline')}
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="drawer-close-btn" title={isHindi ? 'मेनू बंद करें' : 'Close Menu'}>
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          <div className="drawer-section-title">{isHindi ? 'काउंटर एवं बिलिंग' : 'BILLING & COUNTER'}</div>
          <div className="drawer-links-group">
            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant')}>
              <div className="drawer-icon-bubble" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <LayoutDashboard size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'दुकान डैशबोर्ड' : 'Shop Dashboard'}</div>
                <div className="drawer-link-sub">{isHindi ? 'दैनिक बिक्री, अलर्ट्स व मुख्य मेट्रिक्स' : 'Daily sales, alerts & key metrics'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant/pos')}>
              <div className="drawer-icon-bubble" style={{ background: '#dcfce7', color: '#15803d' }}>
                <Receipt size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'पीओएस बिलिंग काउंटर' : 'POS Billing Counter'}</div>
                <div className="drawer-link-sub">{isHindi ? 'त्वरित पर्ची बिलिंग, यूपीआई क्यूआर एवं वॉयस' : 'Fast billing, instant UPI QR & voice'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant/inventory')}>
              <div className="drawer-icon-bubble" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Package size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'स्टॉक एवं कैटलॉग' : 'Inventory & Catalog'}</div>
                <div className="drawer-link-sub">{isHindi ? 'उत्पाद जोड़ें, बारकोड स्कैन व स्टॉक अलर्ट्स' : 'Manage products, barcode & stock alerts'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant/khata')}>
              <div className="drawer-icon-bubble" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <BookOpen size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'डिजिटल खाता बही' : 'Digital Khata Book'}</div>
                <div className="drawer-link-sub">{isHindi ? 'ग्राहक उधारी, व्हाट्सएप तकादा व रसीद' : 'Customer ledger & WhatsApp reminders'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant/procurement')}>
              <div className="drawer-icon-bubble" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <ClipboardList size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'मंडी खरीदारी सूची' : 'Procurement List'}</div>
                <div className="drawer-link-sub">{isHindi ? 'थोक खरीदारी सूची व ऑटो-इम्पोर्ट' : 'Mandi purchase orders & low-stock import'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          </div>

          <div className="drawer-section-title" style={{ marginTop: '16px' }}>{isHindi ? 'दुकान ऑपरेशंस' : 'SHOP OPERATIONS'}</div>
          <div className="drawer-links-group">
            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant/analytics')}>
              <div className="drawer-icon-bubble" style={{ background: '#ccfbf1', color: '#0d9488' }}>
                <TrendingUp size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'दुकान का असली मुनाफ़ा' : 'Pocket Profit Analytics'}</div>
                <div className="drawer-link-sub">{isHindi ? 'बिक्री, लागत एवं शुद्ध बचत विश्लेषण' : 'Revenue, cost & net profit analytics'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant/expenses')}>
              <div className="drawer-icon-bubble" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Wallet size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'दैनिक दुकान के खर्चे' : 'Daily Shop Expenses'}</div>
                <div className="drawer-link-sub">{isHindi ? 'चाय-नाश्ता, किराया, बिजली व वेतन' : 'Log daily operational expenses'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant/pickups')}>
              <div className="drawer-icon-bubble" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                <ShieldCheck size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'ग्राहक पिकअप सत्यापन' : 'Customer Pickup Verification'}</div>
                <div className="drawer-link-sub">{isHindi ? '6-अंकीय ओटीपी कोड से सामान हैंडओवर' : '6-digit OTP verification & order release'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button className="drawer-link-btn" onClick={() => handleNavigate('/merchant/offers')}>
              <div className="drawer-icon-bubble" style={{ background: '#fce7f3', color: '#be185d' }}>
                <Tag size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="drawer-link-title">{isHindi ? 'ऑफ़र्स एवं डिस्काउंट्स' : 'Offers & Promotions'}</div>
                <div className="drawer-link-sub">{isHindi ? 'दुकान के लाइव डिस्काउंट्स प्रबंधित करें' : 'Create & publish promotional deals'}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div className="drawer-section-title">{isHindi ? 'थीम एवं भाषा सेटिंग्स' : 'THEME & LANGUAGE'}</div>
            <ThemeLanguageBar />
          </div>
        </div>

        <div className="drawer-footer">
          {isAuthenticated ? (
            <button className="btn btn-outline btn-block" onClick={handleLogout} style={{ gap: '8px', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <LogOut size={16} />
              <span>{isHindi ? 'लॉग आउट करें' : 'Sign Out'}</span>
            </button>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => handleNavigate('/login')}>
              <span>{isHindi ? 'लॉगिन करें' : 'Sign In'}</span>
            </button>
          )}
          <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            ShopMe Merchant OS • v1.0
          </div>
        </div>
      </aside>
    </>
  );
};
