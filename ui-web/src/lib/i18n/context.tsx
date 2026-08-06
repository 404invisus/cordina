'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, Locale, LocalizedDict } from './types';
import { commonDict } from './common-dict';

const STORAGE_KEY = 'connectone_locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'id') setLocaleState(stored);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), str);
}

/**
 * Page-scoped translation hook. Pass this page's own {en,id} dictionary;
 * keys prefixed "common." resolve against the shared common-dict instead
 * (roles, statuses, generic actions like Save/Cancel) so those never need
 * to be duplicated per page.
 */
export function useT(localDict?: LocalizedDict) {
  const { locale } = useLocale();
  return useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let str: string | undefined;
      if (key.startsWith('common.')) {
        str = commonDict[locale][key.slice('common.'.length)] ?? commonDict[DEFAULT_LOCALE][key.slice('common.'.length)];
      } else {
        str = localDict?.[locale]?.[key] ?? localDict?.[DEFAULT_LOCALE]?.[key];
      }
      if (str === undefined) {
        if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing translation key: "${key}"`);
        return key;
      }
      return interpolate(str, vars);
    },
    [locale, localDict],
  );
}
