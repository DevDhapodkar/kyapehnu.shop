import { useState } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from './PressableScale';
import { formatCurrency as formatINR } from '../utils/format';
import { resolveProductImageUri } from '../utils/productImage';
import { colors, radii, spacing } from '../theme/colors';
import { spring } from '../theme/motion';
import { useTheme } from '../theme/useTheme';

/**
 * StorefrontAmbientSpotlightCard
 *
 * Implements Stitch's Heavy Frosted Glass & Reduced Text Spotlight Card:
 * - 4:5 aspect ratio image
 * - Glass proximity pill: bolt 28 min (MaterialIcons)
 * - Glass wishlist toggle: favorite / favorite-border with Apple spring bounce
 * - Floating glass atelier bar: Studio Anamika | Dharampeth · 1.4 km
 * - Compact horizontal footer: Title & Price on left, Pill "Bag" button on right
 */
export default function StorefrontAmbientSpotlightCard({
  product,
  onPress,
  onBagNow,
}) {
  const { colors, isDark } = useTheme();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const heartScale = useSharedValue(1);

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  if (!product) return null;

  const item = product;

  // Honest data only: never invent a boutique name, locality, distance or ETA
  // when the product record does not carry one.
  const storeName = item.storeName || 'Boutique';
  const localityLine = [
    item.locality,
    typeof item.distanceKm === 'number' ? `${item.distanceKm} km` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Nested Pressables (wishlist / bag) already stop the press from reaching the
  // card's onPress, so tapping them does not open the detail view.
  const handleToggleWishlist = (e) => {
    e?.stopPropagation?.();
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    heartScale.value = withSequence(
      withTiming(1.38, { duration: 110 }),
      withSpring(1, spring.pop)
    );
    setIsWishlisted((prev) => !prev);
  };

  const handleBagPress = (e) => {
    e?.stopPropagation?.();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onBagNow?.(item);
  };

  return (
    <View style={styles.outerContainer}>
      <PressableScale
        onPress={() => onPress?.(item)}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(22, 22, 25, 0.88)' : 'rgba(255, 255, 255, 0.55)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.82)',
          },
        ]}
        accessibilityLabel={`${item.name}, ${formatINR(item.price)}`}
      >
        {/* Media Container (4:5 Aspect Ratio) */}
        <View style={styles.imageContainer}>
          <Image
            source={
              typeof item.image === 'number'
                ? item.image
                : {
                    uri: resolveProductImageUri(
                      imageFailed
                        ? null
                        : typeof item.image === 'string'
                        ? item.image
                        : item.image?.uri
                    ),
                  }
            }
            style={styles.image}
            contentFit="cover"
            transition={300}
            onError={() => setImageFailed(true)}
          />

          {/* Top-left Glass Pill — only when a real ETA exists */}
          {item.deliveryMinutes ? (
            <View
              style={[
                styles.deliveryPill,
                {
                  backgroundColor: isDark ? 'rgba(20, 20, 24, 0.82)' : 'rgba(255, 255, 255, 0.55)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.80)',
                },
              ]}
            >
              <MaterialIcons name="bolt" size={13} color={colors.accentGold} />
              <Text style={[styles.deliveryText, { color: colors.textObsidian }]}>
                {item.deliveryMinutes} min
              </Text>
            </View>
          ) : null}

          {/* Top-right Glass Wishlist */}
          <Pressable
            onPress={handleToggleWishlist}
            hitSlop={8}
            style={({ pressed }) => [
              styles.wishlistBtn,
              {
                backgroundColor: isDark ? 'rgba(20, 20, 24, 0.82)' : 'rgba(255, 255, 255, 0.55)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.80)',
              },
              pressed && styles.btnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'
            }
          >
            <Animated.View style={animatedHeartStyle}>
              <MaterialIcons
                name={isWishlisted ? 'favorite' : 'favorite-border'}
                size={17}
                color={isWishlisted ? colors.accentCrimson : colors.textObsidian}
              />
            </Animated.View>
          </Pressable>

          {/* Bottom Floating Atelier Tag */}
          <View
            style={[
              styles.atelierBar,
              {
                backgroundColor: isDark ? 'rgba(20, 20, 24, 0.85)' : 'rgba(255, 255, 255, 0.55)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.80)',
              },
            ]}
          >
            <Text style={[styles.storeNameText, { color: colors.textObsidian }]}>{storeName}</Text>
            {localityLine ? (
              <Text style={[styles.localityText, { color: colors.accentGoldDeep }]}>{localityLine}</Text>
            ) : null}
          </View>
        </View>

        {/* Compact Footer Pane */}
        <View style={styles.footerRow}>
          <View style={styles.metaCol}>
            <Text style={[styles.title, { color: colors.textObsidian }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.textObsidian }]}>{formatINR(item.price)}</Text>
              {item.originalPrice ? (
                <Text style={styles.originalPrice}>
                  {formatINR(item.originalPrice)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Bag Pill Action */}
          <PressableScale
            onPress={handleBagPress}
            style={styles.bagBtn}
            accessibilityRole="button"
            accessibilityLabel="Bag item"
          >
            <MaterialIcons name="shopping-bag" size={16} color="#FFFFFF" />
            <Text style={styles.bagLabel}>BAG</Text>
          </PressableScale>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 6,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(210%) brightness(105%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%) brightness(105%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.85), 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deliveryPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  deliveryText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '600',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  btnPressed: {
    transform: [{ scale: 0.92 }],
  },
  atelierBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  storeNameText: {
    color: colors.textObsidian,
    fontSize: 12,
    fontWeight: '500',
  },
  localityText: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footerRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaCol: {
    flex: 1,
  },
  title: {
    color: colors.textObsidian,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  price: {
    color: colors.textObsidian,
    fontSize: 17,
    fontWeight: '600',
  },
  originalPrice: {
    color: colors.textAsh,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  bagBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  bagLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
