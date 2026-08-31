import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, GlassPanel, IconButton, SearchPill } from '../ui';
import { colors, CONTINUOUS, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * StorefrontHeader
 *
 * The floating navigation bar. It hovers over the content rather than sitting
 * in the layout — the storefront scrolls *under* it — which is what lets the
 * hero image run to the top of the screen.
 *
 * Two rows, because a phone cannot hold the reference's single-row desktop nav:
 *  1. wordmark, bag, avatar — identity and the two persistent destinations
 *  2. the delivery-area pill beside search, since where you are is the single
 *     fact that decides what this whole screen shows
 *
 * When location permission is denied the area pill becomes the retry
 * affordance, so the fix is one tap from where the problem is stated.
 *
 * The search pill appears only when `onQueryChange` is supplied. The logged-out
 * marketing screen mounts this same header with no catalogue behind it, and a
 * search field over a film that cannot be searched is a dead control.
 */
export default function StorefrontHeader({
  areaLabel,
  locationStatus,
  onRefreshLocation,
  cartCount = 0,
  userName,
  onOpenCart,
  onOpenProfile,
  query,
  onQueryChange,
  topInset = 0,
}) {
  const denied = locationStatus === 'denied';

  return (
    <GlassPanel
      tone="thick"
      // Flush to the top and both sides — a radius here would let the wallpaper
      // through beside the status bar.
      radius={0}
      style={[styles.header, styles.body, { paddingTop: topInset + spacing.xs }]}
    >
      <View style={styles.topRow}>
        <View style={styles.wordmark}>
          <Text style={styles.mark}>◆</Text>
          <Text style={styles.brand}>KYA PEHNU</Text>
        </View>

        <View style={styles.actions}>
          <IconButton
            glyph="◇"
            tone="glass"
            size={40}
            badge={cartCount > 0 ? cartCount : undefined}
            onPress={onOpenCart}
            accessibilityLabel={
              cartCount > 0 ? `Bag, ${cartCount} items` : 'Bag, empty'
            }
          />

          <Pressable
            onPress={onOpenProfile}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Avatar name={userName} size={40} ring />
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Pressable
          onPress={onRefreshLocation}
          accessibilityRole="button"
          accessibilityLabel={
            denied ? 'Location off, tap to enable' : `Delivering to ${areaLabel}, tap to refresh`
          }
          style={({ pressed }) => [styles.areaPill, pressed && styles.pressed]}
        >
          <View style={[styles.pin, denied && styles.pinOff]} />
          <View style={styles.areaText}>
            <Text style={styles.areaLabel}>
              {denied ? 'Location off' : 'Delivering to'}
            </Text>
            <Text numberOfLines={1} style={styles.area}>
              {denied ? 'Tap to enable GPS' : areaLabel}
            </Text>
          </View>
        </Pressable>

        {onQueryChange ? (
          <SearchPill
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search pieces"
            style={styles.search}
          />
        ) : null}
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mark: {
    color: colors.ivory,
    fontSize: 13,
    lineHeight: 16,
  },
  brand: {
    ...typography.micro,
    fontSize: 13,
    letterSpacing: 2.4,
    fontWeight: '800',
    color: colors.ivory,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  pressed: {
    opacity: 0.7,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  areaPill: {
    flex: 1.25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 42,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.glassThin,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    ...CONTINUOUS,
  },
  // A drawn dot rather than a pin glyph: the map-pin characters are outside
  // the ranges Android's system font reliably covers.
  pin: {
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.sage,
  },
  pinOff: {
    backgroundColor: colors.amber,
  },
  areaText: {
    flex: 1,
    minWidth: 0,
  },
  areaLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.ash,
  },
  area: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ivory,
    marginTop: 1,
  },
  search: {
    flex: 1,
  },
});
