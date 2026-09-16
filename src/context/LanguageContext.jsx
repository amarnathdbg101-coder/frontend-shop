/**
 * Enhanced Language Context for ShopMe Customer Web App
 * Supports strictly English ('en') and Standard Formal Hindi ('hi')
 * Centralized, zero-Hinglish, context-aware translation engine with parameter interpolation
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { dictionaries } from '../locales/index.js';

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', label: 'हिंदी', dir: 'ltr', fontClass: 'font-devanagari' },
  { code: 'en', label: 'English', dir: 'ltr', fontClass: 'font-sans' }
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('shopme_merchant_language') || localStorage.getItem('shopme_language');
      return saved === 'hi' || saved === 'en' ? saved : 'hi';
    } catch {
      return 'hi';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('shopme_customer_language', language);
      localStorage.setItem('shopme_language', language);
    } catch (e) {
      console.warn('Unable to persist language preference', e);
    }

    // Sync HTML document lang and dir attributes for SEO and accessibility
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    if (language === 'hi') {
      document.body.classList.add('lang-hi');
      document.body.classList.remove('lang-en');
    } else {
      document.body.classList.add('lang-en');
      document.body.classList.remove('lang-hi');
    }
  }, [language]);

  const setLanguage = useCallback((langCode) => {
    if (langCode === 'hi' || langCode === 'en') {
      setLanguageState(langCode);
    }
  }, []);

  /**
   * Translate key with nested path support and variable replacement
   * e.g. t('nav.explore') or t('products.units_left', { qty: 5 })
   */
  const t = useCallback((pathKey, params = {}, fallback = '') => {
    if (!pathKey) return '';
    
    // Support if user passed fallback as second arg string
    let fallbackText = typeof params === 'string' ? params : fallback;
    let variables = typeof params === 'object' && params !== null ? params : {};

    const resolveKey = (dict, keyStr) => {
      if (!dict) return undefined;
      const parts = keyStr.split('.');
      let current = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return undefined;
        }
      }
      return typeof current === 'string' ? current : undefined;
    };

    // 1. Check selected language dictionary
    let value = resolveKey(dictionaries[language], pathKey);

    // 2. Fallback to English dictionary
    if (!value && language !== 'en') {
      value = resolveKey(dictionaries.en, pathKey);
    }

    // 3. Fallback to passed fallback text or key itself
    if (!value) {
      value = fallbackText || pathKey;
    }

    // 4. Interpolate variables {{var}} or {var}
    if (variables && typeof variables === 'object') {
      Object.keys(variables).forEach((varName) => {
        const regexDouble = new RegExp(`{{\\s*${varName}\\s*}}`, 'g');
        const regexSingle = new RegExp(`{\\s*${varName}\\s*`, 'g');
        value = value.replace(regexDouble, String(variables[varName]));
        value = value.replace(regexSingle, String(variables[varName]));
      });
    }

    return value;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isHindi: language === 'hi',
    isEnglish: language === 'en'
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
