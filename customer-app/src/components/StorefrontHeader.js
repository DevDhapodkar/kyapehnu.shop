import { Platform, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import CartBadge from './CartBadge';
import BrandLogo from './BrandLogo';
import { colors, spacing } from '../theme/colors';

/**
 * StorefrontHeader
 *
 * Apple Glass minimal top navigation bar:
 * - Official Stitch Brand Logo & Atelier Squircle Emblem
 * - Center/Right: Location pill ("Sitabuldi, Nagpur")
 * - Profile button & Bag indicator with live item count badge
 */
export default function StorefrontHeader({
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
        styles.header,
        { paddingTop: insets.top + spacing.xs, height: insets.top + 58 },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.headerBar}>
        {/* Brand Wordmark from Stitch */}
        <BrandLogo size="sm" showEmblem={true} />

        {/* Center: Location Pill */}
        <PressableScale
          onPress={onSelectLocation}
          style={styles.locationPill}
          accessibilityRole="button"
          accessibilityLabel="Select Location"
        >
          <MaterialIcons name="near-me" size={13} color={colors.accentGold} />
          <Text style={styles.locationText} numberOfLines={1}>
            {areaLabel}
          </Text>
          <MaterialIcons name="expand-more" size={15} color={colors.textAsh} />
        </PressableScale>

        {/* Right: Profile & Bag Buttons */}
        <View style={styles.rightGroup}>
          {onOpenProfile ? (
            <PressableScale
              onPress={onOpenProfile}
              style={styles.profileBtn}
              accessibilityRole="button"
              accessibilityLabel="Profile and settings"
            >
              <MaterialIcons
                name="account-circle"
                size={18}
                color={colors.textObsidian}
              />
            </PressableScale>
          ) : null}

          {onOpenBag ? (
            <PressableScale
              onPress={onOpenBag}
              style={styles.bagBtn}
              accessibilityRole="button"
              accessibilityLabel="View shopping bag"
            >
              <MaterialIcons
                name="shopping-bag"
                size={16}
                color={colors.textObsidian}
              />
              {cartCount > 0 ? (
                <CartBadge count={cartCount} style={styles.badge} />
              ) : null}
            </PressableScale>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(250, 249, 245, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 20, 0.05)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  headerBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPrimary: {
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandAccent: {
    fontStyle: 'italic',
    color: colors.accentCrimson,
    fontSize: 13,
    fontWeight: '700',
  },
  goldDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accentGold,
    marginLeft: 5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.06)',
    maxWidth: 165,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  locationIcon: {
    fontSize: 11,
  },
  locationText: {
    color: colors.textObsidian,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  chevron: {
    color: colors.textAsh,
    fontSize: 10,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileGlyph: {
    fontSize: 13,
  },
  bagBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bagGlyph: {
    fontSize: 14,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
  },
});
