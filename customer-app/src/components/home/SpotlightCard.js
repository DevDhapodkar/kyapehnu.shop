import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import Gradient from '../ui/Gradient';
import Icon from '../ui/Icon';
import PressableScale from '../ui/PressableScale';
import { formatINR } from '../../data/mockStores';
import { colors, radii, spacing } from '../../theme/colors';
import { duration, easing, elevation, type } from '../../theme/tokens';

/**
 * SpotlightCard
 *
 * The single piece the storefront leads with, given a full-bleed card of its
 * own. A grid of equal tiles gives the eye nowhere to land first; one hero
 * establishes the scale of the photography and gives the page an entry point,
 * and the grid below then reads as "and the rest" rather than as an
 * undifferentiated wall.
 *
 * Everything sits over the photograph on a bottom-weighted scrim, so the card
 * is one image rather than an image plus a panel.
 */
export default function SpotlightCard({ product, onPress, eyebrow = 'CLOSEST TO YOU' }) {
  if (!product) return null;

  const distance = typeof product.distanceKm === 'number' ? product.distanceKm : null;
  const eta = typeof product.etaMinutes === 'number' ? product.etaMinutes : null;
  const discount = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <Animated.View entering={FadeIn.duration(duration.deliberate).easing(easing.out)}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${product.name} from ${product.storeName}, ${formatINR(product.price)}`}
        style={styles.card}
      >
        <Image
          source={{ uri: product.image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={320}
          recyclingKey={product.id}
        />

        <Gradient fill preset="imageScrim" locations={[0, 0.48, 1]} pointerEvents="none" />

        <View style={styles.topRow}>
          <View style={styles.eyebrowPill}>
            <Icon name="zap" size="xs" color={colors.goldBright} />
            <Text style={styles.eyebrowText}>{eyebrow}</Text>
          </View>

          {discount > 0 ? (
            <View style={styles.discount}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{String(product.category ?? '').toUpperCase()}</Text>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.price}>{formatINR(product.price)}</Text>
            {product.mrp ? <Text style={styles.mrp}>{formatINR(product.mrp)}</Text> : null}
          </View>

          <View style={styles.footRow}>
            <View style={styles.storeRow}>
              <Icon name="shopping-bag" size="xs" color={colors.platinum} />
              <Text style={styles.store} numberOfLines={1}>
                {product.storeName}
              </Text>
              {distance !== null ? (
                <Text style={styles.storeMeta}>· {distance} km</Text>
              ) : null}
              {eta !== null ? <Text style={styles.storeMeta}>· {eta} min</Text> : null}
            </View>

            <View style={styles.cta}>
              <Icon name="arrow-right" size="md" color={colors.ivory} />
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 420,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.charcoal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    justifyContent: 'space-between',
    ...elevation.high,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.s + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.scrimStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200, 162, 74, 0.4)',
  },
  eyebrowText: {
    ...type.eyebrow,
    color: colors.goldBright,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  discount: {
    paddingHorizontal: spacing.s + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.crimsonBright,
  },
  discountText: {
    color: colors.ivory,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  body: {
    padding: spacing.m,
  },
  category: {
    ...type.eyebrow,
    color: colors.gold,
    fontSize: 9,
    marginBottom: spacing.xs,
  },
  name: {
    ...type.title,
    fontSize: 26,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  price: {
    ...type.numeric,
    fontSize: 22,
  },
  mrp: {
    ...type.bodySmall,
    color: colors.ash,
    textDecorationLine: 'line-through',
  },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  storeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  store: {
    ...type.bodySmall,
    color: colors.platinum,
    flexShrink: 1,
  },
  storeMeta: {
    ...type.caption,
    color: colors.ash,
  },
  cta: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.crimsonBright,
    ...elevation.accent,
  },
});
