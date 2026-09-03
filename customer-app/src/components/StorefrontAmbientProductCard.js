import { useState } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from './PressableScale';
import { formatINR } from '../data/mockStores';
import { colors, radii, spacing } from '../theme/colors';

export const AMBIENT_CARD_WIDTH = 200;

/**
 * StorefrontAmbientProductCard
 *
 * Implements Stitch's Frosted Glass & Ambient Blobs horizontal rail card:
 * - 200px width with glass-card semi-translucent backdrop
 * - 3:4 aspect ratio photo
 * - Glass schedule badge: schedule 32 min (MaterialIcons)
 * - Glass favorite heart toggle (MaterialIcons)
 * - Bottom glass pill locality banner ("Gandhibagh · 2.1 km")
 * - Compact horizontal footer: Name & Price on left, glass-pill "add" on right
 * - Zero Emojis
 */
export default function StorefrontAmbientProductCard({
  product,
  onPress,
  onQuickAdd,
}) {
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
          <MaterialIcons name="schedule" size={11} color={colors.accentGold} />
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
          <MaterialIcons
            name={isWishlisted ? 'favorite' : 'favorite-border'}
            size={14}
            color={isWishlisted ? colors.accentCrimson : colors.textObsidian}
          />
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

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.price}>{formatINR(product.price)}</Text>
        </View>

        {onQuickAdd ? (
          <PressableScale
            onPress={handleQuickAdd}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Quick add to bag"
          >
            <MaterialIcons name="add" size={17} color={colors.textObsidian} />
          </PressableScale>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    width: AMBIENT_CARD_WIDTH,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    marginRight: spacing.sm,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  schedulePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
  scheduleText: {
    color: colors.textObsidian,
    fontSize: 9.5,
    fontWeight: '700',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
  localityBanner: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
  localityText: {
    color: colors.textObsidian,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  infoRow: {
    padding: spacing.sm + 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  infoLeft: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  price: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
});
