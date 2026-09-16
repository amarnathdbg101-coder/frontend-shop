/**
 * ThemeLanguageBar Component (Customer App)
 * Clean, accessible theme toggle and bilingual language selector (English & Hindi)
 * Fully compliant with i18n standards, ARIA accessibility, and zero-Hinglish rules.
 */

import React from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const ThemeLanguageBar = ({ compact = false }) => {
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t, supportedLanguages, isHindi } = useLanguage();

  if (compact) {
    return (
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        role="group"
        aria-label="Display and language settings"
      >
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 'var(--radius-full)',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            transition: 'all 0.2s ease',
          }}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          {isDark ? <Sun size={17} color="#fbbf24" aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
        </button>

        {/* Language Selector (English / Hindi Only) */}
        <div 
          style={{ 
            display: 'flex', 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: 'var(--radius-full)', 
            padding: '2px' 
          }}
          role="radiogroup"
          aria-label="Language selection"
        >
          {supportedLanguages.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <button
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                role="radio"
                aria-checked={isSelected}
                aria-label={`Select ${opt.label}`}
                style={{
                  border: 'none',
                  background: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#0f172a' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card, var(--bg-surface))',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
      role="region"
      aria-label="Preferences"
    >
      {/* Theme Switcher Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)'
            }}
          >
            {isDark ? <Moon size={20} color="#818cf8" /> : <Sun size={20} color="#f59e0b" />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {isHindi ? 'डिस्प्ले थीम' : 'Display Theme'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {isDark 
                ? (isHindi ? 'डार्क मोड सक्रिय है' : 'Dark mode is active') 
                : (isHindi ? 'लाइट मोड सक्रिय है' : 'Light mode is active')}
            </div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
          }}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} />}
          <span>{isDark ? (isHindi ? 'लाइट मोड' : 'Light Mode') : (isHindi ? 'डार्क मोड' : 'Dark Mode')}</span>
        </button>
      </div>

      <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

      {/* Language Switcher Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(79, 70, 229, 0.15)'
            }}
          >
            <Globe size={20} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {isHindi ? 'भाषा का चयन' : 'Language'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {isHindi ? 'हिंदी अथवा अंग्रेजी का चयन करें' : 'Choose Hindi or English'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }} role="radiogroup" aria-label="Language options">
          {supportedLanguages.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <button
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                role="radio"
                aria-checked={isSelected}
                style={{
                  border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'var(--color-primary)' : 'var(--bg-surface-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeLanguageBar;
