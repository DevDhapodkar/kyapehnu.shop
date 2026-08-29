import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  Extrapolation,
} from 'react-native-reanimated';

import AnimatedNumber from '../ui/AnimatedNumber';
import BrandMark from '../ui/BrandMark';
import Gradient from '../ui/Gradient';
import Icon from '../ui/Icon';
import IconButton from '../ui/IconButton';
import PressableScale from '../ui/PressableScale';
import { colors, radii, spacing } from '../../theme/colors';
import { type } from '../../theme/tokens';

/** Scroll distance over which the bar goes from transparent to fully frosted. */
const CONDENSE_RANGE = 90;

/**
 * StorefrontAppBar
 *
 * The bar pinned over the top of Home. It starts transparent, sitting directly
 * on the content, and condenses into a frosted, bordered bar as the page moves
 * under it — so the storefront opens edge-to-edge and only gains chrome once
 * there is something scrolling underneath that needs separating from it.
 *
 * The condense is driven off the shared scroll offset on the UI thread, so it
 * tracks the finger exactly rather than arriving a frame or two late.
 *
 * The left side is the delivery address, and it is a button: location is the
 * single input that reorders the entire catalogue, so re-requesting it has to
 * be reachable from the first screen without a settings detour.
 */
export default function StorefrontAppBar({
  scrollY,
  insetTop,
  areaLabel,
  locationStatus,
  onPressLocation,
  onPressProfile,
  onPressBag,
  cartCount = 0,
  cartTotal = 0,
  formatTotal,
}) {
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, CONDENSE_RANGE], [0, 1], Extrapolation.CLAMP),
  }));

  const denied = locationStatus === 'denied';

  return (
    <View style={[styles.bar, { paddingTop: insetTop + spacing.s }]} pointerEvents="box-none">
      {/* Frosted backdrop — faded in by scroll, never intercepts a touch. */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.chrome, chromeStyle]}>
        <Gradient fill preset="chrome" />
        <View style={styles.chromeEdge} />
      </Animated.View>

      <PressableScale
        onPress={onPressLocation}
        scaleTo={0.97}
        accessibilityRole="button"
        accessibilityLabel={`Delivering to ${areaLabel}. Tap to update your location.`}
        style={styles.location}
      >
        <BrandMark size={30} />

        <View style={styles.locationText}>
          <View style={styles.locationLabelRow}>
            <Text style={styles.eyebrow}>DELIVERING TO</Text>
            <Icon name="chevron-down" size={11} color={colors.slate} />
          </View>

          <View style={styles.areaRow}>
            <Icon
              name={denied ? 'alert-circle' : 'map-pin'}
              size="sm"
              color={denied ? colors.gold : colors.crimsonGlow}
            />
            <Text style={styles.area} numberOfLines={1}>
              {areaLabel}
            </Text>
            {/* Nothing is shown while the fix resolves: `areaLabel` already
                reads "Locating…", and a second one beside it just stutters. */}
            {denied ? <Text style={styles.locationHint}>Enable GPS</Text> : null}
          </View>
        </View>
      </PressableScale>

      <View style={styles.actions}>
        <IconButton
          icon="user"
          onPress={onPressProfile}
          accessibilityLabel="Profile and settings"
          size={40}
        />

        <PressableScale
          onPress={onPressBag}
          scaleTo={0.94}
          accessibilityRole="button"
          accessibilityLabel={
            cartCount > 0
              ? `Your bag, ${cartCount} item${cartCount === 1 ? '' : 's'}`
              : 'Your bag, empty'
          }
          style={[styles.bag, cartCount > 0 && styles.bagFilled]}
        >
          <Icon
            name="shopping-bag"
            size="md"
            color={cartCount > 0 ? colors.crimsonGlow : colors.platinum}
          />

          {cartCount > 0 ? (
            <AnimatedNumber
              value={cartTotal}
              format={formatTotal}
              style={styles.bagValue}
              numberOfLines={1}
            />
          ) : null}

          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    gap: spacing.s,
  },
  chrome: {
    overflow: 'hidden',
  },
  chromeEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
  },
  location: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  locationText: {
    flex: 1,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2.2,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  area: {
    ...type.subheading,
    fontSize: 16,
    flexShrink: 1,
  },
  locationHint: {
    ...type.caption,
    color: colors.gold,
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  bag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
  },
  bagFilled: {
    borderColor: 'rgba(196, 36, 58, 0.45)',
    backgroundColor: colors.crimsonWashSoft,
  },
  bagValue: {
    ...type.label,
    fontSize: 13,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.crimsonBright,
    borderWidth: 1.5,
    borderColor: colors.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.ivory,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    fontVariant: ['tabular-nums'],
  },
});
