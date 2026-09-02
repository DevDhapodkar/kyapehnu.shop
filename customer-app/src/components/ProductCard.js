import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import PressableScale from './PressableScale';
import { formatINR } from '../data/mockStores';
import { colors, radii, spacing } from '../theme/colors';

export const PRODUCT_CARD_WIDTH = 210;

/**
 * ProductCard
 *
 * The horizontal-feed tile on Home. The image fills the top two-thirds and the
 * frosted footer sits on top of its lower edge, so the photo reads as the card
 * surface and the glass reads as a pane laid over it.
 */
export default function ProductCard({ product, onPress }) {
  return (
    <PressableScale
      onPress={onPress}
      haptic={false}
      accessibilityLabel={`${product.name}, ${formatINR(product.price)}`}
      style={styles.card}
    >
      <Image
        source={{ uri: product.image }}
        style={styles.image}
        contentFit="cover"
        transition={220}
      />

      {/* Frosted footer: the only place a card shows price and provenance. */}
      <View style={styles.footer}>
        <View pointerEvents="none" style={styles.footerFill} />
        <View pointerEvents="none" style={styles.footerHighlight} />

        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.price}>{formatINR(product.price)}</Text>
          {typeof product.distanceKm === 'number' ? (
            <Text style={styles.distance}>{product.distanceKm} km</Text>
          ) : null}
        </View>

        <Text style={styles.store} numberOfLines={1}>
          {product.storeName}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    width: PRODUCT_CARD_WIDTH,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.charcoal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    marginRight: spacing.sm,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: 240,
    backgroundColor: colors.charcoalLight,
  },
  footer: {
    position: 'relative',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  footerFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFillStrong,
  },
  footerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  category: {
    color: colors.ash,
    fontSize: 9,
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  name: {
    color: colors.ivory,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    color: colors.ivory,
    fontSize: 15,
    fontWeight: '600',
  },
  distance: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  store: {
    color: colors.slate,
    fontSize: 11,
    marginTop: 3,
  },
});
