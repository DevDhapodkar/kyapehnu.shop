import { useState } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import PressableScale from './PressableScale';
import { formatCurrency as formatINR } from '../utils/format';
import { colors, radii, spacing } from '../theme/colors';

export const PRODUCT_CARD_WIDTH = 210;

/**
 * ProductCard
 *
 * Implements Stitch's Apple Glass horizontal rail card:
 * - 3:4 aspect ratio garment photography
 * - Glass schedule badge ("⏱ 32 min") & wishlist button
 * - Floating locality banner ("Gandhibagh · 2.1 km")
 * - Clean white bottom pane with store provenance, bold tabular price, and quick-add "+"
 */
export default function ProductCard({ product, onPress, onQuickAdd }) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleToggleWishlist = (e) => {
    e?.stopPropagation?.();
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setIsWishlisted((prev) => !prev);
  };

  const handleQuickAdd = (e) => {
    e?.stopPropagation?.();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onQuickAdd?.(product);
  };

  // Estimate delivery minutes based on distance (approx 15 + distance * 8)
  const deliveryMins =
    product.deliveryMinutes ||
    (typeof product.distanceKm === 'number'
      ? Math.round(15 + product.distanceKm * 7)
      : 25);

  return (
    <PressableScale
      onPress={onPress}
      haptic={false}
      accessibilityLabel={`${product.name}, ${formatINR(product.price)}`}
      style={styles.card}
    >
      {/* Media Box */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          contentFit="cover"
          transition={250}
        />

        {/* Top-left Glass Schedule Pill */}
        <View style={styles.schedulePill}>
          <Text style={styles.scheduleIcon}>⏱</Text>
          <Text style={styles.scheduleText}>{deliveryMins} min</Text>
        </View>

        {/* Top-right Wishlist Button */}
        <Pressable
          onPress={handleToggleWishlist}
          hitSlop={6}
          style={styles.favBtn}
          accessibilityRole="button"
          accessibilityLabel="Wishlist item"
        >
          <Text style={[styles.favIcon, isWishlisted && styles.favActive]}>
            {isWishlisted ? '♥' : '♡'}
          </Text>
        </Pressable>

        {/* Floating Locality Banner */}
        {product.storeName ? (
          <View style={styles.localityBanner}>
            <Text style={styles.localityText} numberOfLines={1}>
              {product.storeName}
              {typeof product.distanceKm === 'number'
                ? ` · ${product.distanceKm} km`
                : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Info Pane */}
      <View style={styles.infoPane}>
        <View>
          <Text style={styles.category} numberOfLines={1}>
            {product.category?.toUpperCase() || 'COUTURE'}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.price}>{formatINR(product.price)}</Text>

          {onQuickAdd ? (
            <PressableScale
              onPress={handleQuickAdd}
              style={styles.addBtn}
              accessibilityRole="button"
              accessibilityLabel="Quick add to bag"
            >
              <Text style={styles.addIcon}>+</Text>
            </PressableScale>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    width: PRODUCT_CARD_WIDTH,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.05)',
    marginRight: spacing.sm,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.groundSubtle,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  schedulePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  scheduleIcon: {
    fontSize: 10,
  },
  scheduleText: {
    color: colors.textObsidian,
    fontSize: 10,
    fontWeight: '700',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favIcon: {
    fontSize: 13,
    color: colors.textObsidian,
  },
  favActive: {
    color: colors.accentCrimson,
  },
  localityBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(18, 18, 22, 0.72)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  localityText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  infoPane: {
    padding: spacing.sm + 2,
    backgroundColor: '#FFFFFF',
    gap: spacing.xs,
  },
  category: {
    color: colors.textAsh,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  name: {
    color: colors.textObsidian,
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    color: colors.textObsidian,
    fontSize: 15,
    fontWeight: '700',
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.groundSubtle,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '600',
    marginTop: -1,
  },
});
