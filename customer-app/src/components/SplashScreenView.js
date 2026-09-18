import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

/**
 * SplashScreenView — Stitch Screen:
 * - final_light_theme Splash Screen (Mobile) [9735fbef21c8409cb211a9ad0ab33f93]
 * - final_theme_dark Splash Screen (Mobile) [d0443ae1ed74434f85a9822ea1d2de5c]
 *
 * Implements the exact Stitch design elements:
 * - Top status: Nagpur Express (live pulse) + Trending Fashion (star)
 * - Center: Royal Crimson & Gold Squircle Emblem
 * - Curated Fashion for Men & Women
 * - Bottom: Connecting Boutiques · Nagpur Live + Curated Fashion · v2.4
 */
import StitchSplash from '../stitch/StitchSplash';

export default function SplashScreenView({ onFinish }) {
  const { colors: themeColors, isDark } = useTheme();

  if (Platform.OS === 'web') {
    return <StitchSplash onFinish={onFinish} />;
  }

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const auraAnim = useRef(new Animated.Value(0.4)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // Entrance: Fade & Scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Golden Aura Breathing Loop
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraAnim, {
          toValue: 0.85,
          duration: 1100,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(auraAnim, {
          toValue: 0.4,
          duration: 1100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    auraLoop.start();

    // Auto-dismiss after 1.8 seconds with graceful dissolve
    let safetyTimer = null;
    const timer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        if (safetyTimer) clearTimeout(safetyTimer);
        auraLoop.stop();
        onFinishRef.current?.();
      });
      if (Platform.OS === 'web') {
        safetyTimer = setTimeout(() => {
          auraLoop.stop();
          onFinishRef.current?.();
        }, 600);
      }
    }, 1800);

    return () => {
      clearTimeout(timer);
      if (safetyTimer) clearTimeout(safetyTimer);
      auraLoop.stop();
    };
  }, [auraAnim, exitAnim, fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: isDark ? '#0E0E10' : '#FAF9F5',
          opacity: exitAnim,
        },
      ]}
    >
      {/* Ambient Floating Glowing Blobs */}
      <View
        style={[
          styles.blob,
          styles.blobTopLeft,
          { backgroundColor: isDark ? 'rgba(196, 36, 58, 0.18)' : 'rgba(244, 63, 94, 0.15)' },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.blob,
          styles.blobTopRight,
          { backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : 'rgba(245, 158, 11, 0.12)' },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.blob,
          styles.blobBottom,
          { backgroundColor: isDark ? 'rgba(142, 27, 41, 0.2)' : 'rgba(236, 72, 153, 0.12)' },
        ]}
        pointerEvents="none"
      />

      {/* Top Status Header Bar */}
      <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
        <View
          style={[
            styles.topPill,
            {
              backgroundColor: isDark ? 'rgba(26, 26, 30, 0.85)' : 'rgba(244, 243, 238, 0.92)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 20, 0.06)',
            },
          ]}
        >
          <View style={[styles.pulseDot, { backgroundColor: themeColors.accentCrimson }]} />
          <Text
            style={[
              styles.topPillText,
              { color: isDark ? '#C9C7C2' : themeColors.textSlate },
            ]}
          >
            NAGPUR EXPRESS
          </Text>
        </View>

        <View
          style={[
            styles.topPill,
            {
              backgroundColor: isDark ? 'rgba(26, 26, 30, 0.85)' : 'rgba(244, 243, 238, 0.92)',
              borderColor: isDark ? 'rgba(200, 162, 74, 0.25)' : 'rgba(179, 138, 43, 0.2)',
            },
          ]}
        >
          <MaterialIcons name="local-fire-department" size={13} color={themeColors.accentGold} />
          <Text style={[styles.topPillText, { color: themeColors.accentGoldDeep || themeColors.accentGold }]}>
            TRENDING FASHION
          </Text>
        </View>
      </Animated.View>

      {/* Center Stage Hero Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Golden Aura Glow */}
        <Animated.View
          style={[
            styles.auraGlow,
            {
              backgroundColor: themeColors.accentGold,
              opacity: auraAnim,
              transform: [
                {
                  scale: auraAnim.interpolate({
                    inputRange: [0.4, 0.85],
                    outputRange: [0.95, 1.15],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Frosted Glass Emblem Card */}
        <View style={styles.emblemContainer}>
          <View
            style={[
              styles.emblemCard,
              {
                backgroundColor: isDark ? 'rgba(22, 22, 26, 0.8)' : 'rgba(255, 255, 255, 0.75)',
                borderColor: isDark ? 'rgba(200, 162, 74, 0.35)' : 'rgba(255, 255, 255, 0.95)',
                shadowColor: themeColors.accentCrimson,
              },
            ]}
          >
            <Image
              source={require('../../assets/images/brand-emblem.png')}
              style={styles.emblemImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Eyebrow */}
        <View style={styles.eyebrowWrap}>
          <Text
            style={[
              styles.eyebrowText,
              { color: themeColors.accentGold },
            ]}
          >
            — NAGPUR TRENDING FASHION —
          </Text>
        </View>

        {/* Brand Title */}
        <Text
          style={[
            styles.brandTitle,
            { color: isDark ? '#FFFFFF' : themeColors.textObsidian },
          ]}
        >
          Kya Pehnu?
        </Text>

        {/* Subtitle */}
        <Text
          style={[
            styles.brandSubtitle,
            { color: isDark ? '#C9C7C2' : themeColors.textSlate },
          ]}
        >
          Trending streetwear, party wear, casuals & everyday fits delivered to your doorstep.
        </Text>

        {/* Fashion Feature Chips */}
        <View style={styles.corridorsRow}>
          {['Streetwear & Casuals', 'Party Fits', 'Across Nagpur'].map((tag, idx) => (
            <React.Fragment key={tag}>
              {idx > 0 && (
                <Text style={[styles.corridorDot, { color: isDark ? '#5A5854' : '#C4C2BA' }]}>
                  •
                </Text>
              )}
              <View
                style={[
                  styles.corridorChip,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(244, 243, 238, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 20, 0.06)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.corridorText,
                    { color: isDark ? '#E5E1E4' : themeColors.textSlate },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </Animated.View>

      {/* Bottom Launch Status & Progress Bar */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.progressContainer}>
          {/* Glowing Track */}
          <View
            style={[
              styles.progressBarTrack,
              {
                backgroundColor: isDark ? '#2A2A2C' : '#E9E8E4',
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: themeColors.accentCrimson,
                  width: '85%',
                },
              ]}
            />
          </View>

          {/* Status Label Row */}
          <View style={styles.progressLabelRow}>
            <View style={styles.progressStatusLeft}>
              <MaterialIcons name="schedule" size={13} color={themeColors.accentGold} />
              <Text
                style={[
                  styles.progressStatusText,
                  { color: isDark ? '#C9C7C2' : themeColors.textSlate },
                ]}
              >
                Connecting Boutiques
              </Text>
            </View>
            <View style={styles.progressStatusRight}>
              <View style={[styles.livePulseDot, { backgroundColor: themeColors.accentGold }]} />
              <Text
                style={[
                  styles.liveStatusText,
                  { color: isDark ? '#EAC166' : themeColors.textAsh },
                ]}
              >
                Nagpur Live
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.provenanceRow}>
          <MaterialIcons name="verified-user" size={12} color={themeColors.accentGold} />
          <Text
            style={[
              styles.provenanceText,
              { color: isDark ? '#7E7C85' : themeColors.textAsh },
            ]}
          >
            CURATED FASHION FOR MEN & WOMEN · NAGPUR
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingBottom: Platform.OS === 'web' ? 32 : 44,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    ...Platform.select({
      web: {
        filter: 'blur(75px)',
      },
    }),
  },
  blobTopLeft: {
    top: -50,
    left: -50,
    width: 280,
    height: 280,
  },
  blobTopRight: {
    top: '25%',
    right: -60,
    width: 260,
    height: 260,
  },
  blobBottom: {
    bottom: -60,
    left: '15%',
    width: 300,
    height: 300,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  topPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 12,
  },
  auraGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -10,
    ...Platform.select({
      web: {
        filter: 'blur(45px)',
      },
    }),
  },
  emblemContainer: {
    position: 'relative',
    marginBottom: 18,
  },
  emblemCard: {
    width: 124,
    height: 124,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 36,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(36px) saturate(200%)',
        WebkitBackdropFilter: 'blur(36px) saturate(200%)',
      },
    }),
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  boltPill: {
    position: 'absolute',
    bottom: -6,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  boltText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  eyebrowWrap: {
    marginBottom: 6,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 36,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
    fontWeight: '500',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  corridorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  corridorChip: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  corridorText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  corridorDot: {
    fontSize: 10,
  },
  footer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
  progressContainer: {
    width: '100%',
    gap: 6,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  progressStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  provenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  provenanceText: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
