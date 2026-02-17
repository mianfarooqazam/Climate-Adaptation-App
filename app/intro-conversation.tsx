/**
 * EcoHero: Flood Fighters — Intro conversation
 *
 * When the user taps Play, they see a short conversation between
 * Ali and Ayesha introducing the app. Tap Next to advance; last tap goes to World Map.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import GameButton from '@/components/game/GameButton';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/constants/i18n';
import { GameColors, Fonts, FontSizes, Spacing, Shadow } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Speaker = 'ali' | 'ayesha';

const CONVERSATION: { speaker: Speaker; key: TranslationKey }[] = [
  { speaker: 'ayesha', key: 'introAyeshaHello' },
  { speaker: 'ali', key: 'introAliHello' },
  { speaker: 'ayesha', key: 'introAyeshaApp' },
  { speaker: 'ali', key: 'introAliLearn' },
  { speaker: 'ayesha', key: 'introAyeshaReady' },
];

export default function IntroConversationScreen() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [index, setIndex] = useState(0);

  const step = CONVERSATION[index];
  const isLast = index === CONVERSATION.length - 1;

  const goNext = () => {
    if (isLast) {
      router.replace('/world-map');
    } else {
      setIndex((i) => i + 1);
    }
  };

  const isAyesha = step.speaker === 'ayesha';
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [index]);

  return (
    <View style={styles.container}>
      <View style={styles.bgWhite} />

      <View style={styles.content}>
        {/* Speaker area: avatar + name + speech */}
        <View style={[styles.speakerRow, isAyesha && styles.speakerRowReverse]}>
          <View style={styles.avatarWrap}>
            {!avatarError ? (
              <Image
                source={
                  isAyesha
                    ? require('@/assets/images/farooqi.jpg')
                    : require('@/assets/images/farooq.jpg')
                }
                style={styles.avatar}
                resizeMode="contain"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, isAyesha ? styles.avatarAyesha : styles.avatarAli]}>
                <Text style={styles.avatarInitial}>{isAyesha ? 'Ay' : 'Al'}</Text>
              </View>
            )}
          </View>
          <View style={styles.bubble}>
            <Text style={[styles.bubbleText, lang === 'ur' && styles.rtl]}>{t(step.key)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <GameButton
          title={isLast ? t('introStart') : t('introNext')}
          onPress={goNext}
          size="lg"
          color={GameColors.primary}
          textColor="#fff"
        />
      </View>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl * 2,
    paddingBottom: Spacing.xl,
  },
  bgWhite: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    maxWidth: '100%',
  },
  speakerRowReverse: {
    flexDirection: 'row-reverse',
  },
  avatarWrap: {
    alignItems: 'center',
    minWidth: SCREEN_H * 0.375,
  },
  avatar: {
    width: SCREEN_H * 0.375,
    height: SCREEN_H * 0.5,
    backgroundColor: 'transparent',
  },
  avatarPlaceholder: {
    width: SCREEN_H * 0.375,
    height: SCREEN_H * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  avatarAyesha: {
    backgroundColor: '#F8BBD9',
  },
  avatarAli: {
    backgroundColor: '#90CAF9',
  },
  avatarInitial: {
    fontFamily: Fonts.rounded,
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  bubble: {
    maxWidth: SCREEN_W * 0.55,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    ...Shadow.md,
  },
  bubbleText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    color: GameColors.textPrimary,
    lineHeight: 24,
  },
  rtl: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});
