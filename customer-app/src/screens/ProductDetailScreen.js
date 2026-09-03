import { useState } from 'react';
import { Image } from 'expo-image';
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import PressableScale from '../components/PressableScale';
import { formatINR } from '../data/mockStores';
import { useCartStore } from '../store/useCartStore';
import { colors, radii, spacing } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(540, SCREEN_HEIGHT * 0.58);

const ANGLES = [
  { id: 'front', label: 'Front' },
  { id: 'drape', label: 'Drape' },
  { id: 'weave', label: 'Weave' },
  { id: 'back', label: 'Back' },
];

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/**
 * ProductDetailScreen — Frosted Glass & Ambient Blobs
 *
 * Implements Stitch Screen 73771ce0e0844d4aa6137bdc45d2e43b:
 * - Animated drifting ambient background blobs
 * - Floating glass top navigation bar (Back, Wordmark, Wishlist, Share)
 * - Multi-angle view capsule switcher (Front, Drape, Weave, Back)
 * - Atelier & garment title card with tabular pricing & discount
 * - Frosted glass size selector & size guide modal
 * - Couture specifications grid (Fabric, Cut, Care, Set)
 * - Atelier concierge card with Call & Video Consultation
 * - Sticky bottom frosted glass action bar with live Add to Bag
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params || {};
  const insets = useSafeAreaInsets();

  const [activeAngle, setActiveAngle] = useState('front');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    product?.sizes?.[0] || 'S'
  );
  const [addedToast, setAddedToast] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);

  const fallbackProduct = {
    id: 'chanderi-angrakha-01',
    name: 'Chanderi Angrakha',
    price: 4800,
    mrp: 6499,
    storeName: 'Studio Anamika',
    storeArea: 'Dharampeth',
    distanceKm: 1.4,
    rating: 4.9,
    description:
      'Spun mulberry chanderi with hand-embroidered antique dabka edging, crafted by master artisans in Nagpur.',
    image: require('../../assets/images/spotlight-angrakha.jpg'),
  };

  const item = product || fallbackProduct;
  const sizes = item.sizes?.length ? item.sizes : DEFAULT_SIZES;

  const discountPercent = item.mrp
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
    : 26;

  // Parallax scroll handler
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroImageStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    return {
      transform: [
        { translateY: Math.max(0, y * 0.35) },
        {
          scale: interpolate(
            y,
            [-HERO_HEIGHT, 0, HERO_HEIGHT],
            [1.25, 1, 1.1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const handleToggleWishlist = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setIsWishlisted((prev) => !prev);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.name} from ${item.storeName} on Kya Pehnu? - Nagpur Express Luxury`,
      });
    } catch {
      // ignore
    }
  };

  const handleSizeGuide = () => {
    Alert.alert(
      'Size Guide',
      'XS: Bust 32" | Waist 26"\nS: Bust 34" | Waist 28"\nM: Bust 36" | Waist 30"\nL: Bust 38" | Waist 32"\nXL: Bust 40" | Waist 34"\n\nTailor fitting available upon delivery.'
    );
  };

  const handleAddToCart = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    addToCart(item, selectedSize);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2600);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Frosted Top Bar */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarInner} pointerEvents="auto">
          <PressableScale
            onPress={() => navigation.goBack()}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={17}
              color={colors.textObsidian}
            />
          </PressableScale>

          <View style={styles.brandCenter}>
            <Text style={styles.brandPrimary}>KYA</Text>
            <Text style={styles.brandAccent}> PEHNU?</Text>
          </View>

          <View style={styles.topBarRight}>
            <PressableScale
              onPress={handleToggleWishlist}
              style={styles.topBarBtn}
              accessibilityRole="button"
              accessibilityLabel="Wishlist item"
            >
              <MaterialIcons
                name={isWishlisted ? 'favorite' : 'favorite-border'}
                size={18}
                color={isWishlisted ? colors.accentCrimson : colors.textObsidian}
              />
            </PressableScale>

            <PressableScale
              onPress={handleShare}
              style={styles.topBarBtn}
              accessibilityRole="button"
              accessibilityLabel="Share item"
            >
              <MaterialIcons
                name="share"
                size={17}
                color={colors.textObsidian}
              />
            </PressableScale>
          </View>
        </View>
      </View>

      {/* 3. Scrollable Garment Presentation */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Media Hero Container */}
        <View style={styles.heroContainer}>
          <Animated.View style={[styles.heroImageWrap, heroImageStyle]}>
            <Image
              source={
                typeof item.image === 'string' ? { uri: item.image } : item.image
              }
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          </Animated.View>

          {/* Floating Angle Switcher Bar */}
          <View style={styles.angleSwitcherBar}>
            {ANGLES.map((angle) => {
              const isActive = activeAngle === angle.id;
              return (
                <Pressable
                  key={angle.id}
                  onPress={() => setActiveAngle(angle.id)}
                  style={[
                    styles.anglePill,
                    isActive && styles.anglePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.anglePillText,
                      isActive && styles.anglePillTextActive,
                    ]}
                  >
                    {angle.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Content Sheet Section */}
        <View style={styles.sheetContent}>
          {/* Card 1: Title & Pricing */}
          <View style={styles.glassCard}>
            <Text style={styles.atelierEyebrow}>
              {item.storeName} · {item.storeArea || 'Dharampeth'}
            </Text>
            <Text style={styles.title}>{item.name}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>{formatINR(item.price)}</Text>
              {item.mrp ? (
                <Text style={styles.originalPrice}>{formatINR(item.mrp)}</Text>
              ) : null}
              {discountPercent ? (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {discountPercent}% OFF
                  </Text>
                </View>
              ) : null}
            </View>

            {item.description ? (
              <Text style={styles.descriptionText}>{item.description}</Text>
            ) : null}
          </View>

          {/* Card 2: Size Selector */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>Size</Text>
              <PressableScale
                onPress={handleSizeGuide}
                style={styles.guideBtn}
                accessibilityRole="button"
                accessibilityLabel="Size Guide"
              >
                <MaterialIcons
                  name="straighten"
                  size={14}
                  color={colors.accentGoldDeep}
                />
                <Text style={styles.guideText}>Guide</Text>
              </PressableScale>
            </View>

            <View style={styles.sizesRow}>
              {sizes.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <PressableScale
                    key={sz}
                    onPress={() => setSelectedSize(sz)}
                    style={[
                      styles.sizePill,
                      isSelected ? styles.sizePillSelected : styles.sizePillGlass,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        isSelected ? styles.sizeTextSelected : styles.sizeTextGlass,
                      ]}
                    >
                      {sz}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Card 3: Specifications Grid */}
          <View style={styles.glassCard}>
            <Text style={styles.cardHeaderTitle}>Couture Details</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <MaterialIcons
                  name="texture"
                  size={16}
                  color={colors.accentGold}
                />
                <View>
                  <Text style={styles.specLabel}>Fabric</Text>
                  <Text style={styles.specValue}>Chanderi Silk</Text>
                </View>
              </View>

              <View style={styles.specItem}>
                <MaterialIcons
                  name="styler"
                  size={16}
                  color={colors.accentGold}
                />
                <View>
                  <Text style={styles.specLabel}>Cut</Text>
                  <Text style={styles.specValue}>Flared Angrakha</Text>
                </View>
              </View>

              <View style={styles.specItem}>
                <MaterialIcons
                  name="dry-cleaning"
                  size={16}
                  color={colors.accentGold}
                />
                <View>
                  <Text style={styles.specLabel}>Care</Text>
                  <Text style={styles.specValue}>Dry Clean Only</Text>
                </View>
              </View>

              <View style={styles.specItem}>
                <MaterialIcons
                  name="checkroom"
                  size={16}
                  color={colors.accentGold}
                />
                <View>
                  <Text style={styles.specLabel}>Includes</Text>
                  <Text style={styles.specValue}>3-Piece Set</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card 4: Atelier Concierge */}
          <View style={styles.glassCard}>
            <View style={styles.atelierRow}>
              <View style={styles.atelierInfo}>
                <Text style={styles.atelierName}>{item.storeName}</Text>
                <Text style={styles.atelierDetails}>
                  {item.storeArea || 'Dharampeth'} · {item.distanceKm || 1.4} km · ★ {item.rating || 4.9}
                </Text>
              </View>

              <View style={styles.atelierActions}>
                <PressableScale
                  onPress={() => Alert.alert('Concierge', `Calling ${item.storeName} atelier...`)}
                  style={styles.atelierActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Call atelier"
                >
                  <MaterialIcons
                    name="call"
                    size={16}
                    color={colors.textObsidian}
                  />
                </PressableScale>

                <PressableScale
                  onPress={() =>
                    Alert.alert(
                      'Video Consultation',
                      `Connecting with stylist at ${item.storeName}...`
                    )
                  }
                  style={styles.atelierActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Video consultation"
                >
                  <MaterialIcons
                    name="videocam"
                    size={17}
                    color={colors.textObsidian}
                  />
                </PressableScale>
              </View>
            </View>
          </View>

          {/* Spacing for sticky bottom bar */}
          <View style={{ height: insets.bottom + 90 }} />
        </View>
      </Animated.ScrollView>

      {/* 4. Added to Bag Toast */}
      {addedToast ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toastInner}>
            <MaterialIcons
              name="check-circle"
              size={17}
              color={colors.accentGold}
            />
            <Text style={styles.toastText}>Added to Bag (Size {selectedSize})</Text>
          </View>
        </View>
      ) : null}

      {/* 5. Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomBarWrap,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <View style={styles.bottomBar}>
          <View style={styles.priceCol}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalPrice}>{formatINR(item.price)}</Text>
          </View>

          <PressableScale
            onPress={handleAddToCart}
            style={styles.addToBagBtn}
            accessibilityRole="button"
            accessibilityLabel="Add to Bag"
          >
            <MaterialIcons name="shopping-bag" size={17} color="#FFFFFF" />
            <Text style={styles.addToBagLabel}>ADD TO BAG</Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4EFE7',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
  },
  topBarInner: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  topBarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPrimary: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  brandAccent: {
    fontStyle: 'italic',
    color: colors.accentCrimson,
    fontSize: 12.5,
    fontWeight: '700',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  heroContainer: {
    width: '100%',
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  angleSwitcherBar: {
    position: 'absolute',
    bottom: 16,
    left: spacing.md,
    right: spacing.md,
    height: 42,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  anglePill: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  anglePillActive: {
    backgroundColor: colors.textObsidian,
  },
  anglePillText: {
    color: colors.textSlate,
    fontSize: 11,
    fontWeight: '600',
  },
  anglePillTextActive: {
    color: '#FFFFFF',
  },
  sheetContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm + 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(210%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%)',
      },
    }),
  },
  atelierEyebrow: {
    color: colors.accentGoldDeep,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: colors.textObsidian,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  currentPrice: {
    color: colors.textObsidian,
    fontSize: 20,
    fontWeight: '700',
  },
  originalPrice: {
    color: colors.textAsh,
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
  },
  discountText: {
    color: colors.accentCrimson,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  descriptionText: {
    color: colors.textSlate,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  cardHeaderTitle: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  guideText: {
    color: colors.accentGoldDeep,
    fontSize: 11,
    fontWeight: '600',
  },
  sizesRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  sizePill: {
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizePillSelected: {
    backgroundColor: colors.textObsidian,
    shadowColor: colors.textObsidian,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  sizePillGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sizeTextSelected: {
    color: '#FFFFFF',
  },
  sizeTextGlass: {
    color: colors.textObsidian,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  specItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  specLabel: {
    color: colors.textAsh,
    fontSize: 9.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  specValue: {
    color: colors.textObsidian,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  atelierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atelierInfo: {
    flex: 1,
  },
  atelierName: {
    color: colors.textObsidian,
    fontSize: 15,
    fontWeight: '600',
  },
  atelierDetails: {
    color: colors.textAsh,
    fontSize: 11,
    marginTop: 2,
  },
  atelierActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  atelierActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastWrap: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    zIndex: 60,
    alignItems: 'center',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 18, 21, 0.88)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  bottomBarWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    zIndex: 50,
  },
  bottomBar: {
    height: 64,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(36px) saturate(210%)',
        WebkitBackdropFilter: 'blur(36px) saturate(210%)',
      },
    }),
  },
  priceCol: {
    gap: 1,
  },
  totalLabel: {
    color: colors.textAsh,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  totalPrice: {
    color: colors.textObsidian,
    fontSize: 18,
    fontWeight: '700',
  },
  addToBagBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  addToBagLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
