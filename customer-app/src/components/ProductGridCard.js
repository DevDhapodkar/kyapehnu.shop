import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatINR } from '../data/mockStores';
import { colors, radii, spacing } from '../theme/colors';

/**
 * ProductGridCard
 *
 * The vertical tile used in the shopping grids (department listing, search
 * results). Unlike the horizontal Home feed's ProductCard, this one flexes to
 * the column width it is given and shows the MRP strike-through and saving, since
 * the browsing context is where price comparison actually happens.
 */
export default function ProductGridCard({ product, onPress, style }) {
  const hasDiscount = product.mrp && product.mrp > product.price;
  const off = hasDiscount ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={200} />
        {hasDiscount ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{off}% OFF</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          {(product.type ?? product.category ?? '').toUpperCase()}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(product.price)}</Text>
          {hasDiscount ? <Text style={styles.mrp}>{formatINR(product.mrp)}</Text> : null}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.store} numberOfLines={1}>{product.storeName}</Text>
          {product.distanceKm != null ? (
            <Text style={styles.distance}>{product.distanceKm} km</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.charcoal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  pressed: { opacity: 0.82 },
  imageWrap: { position: 'relative' },
  image: {
    width: '100%',
    aspectRatio: 0.82,
    backgroundColor: colors.charcoalLight,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.crimsonBright,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: colors.ivory, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  body: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  eyebrow: { color: colors.ash, fontSize: 8.5, letterSpacing: 1.6, marginBottom: 4 },
  name: { color: colors.ivory, fontSize: 14, fontWeight: '400', letterSpacing: -0.2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: 6 },
  price: { color: colors.ivory, fontSize: 14, fontWeight: '600' },
  mrp: { color: colors.slate, fontSize: 11, textDecorationLine: 'line-through' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 5,
    gap: spacing.xs,
  },
  store: { color: colors.slate, fontSize: 10, flex: 1 },
  distance: { color: colors.gold, fontSize: 10, letterSpacing: 0.6 },
});
