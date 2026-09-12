import React from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import PressableScale from '../components/PressableScale';
import { useStorefrontStore } from '../store/useStorefrontStore';
import { colors, radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * WelcomeScreen — Frosted Apple Glass Luxury
 *
 * Implements Stitch Screen a16b8891d00743c39bb425621398a97d:
 * - Glowing drifting ambient background blobs
 * - Top Proximity Pill ("Nagpur Ateliers Live" with pulsing emerald beacon)
 * - Guest Explore pill button
 * - Radiant Halo Kya Pehnu brand emblem with "60-MIN DOORSTEP" gold badge
 * - Classical EB Garamond serif typography with crimson glyph accent
 * - 3 Frosted Micro Value Pillars (60 Mins Porter, Doorstep Trial, Pay on Delivery)
 * - Glass Tray Bottom Actions: "Get Started" primary gradient CTA, "Sign In" secondary,
 *   and "Register Shop" boutique portal link.
 */
export default function WelcomeScreen({
  navigation,
  onGetStarted,
  onSignIn,
  onExploreGuest,
  onRegisterShop,
}) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();

  const handleGetStarted = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onGetStarted) {
      onGetStarted();
    } else if (navigation) {
      navigation.navigate('Auth', { mode: 'register' });
    }
  };

  const handleSignIn = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (onSignIn) {
      onSignIn();
    } else if (navigation) {
      navigation.navigate('Auth', { mode: 'signin' });
    }
  };

  const handleExplore = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    useStorefrontStore.getState().setGuestExplore(true);
    if (onExploreGuest) {
      onExploreGuest();
    } else if (navigation) {
      navigation.navigate('Home');
    }
  };

  const handleRegisterShop = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (onRegisterShop) {
      onRegisterShop();
    } else if (navigation) {
      navigation.navigate('VendorRegister');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.groundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Ambient Glowing Gradient Blobs */}
      <AmbientBackgroundBlobs />

      {/* Frame wrapper with desktop centering constraint */}
      <View style={styles.outerContainer}>
        <View style={styles.frameContainer}>
          {/* Top Bar Header */}
          <View
            style={[
              styles.topBar,
              { paddingTop: Math.max(insets.top + 6, 16) },
            ]}
          >
            {/* Live Nagpur Ateliers Proximity Pill */}
            <View
              style={[
                styles.proximityPill,
                {
                  backgroundColor: isDark ? 'rgba(26, 26, 30, 0.85)' : 'rgba(244, 243, 238, 0.92)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 20, 0.06)',
                },
              ]}
            >
              <View style={[styles.pulsingBeacon, { backgroundColor: themeColors.accentCrimson }]} />
              <Text style={[styles.proximityText, { color: isDark ? '#C9C7C2' : themeColors.textSlate }]}>
                NAGPUR EXPRESS
              </Text>
            </View>

            {/* Heritage Guild Pill */}
            <PressableScale
              onPress={handleExplore}
              style={[
                styles.explorePill,
                {
                  backgroundColor: isDark ? 'rgba(26, 26, 30, 0.85)' : 'rgba(244, 243, 238, 0.92)',
                  borderColor: isDark ? 'rgba(200, 162, 74, 0.25)' : 'rgba(179, 138, 43, 0.2)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Heritage Guild"
            >
              <MaterialIcons name="stars" size={14} color={themeColors.accentGold} />
              <Text style={[styles.exploreText, { color: themeColors.accentGoldDeep || themeColors.accentGold }]}>
                HERITAGE GUILD
              </Text>
            </PressableScale>
          </View>

          {/* Scrollable / Flexible Center Content */}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: insets.bottom + 180,
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Center Hero Section */}
            <View style={styles.heroSection}>
              {/* Emblem Container with Radiant Halo */}
              <View style={styles.emblemContainer}>
                <View style={styles.emblemHalo} />
                <View
                  style={[
                    styles.emblemBox,
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

                {/* 45-min Bolt Badge */}
                <View
                  style={[
                    styles.boltBadge,
                    {
                      backgroundColor: isDark ? '#1C1B1D' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(200, 162, 74, 0.3)' : 'rgba(18, 18, 20, 0.08)',
                    },
                  ]}
                >
                  <MaterialIcons name="bolt" size={13} color={themeColors.accentCrimson} />
                  <Text style={[styles.boltBadgeText, { color: isDark ? '#FAF9F5' : themeColors.textObsidian }]}>
                    45 min
                  </Text>
                </View>
              </View>

              {/* App Title & Garamond Headline */}
              <View style={styles.headlineBlock}>
                <Text style={[styles.eyebrow, { color: themeColors.accentGold }]}>
                  — NAGPUR COUTURE GUILD —
                </Text>
                <Text style={[styles.titleSerif, { color: isDark ? '#FFFFFF' : themeColors.textPrimary }]}>
                  Kya Pehnu<Text style={[styles.crimsonGlyph, { color: themeColors.accentCrimson }]}>?</Text>
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? '#C9C7C2' : themeColors.textSecondary }]}>
                  Curated bespoke handlooms & designer ensembles delivered warm to your suite.
                </Text>

                {/* Corridor Chips */}
                <View style={styles.corridorsRow}>
                  {['Sitabuldi', 'Dharampeth', 'Gandhibagh'].map((zone, idx) => (
                    <React.Fragment key={zone}>
                      {idx > 0 && (
                        <Text style={[styles.corridorDot, { color: isDark ? '#5A5854' : '#C4C2BA' }]}>
                          •
                        </Text>
                      )}
                      <View
                        style={[
                          styles.corridorChip,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(244, 243, 238, 0.9)',
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
                          {zone}
                        </Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>

              {/* 3 Frosted Micro Value Pillars */}
              <View style={styles.valuePillarsGrid}>
                {/* Pillar 1: 45 Mins */}
                <View
                  style={[
                    styles.valuePillarCard,
                    {
                      backgroundColor: isDark ? 'rgba(22, 22, 25, 0.82)' : 'rgba(255, 255, 255, 0.52)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.85)',
                    },
                  ]}
                >
                  <View style={[styles.pillarIconWrap, styles.iconWrapRose]}>
                    <MaterialIcons name="schedule" size={16} color={themeColors.accentCrimson} />
                  </View>
                  <Text style={[styles.pillarTitle, { color: themeColors.textPrimary }]}>45 Mins</Text>
                  <Text style={[styles.pillarCaption, { color: themeColors.textAsh }]}>Porter dispatch</Text>
                </View>

                {/* Pillar 2: Doorstep Trial */}
                <View
                  style={[
                    styles.valuePillarCard,
                    {
                      backgroundColor: isDark ? 'rgba(22, 22, 25, 0.82)' : 'rgba(255, 255, 255, 0.52)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.85)',
                    },
                  ]}
                >
                  <View style={[styles.pillarIconWrap, styles.iconWrapAmber]}>
                    <MaterialIcons name="verified-user" size={16} color={themeColors.accentGold} />
                  </View>
                  <Text style={[styles.pillarTitle, { color: themeColors.textPrimary }]}>Doorstep Trial</Text>
                  <Text style={[styles.pillarCaption, { color: themeColors.textAsh }]}>Try before buy</Text>
                </View>

                {/* Pillar 3: Pay on Delivery */}
                <View
                  style={[
                    styles.valuePillarCard,
                    {
                      backgroundColor: isDark ? 'rgba(22, 22, 25, 0.82)' : 'rgba(255, 255, 255, 0.52)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.85)',
                    },
                  ]}
                >
                  <View style={[styles.pillarIconWrap, styles.iconWrapEmerald]}>
                    <MaterialIcons name="payments" size={16} color="#059669" />
                  </View>
                  <Text style={[styles.pillarTitle, { color: themeColors.textPrimary }]}>Pay on Delivery</Text>
                  <Text style={[styles.pillarCaption, { color: themeColors.textAsh }]}>Zero risk COD</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Docked Frosted Glass Action Tray */}
          <View
            style={[
              styles.dockedGlassTray,
              { paddingBottom: Math.max(insets.bottom + 12, 20) },
            ]}
          >
            <View
              style={[
                styles.glassActionCard,
                {
                  backgroundColor: isDark ? 'rgba(22, 22, 25, 0.92)' : 'rgba(255, 255, 255, 0.72)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.9)',
                },
              ]}
            >
              {/* Primary CTA: Explore Looks */}
              <PressableScale
                onPress={handleGetStarted}
                style={[styles.primaryCta, { backgroundColor: themeColors.accentCrimson }]}
                accessibilityRole="button"
                accessibilityLabel="Explore Looks"
              >
                <Text style={styles.primaryCtaText}>Explore Looks</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </PressableScale>

              {/* Secondary CTA: Log In to Your Account */}
              <PressableScale
                onPress={handleSignIn}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 18, 20, 0.08)',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Log In to Your Account"
              >
                <Text style={[styles.secondaryBtnText, { color: isDark ? '#FAF9F5' : themeColors.textObsidian }]}>
                  Log In to Your Account
                </Text>
              </PressableScale>

              {/* Guest and Partner Links */}
              <View style={styles.linksBlock}>
                <PressableScale
                  onPress={handleExplore}
                  style={styles.guestLink}
                  accessibilityRole="button"
                  accessibilityLabel="Explore Storefront as Guest"
                >
                  <Text style={[styles.guestPromptText, { color: themeColors.textAsh }]}>
                    Browsing as guest?{' '}
                    <Text style={[styles.guestActionText, { color: themeColors.accentCrimson }]}>
                      Browse Catalog
                    </Text>
                  </Text>
                </PressableScale>

                <View style={styles.vendorLinkRow}>
                  <Text style={[styles.vendorPromptText, { color: themeColors.textAsh }]}>
                    Run a boutique in Nagpur?
                  </Text>
                  <PressableScale
                    onPress={handleRegisterShop}
                    style={styles.vendorBtn}
                    accessibilityRole="link"
                    accessibilityLabel="Register Shop as Vendor"
                  >
                    <Text style={[styles.vendorBtnText, { color: themeColors.accentGold }]}>
                      Register Shop →
                    </Text>
                  </PressableScale>
                </View>

                {/* Verified Guild Footer */}
                <View style={styles.verifiedRow}>
                  <MaterialIcons name="verified-user" size={12} color={themeColors.accentGold} />
                  <Text style={[styles.verifiedText, { color: themeColors.textAsh }]}>
                    VERIFIED HERITAGE ARTISANS · NAGPUR NETWORK
                  </Text>
                </View>
              </View>
            </View>

            {/* iOS Home Indicator */}
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    zIndex: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  proximityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      },
    }),
  },
  pulsingBeacon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  proximityText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(19, 19, 22, 0.82)',
    letterSpacing: 0.8,
  },
  explorePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      },
    }),
  },
  exploreText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(19, 19, 22, 0.8)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heroSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  emblemContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: 'rgba(196, 36, 58, 0.18)',
    transform: [{ scale: 1.15 }],
    ...Platform.select({
      web: {
        filter: 'blur(24px)',
      },
    }),
  },
  emblemBox: {
    width: 104,
    height: 104,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
    padding: 3,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  boltBadge: {
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
  boltBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  corridorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  corridorChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  corridorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  corridorDot: {
    fontSize: 10,
  },
  proximityTag: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(200, 162, 74, 0.45)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
  proximityTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C8A24A',
    letterSpacing: 1.1,
  },
  headlineBlock: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C8A24A',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  titleSerif: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', 'Cinzel', Georgia, serif",
    }),
    fontSize: 38,
    fontWeight: '400',
    color: '#131316',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  crimsonGlyph: {
    color: '#C4243A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', 'Cinzel', Georgia, serif",
    }),
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#5C5A63',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
    marginTop: 8,
  },
  valuePillarsGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginTop: 24,
  },
  valuePillarCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      },
    }),
  },
  pillarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconWrapRose: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  iconWrapAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  iconWrapEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  pillarTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#131316',
    textAlign: 'center',
  },
  pillarCaption: {
    fontSize: 9.5,
    color: '#8A8891',
    textAlign: 'center',
    marginTop: 2,
  },
  dockedGlassTray: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingHorizontal: 20,
  },
  glassActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 32,
    padding: 16,
    gap: 10,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(36px) saturate(190%)',
        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
      },
    }),
  },
  primaryCta: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#C4243A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  linksBlock: {
    gap: 8,
    alignItems: 'center',
    paddingTop: 2,
  },
  guestLink: {
    paddingVertical: 2,
  },
  guestPromptText: {
    fontSize: 11.5,
  },
  guestActionText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  vendorLinkRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  vendorPromptText: {
    fontSize: 11,
    color: '#8A8891',
  },
  vendorBtn: {
    paddingVertical: 2,
  },
  vendorBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C8A24A',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  homeIndicator: {
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(19, 19, 22, 0.18)',
    alignSelf: 'center',
    marginTop: 12,
  },
});
