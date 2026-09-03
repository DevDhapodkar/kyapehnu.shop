import { useState } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import PressableScale from './PressableScale';
import { formatINR } from '../data/mockStores';
import { colors, radii, spacing } from '../theme/colors';

/**
 * StorefrontSpotlightCard
 *
 * Implements Stitch's Apple Glass Hero Spotlight Garment Card:
 * - 4:5 aspect ratio image with smooth rounded corners
 * - Top-left proximity badge: "⚡ 28 min delivery"
 * - Top-right wishlist toggle button
 * - Floating glass atelier banner: "Dharampeth · 1.4 km • Studio Anamika" + "Handcrafted" chip
 * - Tabular pricing architecture: ₹4,800 (strikethrough ₹6,499) + "26% Off Boutique"
 * - Primary Apple pill "Bag Now" action
 */
export default function StorefrontSpotlightCard({
  product,
  onPress,
  onBagNow,
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const defaultSpotlight = {
    id: 'spotlight-chanderi-angrakha',
    name: 'The Chanderi Silk Angrakha',
    category: 'Mulmul & Silks',
    description: 'Spun mulberry chanderi with hand-embroidered antique dabka edging.',
    price: 4800,
    originalPrice: 6499,
    discountPercent: 26,
    deliveryMinutes: 28,
    distanceKm: 1.4,
    locality: 'Dharampeth',
    storeName: 'Studio Anamika',
    badge: 'Handcrafted',
    image: require('../../assets/images/spotlight-angrakha.jpg'),
  };

  const item = product || defaultSpotlight;

  const handleToggleWishlist = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setIsWishlisted((prev) => !prev);
  };

  const handleBagPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onBagNow?.(item);
  };

  return (
    <View style={styles.outerContainer}>
      <PressableScale
        onPress={() => onPress?.(item)}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${formatINR(item.price)}`}
      >
        {/* Media Container */}
        <View style={styles.imageContainer}>
          <Image
            source={item.image}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />

          {/* Top-left Proximity Badge */}
          <View style={styles.deliveryPill}>
            <Text style={styles.boltIcon}>⚡</Text>
            <Text style={styles.deliveryText}>
              {item.deliveryMinutes || 28} min delivery
            </Text>
          </View>

          {/* Top-right Wishlist Toggle */}
          <Pressable
            onPress={handleToggleWishlist}
            hitSlop={8}
            style={({ pressed }) => [
              styles.wishlistBtn,
              pressed && styles.btnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'
            }
          >
            <Text
              style={[
                styles.heartIcon,
                isWishlisted && styles.heartIconActive,
              ]}
            >
              {isWishlisted ? '♥' : '♡'}
            </Text>
          </Pressable>

          {/* Floating Atelier Tag over bottom of image */}
          <View style={styles.atelierFloatingBar}>
            <View style={styles.atelierCol}>
              <Text style={styles.atelierEyebrow}>
                {item.locality || 'Dharampeth'} · {item.distanceKm || 1.4} km
              </Text>
              <Text style={styles.atelierStoreName}>{item.storeName}</Text>
            </View>
            <View style={styles.handcraftedChip}>
              <Text style={styles.handcraftedText}>
                {item.badge || 'Handcrafted'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Details & Actions */}
        <View style={styles.detailsContainer}>
          <View>
            <Text style={styles.title}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>

          {/* Price Row & Bag Now Action */}
          <View style={styles.footerRow}>
            <View style={styles.priceCol}>
              <View style={styles.priceLine}>
                <Text style={styles.currentPrice}>{formatINR(item.price)}</Text>
                {item.originalPrice ? (
                  <Text style={styles.originalPrice}>
                    {formatINR(item.originalPrice)}
                  </Text>
                ) : null}
              </View>
              {item.discountPercent ? (
                <Text style={styles.discountTag}>
                  {item.discountPercent}% OFF BOUTIQUE
                </Text>
              ) : null}
            </View>

            {/* Bag Now Action Button */}
            <PressableScale
              onPress={handleBagPress}
              style={styles.bagNowBtn}
              accessibilityRole="button"
              accessibilityLabel="Bag Now"
            >
              <Text style={styles.bagNowIcon}>👜</Text>
              <Text style={styles.bagNowLabel}>BAG NOW</Text>
            </PressableScale>
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.06)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 6,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: colors.groundSubtle,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deliveryPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  boltIcon: {
    color: colors.accentGold,
    fontSize: 11,
  },
  deliveryText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  heartIcon: {
    fontSize: 16,
    color: colors.textObsidian,
  },
  heartIconActive: {
    color: colors.accentCrimson,
  },
  btnPressed: {
    transform: [{ scale: 0.92 }],
  },
  atelierFloatingBar: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  atelierCol: {
    flex: 1,
  },
  atelierEyebrow: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  atelierStoreName: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 1,
  },
  handcraftedChip: {
    backgroundColor: 'rgba(18, 18, 20, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  handcraftedText: {
    color: colors.textSlate,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailsContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: colors.textObsidian,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  description: {
    color: colors.textAsh,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  priceCol: {
    gap: 2,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentPrice: {
    color: colors.textObsidian,
    fontSize: 18,
    fontWeight: '700',
  },
  originalPrice: {
    color: colors.textAsh,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  discountTag: {
    color: colors.accentCrimson,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bagNowBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  bagNowIcon: {
    fontSize: 13,
  },
  bagNowLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
