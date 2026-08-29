import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Gradient from './ui/Gradient';
import Icon from './ui/Icon';
import PressableScale from './ui/PressableScale';
import { formatINR } from '../data/mockStores';
import { colors, radii, spacing } from '../theme/colors';
import { duration, easing, elevation, stagger, type } from '../theme/tokens';

export const PRODUCT_CARD_WIDTH = 232;

/**
 * ProductCard
 *
 * A storefront tile. The photograph is the card — the frosted footer is laid
 * over its lower edge rather than sitting beneath it, so the tile reads as one
 * object instead of a picture with a caption bolted on.
 *
 * The information order is deliberate and matches how someone actually shops
 * here: how far away it is (the whole premise of the app), then what it is,
 * then what it costs, then who has it. Distance is a floating pill on the image
 * rather than a line of text in the footer, because it is the one fact that
 * decides whether the rest is worth reading.
 *
 * Props:
 *  - index: position in the feed, used to stagger the entrance so a row
 *           assembles left-to-right instead of snapping in as a block
 */
export default function ProductCard({ product, onPress, index = 0, width, style }) {
  const discount = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const distance = typeof product.distanceKm === 'number' ? product.distanceKm : null;
  const eta = typeof product.etaMinutes === 'number' ? product.etaMinutes : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(stagger(index))
        .duration(duration.slow)
        .easing(easing.out)}
    >
      <PressableScale
        onPress={onPress}
        scaleTo={0.965}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatINR(product.price)}, from ${product.storeName}`}
        style={[styles.card, width ? { width } : null, style]}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            contentFit="cover"
            transition={260}
            // A dark placeholder means the tile never flashes white on a card
            // that is otherwise entirely obsidian.
            placeholderContentFit="cover"
            recyclingKey={product.id}
          />

          {/* Legibility ramp under the footer — transparent at the top so the
              garment is never dimmed where it matters. */}
          <Gradient
            fill
            preset="imageScrim"
            locations={[0, 0.55, 1]}
            pointerEvents="none"
          />

          {distance !== null ? (
            <View style={styles.distancePill}>
              <Icon name="map-pin" size="xs" color={colors.goldBright} />
              <Text style={styles.distanceText}>{distance} km</Text>
            </View>
          ) : null}

          {discount > 0 ? (
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.category} numberOfLines={1}>
            {String(product.category ?? '').toUpperCase()}
          </Text>

          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(product.price)}</Text>
            {product.mrp ? <Text style={styles.mrp}>{formatINR(product.mrp)}</Text> : null}
          </View>

          <View style={styles.storeRow}>
            <Icon name="shopping-bag" size="xs" color={colors.slate} />
            <Text style={styles.store} numberOfLines={1}>
              {product.storeName}
            </Text>
            {eta !== null ? (
              <Text style={styles.eta} numberOfLines={1}>
                · {eta} min
              </Text>
            ) : null}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/** The card's loading stand-in, sized to match so the feed does not reflow. */
export function ProductCardSkeleton({ width, style }) {
  return (
    <View style={[styles.card, styles.skeletonCard, width ? { width } : null, style]}>
      <View style={styles.skeletonImage} />
      <View style={styles.footer}>
        <View style={[styles.skeletonLine, { width: '40%' }]} />
        <View style={[styles.skeletonLine, { width: '85%', height: 15, marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: '55%', marginTop: 10 }]} />
      </View>
    </View>
  );
}

/** Garment photography is shot portrait; 3:4 is the frame it is cropped to. */
const IMAGE_RATIO = 3 / 4;

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.charcoal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    ...elevation.medium,
  },
  imageWrap: {
    // A ratio rather than a fixed height: the same card is used at full width
    // for a rail and at half width in the grid, and a fixed height turns the
    // narrow variant into a letterbox.
    aspectRatio: IMAGE_RATIO,
    backgroundColor: colors.charcoalLight,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },

  distancePill: {
    position: 'absolute',
    top: spacing.s,
    left: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.scrimStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200, 162, 74, 0.35)',
  },
  distanceText: {
    ...type.caption,
    color: colors.goldBright,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  discountPill: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.s,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.crimsonBright,
  },
  discountText: {
    color: colors.ivory,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  footer: {
    // Pulled up over the photograph's lower edge so the two layers overlap.
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  category: {
    ...type.eyebrow,
    color: colors.ash,
    fontSize: 9,
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  name: {
    ...type.subheading,
    fontSize: 15,
    fontWeight: '400',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: 6,
  },
  price: {
    ...type.numeric,
    fontSize: 16,
  },
  mrp: {
    ...type.caption,
    color: colors.slate,
    textDecorationLine: 'line-through',
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  store: {
    ...type.caption,
    color: colors.ash,
    flexShrink: 1,
  },
  eta: {
    ...type.caption,
    color: colors.slate,
    // Never give up width to the shop name — the ETA is the shorter, and the
    // more decision-relevant, of the two.
    flexShrink: 0,
  },

  skeletonCard: {
    borderColor: 'rgba(245, 243, 239, 0.06)',
  },
  skeletonImage: {
    aspectRatio: IMAGE_RATIO,
    backgroundColor: colors.charcoalLight,
  },
  skeletonLine: {
    height: 10,
    borderRadius: radii.xs,
    backgroundColor: colors.charcoalLight,
  },
});
