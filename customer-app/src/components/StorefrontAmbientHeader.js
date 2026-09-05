import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { colors, spacing } from '../theme/colors';

const AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGM_0wLpRFGdu-DVvv3o-4_5lm7k5PpD7xHSFrnKrskzGaImQdgqLvQUe1Ty6B5lAWvubis-RxqXtbN_pbAinonRzB3BumMum1Dt63Io-9s6RzuJ82pDObYXpvFtISLR9jJ7Q8NJe97wlWTXFrsN7zdFLQdP4u3d8X6jxTopRhy02YVxRnwC47a9LuMAtmZB0wBfBIWdKY_1CzelhQPv-Y3sj00-AuS4BzQss6mEf4CSvb5V2jXllKzQ';

/**
 * StorefrontAmbientHeader
 *
 * Implements Stitch's Floating Capsule Navigation Bar (Ambient Blobs variant):
 * - Floating glass pill capsule suspended below status bar
 * - Frosted blur background refracts glowing ambient orbs behind it
 * - Left: Squircle brand emblem + "Kya Pehnu?" + "ATELIER" crimson subtext
 * - Center: Location pill: near_me Sitabuldi, Nagpur expand_more
 * - Right: Circular user profile avatar with crimson active status dot
 */
export default function StorefrontAmbientHeader({
  insets,
  areaLabel = 'Sitabuldi, Nagpur',
  onSelectLocation,
  onOpenProfile,
  onViewStory,
}) {
  return (
    <View
      style={[
        styles.outerContainer,
        { paddingTop: insets.top + 8 },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pillBar} pointerEvents="auto">
        {/* Left: Brand Identity from Stitch */}
        <PressableScale
          onPress={onViewStory}
          style={styles.brandGroup}
          accessibilityRole="button"
          accessibilityLabel="View Atelier Story"
        >
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.emblemImage}
            resizeMode="cover"
          />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitle}>Kya Pehnu?</Text>
            <Text style={styles.brandSubtitle}>ATELIER</Text>
          </View>
        </PressableScale>

        {/* Center: Location Pill */}
        <PressableScale
          onPress={onSelectLocation}
          style={styles.locationBtn}
          accessibilityRole="button"
          accessibilityLabel="Select Location"
        >
          <MaterialIcons name="near-me" size={14} color={colors.accentGold} />
          <Text style={styles.locationText} numberOfLines={1}>
            {areaLabel}
          </Text>
          <MaterialIcons name="expand-more" size={14} color={colors.textAsh} />
        </PressableScale>

        {/* Right: User Profile Avatar with Active Status Dot */}
        <PressableScale
          onPress={onOpenProfile}
          style={styles.avatarBtn}
          accessibilityRole="button"
          accessibilityLabel="Profile and settings"
        >
          <Image
            source={{ uri: AVATAR_URL }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
          <View style={styles.crimsonStatusDot} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 20,
  },
  pillBar: {
    height: 56,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emblemImage: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.60)',
  },
  brandTextCol: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitle: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 16,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', 'Playfair Display', Georgia, serif",
    }),
  },
  brandSubtitle: {
    color: colors.accentCrimson,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 9999,
    maxWidth: 180,
  },
  locationText: {
    color: colors.textObsidian,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  avatarBtn: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
  },
  crimsonStatusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentCrimson,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
