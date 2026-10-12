import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PressableScale from '../PressableScale';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * VendorHeader — Unified Standard Top Bar across all Vendor Screens
 *
 * Implements Stitch Vendor Order Desk design:
 * - Left: 36x36 Squircle Logo Emblem + "Kya Pehnu?" (16px) + Screen Subtitle (11px)
 * - Right: Location Pill (Pin + Boutique Area) + Storefront Avatar (with live green dot)
 * Pixel-identical geometry and hierarchy across Queue, Catalogue, Analytics, and Store.
 */
export default function VendorHeader({
  subtitle = 'Vendor Order Desk',
  navigation,
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const vendorProfile = useAuthStore((state) => state.vendorProfile);
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);

  const displayArea =
    vendorProfile?.address?.area ||
    profile?.address?.area ||
    'Nagpur';

  const logoSource =
    Platform.OS === 'web'
      ? { uri: '/app/apple-touch-icon.png' }
      : require('../../../assets/images/brand-emblem.png');

  return (
    <View
      style={[
        styles.headerRoot,
        {
          paddingTop: Platform.OS === 'web' ? 0 : Math.max(insets.top, 8),
          backgroundColor: isDark ? 'rgba(19, 19, 21, 0.90)' : 'rgba(250, 249, 245, 0.90)',
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E5E3DC',
        },
      ]}
    >
      <View style={styles.headerInner}>
        {/* Left: Brand Squircle + Typography */}
        <View style={styles.brandLeft}>
          <View
            style={[
              styles.emblemBox,
              {
                backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                borderColor: isDark ? 'rgba(200, 162, 74, 0.30)' : 'rgba(179, 138, 43, 0.35)',
              },
            ]}
          >
            <Image source={logoSource} style={styles.emblemImg} resizeMode="cover" />
          </View>
          <View style={styles.titleCol}>
            <Text style={[styles.brandTitle, { color: isDark ? '#F5F5F4' : '#121215' }]}>
              Kya Pehnu?
            </Text>
            <Text style={[styles.brandSubtitle, { color: isDark ? '#A8A29E' : '#4A4950' }]}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Location Pill + Profile Avatar Button */}
        <View style={styles.headerRight}>
          <View
            style={[
              styles.locationPill,
              {
                backgroundColor: isDark ? 'rgba(24, 24, 27, 0.90)' : '#F4F4F0',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            {Platform.OS === 'web' ? (
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 15,
                  lineHeight: '15px',
                  color: isDark ? '#C8A24A' : colors.accentGoldDeep || '#946C18',
                }}
              >
                near_me
              </span>
            ) : (
              <MaterialIcons
                name="near-me"
                size={15}
                color={isDark ? '#C8A24A' : colors.accentGoldDeep || '#946C18'}
              />
            )}
            <Text style={[styles.locationText, { color: isDark ? '#F5F5F4' : '#121215' }]}>
              {displayArea.toUpperCase()}
            </Text>
          </View>

          <PressableScale
            onPress={() => {
              if (navigation) {
                navigation.navigate('VendorProfile');
              }
            }}
            style={[
              styles.avatarBtn,
              { borderColor: isDark ? 'rgba(200, 162, 74, 0.30)' : 'rgba(179, 138, 43, 0.35)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Store Profile"
          >
            <View
              style={[
                styles.avatarInner,
                {
                  backgroundColor: isDark ? '#202024' : '#EFEEEA',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
              ) : Platform.OS === 'web' ? (
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 18,
                    lineHeight: '18px',
                    color: isDark ? '#C8A24A' : colors.accentGoldDeep || '#946C18',
                  }}
                >
                  storefront
                </span>
              ) : (
                <MaterialIcons
                  name="storefront"
                  size={18}
                  color={isDark ? '#C8A24A' : colors.accentGoldDeep || '#946C18'}
                />
              )}
            </View>
            <View style={[styles.onlineDot, { borderColor: isDark ? '#0E0E10' : '#FAF9F5' }]} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    width: '100%',
    zIndex: 50,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  headerInner: {
    height: 64,
    maxWidth: 512,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblemBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemImg: {
    width: '100%',
    height: '100%',
  },
  titleCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? 'ebGaramond, "EB Garamond", Georgia, serif' : 'serif',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", sans-serif' : undefined,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  locationText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'plusJakartaSans, "Plus Jakarta Sans", sans-serif' : undefined,
  },
  avatarBtn: {
    position: 'relative',
    padding: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
});
