/**
 * EcoHero — Language Context
 *
 * Provides current language ('en' | 'ur') and a toggle function.
 * Persists the preference via AsyncStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Language, t as translate, type TranslationKey } from '@/constants/i18n';

const STORAGE_KEY = '@ecohero_language';

interface LanguageContextValue {
  lang: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  toggleLanguage: () => {},
  t: (key) => translate(key, 'en'),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  // Load saved language preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'ur') setLang(saved);
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next: Language = prev === 'en' ? 'ur' : 'en';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const tFn = useCallback(
    (key: TranslationKey) => translate(key, lang),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
