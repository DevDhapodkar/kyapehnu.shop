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
import { colors, radii, spacing } from '../theme/colors';

/**
 * SplashScreenView — Stitch Screen 258da2cb975b4237b16a01741ceb554f
 * "Splash Screen — Animated Luxe Logo Entrance"
 *
 * Provides a couture atelier entrance on cold start:
 * - Ambient floating warm glowing blobs
 * - Center stage with frosted glass card and golden aura pulse
 * - The official Royal Crimson & Gold Atelier Emblem from Stitch
 * - Nagpur Hyperlocal Couture provenance pill
 * - Connects to local ateliers before smoothly dissolving
 */
export default function SplashScreenView({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const auraAnim = useRef(new Animated.Value(0.4)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance: Fade & Scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(auraAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    auraLoop.start();

    // Auto-dismiss after 1.8 seconds with graceful dissolve
    const timer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        auraLoop.stop();
        onFinish?.();
      });
    }, 1900);

    return () => {
      clearTimeout(timer);
      auraLoop.stop();
    };
  }, [auraAnim, exitAnim, fadeAnim, onFinish, scaleAnim]);

  return (
    <Animated.View style={[styles.root, { opacity: exitAnim }]}>
      {/* Ambient Floating Glowing Blobs */}
      <View style={[styles.blob, styles.blobTopLeft]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobTopRight]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobBottom]} pointerEvents="none" />

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
              opacity: auraAnim,
              transform: [{ scale: auraAnim.interpolate({
                inputRange: [0.4, 0.85],
                outputRange: [0.95, 1.15],
              }) }],
            },
          ]}
        />

        {/* Frosted Glass Emblem Card */}
        <View style={styles.emblemCard}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.emblemImage}
            resizeMode="cover"
          />
        </View>

        {/* Nagpur Hyperlocal Couture Badge */}
        <View style={styles.badgePill}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>NAGPUR HYPERLOCAL COUTURE</Text>
        </View>

        {/* Brand Title */}
        <Text style={styles.brandTitle}>Kya Pehnu?</Text>
        <Text style={styles.brandSubtitle}>
          The city’s finest ateliers at your doorstep
        </Text>
      </Animated.View>

      {/* Bottom Launch Pill */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.launchPill}>
          <ActivityIndicator size="small" color={colors.accentCrimson} />
          <Text style={styles.launchText}>
            Connecting to Dharampeth & Civil Lines…
          </Text>
        </View>

        <View style={styles.provenanceRow}>
          <Text style={styles.provenanceText}>60-Min Doorstep Trial</Text>
          <Text style={styles.provenanceBullet}>•</Text>
          <Text style={styles.provenanceText}>Curated Boutiques</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#FAF9F5',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 56,
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
    backgroundColor: 'rgba(244, 63, 94, 0.28)',
  },
  blobTopRight: {
    top: '30%',
    right: -60,
    width: 260,
    height: 260,
    backgroundColor: 'rgba(245, 158, 11, 0.24)',
  },
  blobBottom: {
    bottom: -60,
    left: '15%',
    width: 300,
    height: 300,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    paddingHorizontal: 24,
  },
  auraGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.accentGold,
    top: '25%',
    ...Platform.select({
      web: {
        filter: 'blur(45px)',
      },
    }),
  },
  emblemCard: {
    width: 124,
    height: 124,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
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
    borderRadius: 26,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
    marginRight: 7,
  },
  badgeText: {
    color: colors.accentCrimson,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  brandTitle: {
    marginTop: 12,
    fontSize: 34,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
    fontWeight: '500',
    color: colors.textObsidian,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSlate,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    gap: 12,
  },
  launchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  launchText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  provenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  provenanceText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textAsh,
  },
  provenanceBullet: {
    fontSize: 11,
    color: colors.textAsh,
  },
});
