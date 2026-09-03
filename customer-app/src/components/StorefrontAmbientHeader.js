import { Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import CartBadge from './CartBadge';
import { colors, spacing } from '../theme/colors';

/**
 * StorefrontAmbientHeader
 *
 * Implements Stitch's Floating Capsule Navigation Bar (Ambient Blobs variant):
 * - Floating glass pill capsule suspended below status bar
 * - Frosted blur background refracts glowing ambient orbs behind it
 * - Brand Wordmark: "KYA PEHNU? •"
 * - Compact Location selector: "📍 Sitabuldi, Nagpur ▾"
 * - Profile and Bag triggers with live badge
 */
export default function StorefrontAmbientHeader({
  insets,
  areaLabel = 'Sitabuldi, Nagpur',
  onSelectLocation,
  onOpenProfile,
  onOpenBag,
  cartCount = 0,
}) {
  return (
    <View
      style={[
        styles.outerContainer,
        { paddingTop: insets.top + 4 },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pillBar} pointerEvents="auto">
        {/* Brand Wordmark */}
        <View style={styles.brandGroup}>
          <Text style={styles.brandPrimary}>KYA</Text>
          <Text style={styles.brandAccent}> PEHNU?</Text>
          <View style={styles.goldDot} />
        </View>

        {/* Center: Location Pill */}
        <PressableScale
          onPress={onSelectLocation}
          style={styles.locationBtn}
          accessibilityRole="button"
          accessibilityLabel="Select Location"
        >
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {areaLabel}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </PressableScale>

        {/* Right: Actions */}
        <View style={styles.rightGroup}>
          {onOpenBag ? (
            <PressableScale
              onPress={onOpenBag}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="View shopping bag"
            >
              <Text style={styles.actionGlyph}>👜</Text>
              {cartCount > 0 ? (
                <CartBadge count={cartCount} style={styles.badge} />
              ) : null}
            </PressableScale>
          ) : null}

          {onOpenProfile ? (
            <PressableScale
              onPress={onOpenProfile}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Profile and settings"
            >
              <Text style={styles.actionGlyph}>👤</Text>
              <View style={styles.crimsonStatusDot} />
            </PressableScale>
          ) : null}
        </View>
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
    paddingHorizontal: spacing.md,
  },
  pillBar: {
    height: 54,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPrimary: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandAccent: {
    fontStyle: 'italic',
    color: colors.accentCrimson,
    fontSize: 12.5,
    fontWeight: '700',
  },
  goldDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentGold,
    marginLeft: 4,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9999,
    maxWidth: 155,
  },
  locationIcon: {
    fontSize: 10.5,
  },
  locationText: {
    color: colors.textObsidian,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  chevron: {
    color: colors.textAsh,
    fontSize: 9.5,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionGlyph: {
    fontSize: 13,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  crimsonStatusDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accentCrimson,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
