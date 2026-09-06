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
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

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
            <View style={styles.proximityPill}>
              <View style={styles.pulsingBeacon} />
              <Text style={styles.proximityText}>NAGPUR ATELIERS LIVE</Text>
            </View>

            {/* Quick Explore Pill */}
            <PressableScale
              onPress={handleExplore}
              style={styles.explorePill}
              accessibilityRole="button"
              accessibilityLabel="Explore Storefront as Guest"
            >
              <Text style={styles.exploreText}>Explore</Text>
              <MaterialIcons name="chevron-right" size={16} color="rgba(19, 19, 22, 0.75)" />
            </PressableScale>
          </View>

          {/* Scrollable / Flexible Center Content */}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: insets.bottom + 170,
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
                <View style={styles.emblemBox}>
                  <Image
                    source={require('../../assets/images/stitch-emblem.png')}
                    style={styles.emblemImage}
                    resizeMode="cover"
                  />
                </View>
                {/* Proximity Tag Indicator */}
                <View style={styles.proximityTag}>
                  <MaterialIcons name="star" size={12} color="#C8A24A" />
                  <Text style={styles.proximityTagText}>60-MIN DOORSTEP</Text>
                </View>
              </View>

              {/* App Title & Garamond Headline */}
              <View style={styles.headlineBlock}>
                <Text style={styles.eyebrow}>NAGPUR HYPERLOCAL COUTURE</Text>
                <Text style={styles.titleSerif}>
                  Kya Pehnu<Text style={styles.crimsonGlyph}>?</Text>
                </Text>
                <Text style={styles.subtitle}>
                  Handcrafted silken drapes & designer ensembles from Sitabuldi & Dharampeth to your door in an hour.
                </Text>
              </View>

              {/* 3 Frosted Micro Value Pillars */}
              <View style={styles.valuePillarsGrid}>
                {/* Pillar 1: 60 Mins */}
                <View style={styles.valuePillarCard}>
                  <View style={[styles.pillarIconWrap, styles.iconWrapRose]}>
                    <MaterialIcons name="schedule" size={16} color="#C4243A" />
                  </View>
                  <Text style={styles.pillarTitle}>60 Mins</Text>
                  <Text style={styles.pillarCaption}>Porter dispatch</Text>
                </View>

                {/* Pillar 2: Doorstep Trial */}
                <View style={styles.valuePillarCard}>
                  <View style={[styles.pillarIconWrap, styles.iconWrapAmber]}>
                    <MaterialIcons name="verified-user" size={16} color="#C8A24A" />
                  </View>
                  <Text style={styles.pillarTitle}>Doorstep Trial</Text>
                  <Text style={styles.pillarCaption}>Try before buy</Text>
                </View>

                {/* Pillar 3: Pay on Delivery */}
                <View style={styles.valuePillarCard}>
                  <View style={[styles.pillarIconWrap, styles.iconWrapEmerald]}>
                    <MaterialIcons name="payments" size={16} color="#059669" />
                  </View>
                  <Text style={styles.pillarTitle}>Pay on Delivery</Text>
                  <Text style={styles.pillarCaption}>Zero risk COD</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Docked Frosted Glass Action Tray */}
          <View
            style={[
              styles.dockedGlassTray,
              { paddingBottom: Math.max(insets.bottom + 12, 24) },
            ]}
          >
            <View style={styles.glassActionCard}>
              {/* Primary CTA: Get Started */}
              <PressableScale
                onPress={handleGetStarted}
                style={styles.primaryCta}
                accessibilityRole="button"
                accessibilityLabel="Get Started with Kya Pehnu"
              >
                <Text style={styles.primaryCtaText}>Get Started</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </PressableScale>

              {/* Secondary CTA: Sign In */}
              <View style={styles.secondaryRow}>
                <Text style={styles.secondaryText}>Already have an account?</Text>
                <PressableScale
                  onPress={handleSignIn}
                  style={styles.signInBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Sign In"
                >
                  <Text style={styles.signInBtnText}>Sign In</Text>
                  <MaterialIcons name="chevron-right" size={15} color="#C4243A" />
                </PressableScale>
              </View>

              {/* Vendor Portal Mini Link */}
              <View style={styles.vendorLinkRow}>
                <Text style={styles.vendorPromptText}>Run a boutique in Nagpur?</Text>
                <PressableScale
                  onPress={handleRegisterShop}
                  style={styles.vendorBtn}
                  accessibilityRole="link"
                  accessibilityLabel="Register Shop as Vendor"
                >
                  <Text style={styles.vendorBtnText}>Register Shop →</Text>
                </PressableScale>
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
    borderRadius: 26,
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
    borderRadius: 22,
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
    gap: 12,
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
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  secondaryText: {
    fontSize: 12,
    color: '#5C5A63',
    fontWeight: '400',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  signInBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#C4243A',
  },
  vendorLinkRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  homeIndicator: {
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(19, 19, 22, 0.18)',
    alignSelf: 'center',
    marginTop: 14,
  },
});
