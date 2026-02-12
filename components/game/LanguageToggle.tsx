/**
 * EcoHero — Language Toggle Button
 *
 * A compact pill button that shows the current language and toggles
 * between English and Urdu on press.
 */

import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { Fonts } from '@/constants/theme';

interface Props {
  /** 'light' text on dark bg (default), 'dark' text on light bg */
  variant?: 'light' | 'dark';
}

export default function LanguageToggle({ variant = 'light' }: Props) {
  const { lang, toggleLanguage } = useLanguage();
  const isLight = variant === 'light';

  return (
    <Pressable onPress={toggleLanguage} style={[styles.pill, isLight ? styles.pillLight : styles.pillDark]}>
      <View style={styles.row}>
        <Text style={[styles.flag, !isLight && styles.flagDark, lang === 'en' && (isLight ? styles.activeLang : styles.activeLangDark)]}>EN</Text>
        <View style={[styles.divider, isLight ? styles.dividerLight : styles.dividerDark]} />
        <Text style={[styles.flag, !isLight && styles.flagDark, lang === 'ur' && (isLight ? styles.activeLang : styles.activeLangDark)]}>
          {'\u0627\u0631\u062F\u0648'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1.5,
  },
  pillLight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pillDark: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderColor: 'rgba(0,0,0,0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontFamily: Fonts.rounded,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
  },
  activeLang: {
    color: '#fff',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  flagDark: {
    color: 'rgba(0,0,0,0.35)',
  },
  activeLangDark: {
    color: '#2E7D32',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  divider: {
    width: 1,
    height: 14,
  },
  dividerLight: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerDark: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
