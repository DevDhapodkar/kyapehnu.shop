import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, Gradient, IconButton } from './ui';
import { formatINR } from '../data/mockStores';
import { colors, gradients, radii, shadows, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

/**
 * ProductCard
 *
 * A bento tile: the photograph *is* the card, and every piece of type sits on
 * top of it rather than beside it. That is what keeps a two-column grid reading
 * as a wall of clothes instead of a spreadsheet with pictures.
 *
 * Three layers, back to front:
 *  1. the image, filling the tile
 *  2. a gradient scrim over the lower half — without it, white type on a pale
 *     garment is unreadable, and a flat 50% wash would grey out the whole photo
 *  3. floating chrome: a category chip and the open-piece disc at the top, a
 *     frosted caption panel inset from the bottom edge
 *
 * The caption is inset rather than flush so the photograph frames it on all
 * four sides, which is what makes it read as a pane laid on the image.
 *
 * The disc sits in the tile's corner rather than in the caption on purpose: in
 * a two-column grid the caption is about 150pt wide, and a 34pt button inside
 * it truncates every garment name to two words.
 */
export default function ProductCard({ product, onPress, style }) {
  const distance = typeof product.distanceKm === 'number' ? `${product.distanceKm} km` : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatINR(product.price)}, from ${product.storeName}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <Image
        source={{ uri: product.image }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={220}
      />

      <Gradient
        pointerEvents="none"
        colors={gradients.imageScrim}
        direction="vertical"
        steps={24}
        style={styles.scrim}
      />

      <View style={styles.topRow}>
        {product.category ? <Chip label={product.category} size="sm" tone="glass" /> : null}

        <IconButton
          glyph="↗"
          tone="light"
          size={34}
          onPress={onPress}
          accessibilityLabel={`Open ${product.name}`}
        />
      </View>

      <View style={styles.caption}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.store}>
          {[product.storeName, distance].filter(Boolean).join('  ·  ')}
        </Text>
        <Text style={styles.price}>{formatINR(product.price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    // Portrait, near the 3:4 of the catalogue photography, so the garment fills
    // the tile instead of being letterboxed inside it.
    aspectRatio: 0.74,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    ...shadows.medium,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
  },
  topRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  caption: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: colors.glassFillDense,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
  },
  name: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.ivory,
  },
  store: {
    ...typography.caption,
    fontSize: 10,
    color: colors.ash,
    marginTop: 2,
  },
  price: {
    ...typography.numeric,
    fontSize: 16,
    color: colors.ivory,
    marginTop: 5,
  },
});
