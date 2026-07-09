'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import en from '@/i18n/en.json';
import am from '@/i18n/am.json';

type Locale = 'en' | 'am';
type TranslationData = typeof en;

const translations: Record<Locale, TranslationData> = { en, am };

// Nested key accessor: t('ticketer.bookTicket')
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) as string || path;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  dir: 'ltr',
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('bustrack_locale') as Locale) || 'en';
    }
    return 'en';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('bustrack_locale', l);
    document.documentElement.lang = l;
    document.documentElement.dir = 'ltr'; // Amharic is LTR
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    let value = getNestedValue(translations[locale], key);
    if (value === key) {
      // Fallback to English if Amharic key missing
      value = getNestedValue(translations.en, key);
    }
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir: 'ltr' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// Bilingual label helper: shows Amharic + English for mixed audiences
export function useBilingual(key: string): string {
  const { locale, t } = useI18n();
  if (locale === 'am') {
    const amVal = getNestedValue(translations.am, key);
    const enVal = getNestedValue(translations.en, key);
    // Show Amharic with English in parentheses for clarity
    if (amVal && amVal !== key && enVal && enVal !== key && amVal !== enVal) {
      return `${amVal} (${enVal})`;
    }
  }
  return t(key);
}