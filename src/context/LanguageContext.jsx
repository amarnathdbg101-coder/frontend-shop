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
      const saved = localStorage.getItem('shopsilo_merchant_language') || localStorage.getItem('shopsilo_language');
      return saved === 'hi' || saved === 'en' ? saved : 'hi';
    } catch {
      return 'hi';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('shopsilo_customer_language', language);
      localStorage.setItem('shopsilo_language', language);
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

  const t = useCallback((pathKey, params = {}, fallback = '') => {
    if (!pathKey) return '';
    
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

    let value = resolveKey(dictionaries[language], pathKey);
    if (!value && language !== 'en') {
      value = resolveKey(dictionaries.en, pathKey);
    }
    if (!value) {
      value = fallbackText || pathKey;
    }

    if (variables && typeof variables === 'object') {
      Object.keys(variables).forEach((varName) => {
        const regexDouble = new RegExp(`{{\\s*${varName}\\s*}}`, 'g');
        const regexSingle = new RegExp(`{\\s*${varName}\\s*}`, 'g');
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
