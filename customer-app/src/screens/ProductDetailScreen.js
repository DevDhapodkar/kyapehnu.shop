import { useState } from 'react';
import { Image } from 'expo-image';
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
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

import BrandLogo from '../components/BrandLogo';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import PressableScale from '../components/PressableScale';
import { normalizeColor } from '../constants/colorPalette';
import { formatCurrency as formatINR } from '../utils/format';
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
 * - Interactive Colorway palette selector with visual swatches
 * - Frosted glass size selector & size guide modal
 * - Couture & craft specifications grid (Fabric, Pattern, Fit, Occasion, Care, Set)
 * - Atelier concierge card with Call & Video Consultation
 * - Sticky bottom frosted glass action bar with live Add to Bag
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params || {};
  const insets = useSafeAreaInsets();

  const [activeAngle, setActiveAngle] = useState('front');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    product?.sizes?.[0] || 'S'
  );
  const [addedToast, setAddedToast] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);

  if (!product) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <AmbientBackgroundBlobs />
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]} pointerEvents="box-none">
          <View style={styles.topBarInner} pointerEvents="auto">
            <PressableScale
              onPress={() => navigation.goBack()}
              style={styles.navBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <MaterialIcons name="arrow-back-ios-new" size={17} color={colors.textObsidian} />
            </PressableScale>
            <BrandLogo size="sm" showEmblem={true} />
            <View style={{ width: 34 }} />
          </View>
        </View>
        <View style={styles.notFoundCenter}>
          <View style={styles.notFoundIconWrap}>
            <MaterialIcons name="checkroom" size={40} color={colors.accentGoldDeep} />
          </View>
          <Text style={styles.notFoundTitle}>Garment Unavailable</Text>
          <Text style={styles.notFoundSubtitle}>
            This curated piece is not currently in the atelier catalogue or the link is invalid.
          </Text>
          <PressableScale
            onPress={() => navigation.navigate('Home')}
            style={styles.notFoundBtn}
            accessibilityRole="button"
            accessibilityLabel="Return to Storefront"
          >
            <Text style={styles.notFoundBtnText}>Return to Storefront</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
          </PressableScale>
        </View>
      </View>
    );
  }

  const item = product;
  const sizes = item.sizes?.length ? item.sizes : DEFAULT_SIZES;

  const rawColors =
    Array.isArray(item.colors) && item.colors.length > 0
      ? item.colors
      : item.colorway
      ? item.colorway.split(',').map((s) => s.trim())
      : [
          { name: 'Obsidian Black', hex: '#121215' },
          { name: 'Heritage Gold', hex: '#D97706' },
        ];

  const normalizedColors = rawColors.map(normalizeColor);

  const [selectedColor, setSelectedColor] = useState(
    normalizedColors[0] || { name: 'Standard', hex: '#121215' }
  );

  const discountPercent =
    item.mrp && item.price && item.mrp > item.price
      ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
      : null;

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
    setShowSizeGuide(true);
  };

  const handleAddToCart = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    addToCart(item, selectedSize, selectedColor);
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

          <BrandLogo size="sm" showEmblem={true} />

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

          {/* Card 2: Colorway Palette */}
          {normalizedColors.length > 0 ? (
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Colorway</Text>
                <View style={styles.selectedColorBadge}>
                  <View
                    style={[
                      styles.selectedColorDot,
                      { backgroundColor: selectedColor.hex },
                    ]}
                  />
                  <Text style={styles.selectedColorName}>
                    {selectedColor.name}
                  </Text>
                </View>
              </View>

              <View style={styles.colorsRow}>
                {normalizedColors.map((col) => {
                  const isSelected =
                    selectedColor.name.toLowerCase() === col.name.toLowerCase();
                  return (
                    <PressableScale
                      key={col.name}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                        setSelectedColor(col);
                      }}
                      style={[
                        styles.colorSwatchWrap,
                        isSelected && styles.colorSwatchWrapSelected,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select color ${col.name}`}
                    >
                      <View
                        style={[
                          styles.colorSwatchCircle,
                          {
                            backgroundColor: col.hex,
                            borderColor:
                              col.hex.toLowerCase() === '#ffffff' ||
                              col.hex.toLowerCase() === '#f9f6f0'
                                ? 'rgba(0,0,0,0.2)'
                                : col.hex,
                          },
                        ]}
                      >
                        {isSelected ? (
                          <MaterialIcons
                            name="check"
                            size={12}
                            color={
                              col.hex.toLowerCase() === '#ffffff' ||
                              col.hex.toLowerCase() === '#f9f6f0'
                                ? '#121215'
                                : '#FFFFFF'
                            }
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.colorSwatchName,
                          isSelected && styles.colorSwatchNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {col.name}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Card 3: Size Selector */}
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

          {/* Card 4: Couture & Craft Specifications Grid */}
          <View style={styles.glassCard}>
            <Text style={styles.cardHeaderTitle}>Couture & Craft Details</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <MaterialIcons
                  name="texture"
                  size={16}
                  color={colors.accentGold}
                />
                <View style={styles.specTextCol}>
                  <Text style={styles.specLabel}>Fabric</Text>
                  <Text style={styles.specValue}>{item.material || 'Pure Silk / Cotton'}</Text>
                </View>
              </View>

              <View style={styles.specItem}>
                <MaterialIcons
                  name="styler"
                  size={16}
                  color={colors.accentGold}
                />
                <View style={styles.specTextCol}>
                  <Text style={styles.specLabel}>Cut / Silhouette</Text>
                  <Text style={styles.specValue}>{item.subCategory || item.category || 'Atelier Collection'}</Text>
                </View>
              </View>

              {item.pattern ? (
                <View style={styles.specItem}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={16}
                    color={colors.accentGold}
                  />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Pattern / Craft</Text>
                    <Text style={styles.specValue}>{item.pattern}</Text>
                  </View>
                </View>
              ) : null}

              {item.fit ? (
                <View style={styles.specItem}>
                  <MaterialIcons
                    name="accessibility-new"
                    size={16}
                    color={colors.accentGold}
                  />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Fit</Text>
                    <Text style={styles.specValue}>{item.fit}</Text>
                  </View>
                </View>
              ) : null}

              {item.occasion ? (
                <View style={styles.specItem}>
                  <MaterialIcons
                    name="celebration"
                    size={16}
                    color={colors.accentGold}
                  />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Occasion</Text>
                    <Text style={styles.specValue}>{item.occasion}</Text>
                  </View>
                </View>
              ) : null}

              {item.sleeve || item.neck ? (
                <View style={styles.specItem}>
                  <MaterialIcons
                    name="dry-cleaning"
                    size={16}
                    color={colors.accentGold}
                  />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Style Details</Text>
                    <Text style={styles.specValue}>
                      {[item.sleeve, item.neck].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.specItem}>
                <MaterialIcons
                  name="local-laundry-service"
                  size={16}
                  color={colors.accentGold}
                />
                <View style={styles.specTextCol}>
                  <Text style={styles.specLabel}>Care</Text>
                  <Text style={styles.specValue}>{item.careInstructions || item.care || 'Dry Clean Only'}</Text>
                </View>
              </View>

              <View style={styles.specItem}>
                <MaterialIcons
                  name="verified"
                  size={16}
                  color={colors.accentGold}
                />
                <View style={styles.specTextCol}>
                  <Text style={styles.specLabel}>Declaration</Text>
                  <Text style={styles.specValue}>
                    {item.netQuantity || 1} Unit · {item.countryOfOrigin || 'India'}
                  </Text>
                </View>
              </View>

              {item.sku ? (
                <View style={styles.specItem}>
                  <MaterialIcons
                    name="qr-code"
                    size={16}
                    color={colors.accentGold}
                  />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Atelier SKU</Text>
                    <Text style={styles.specValue}>{item.sku}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {/* Card 5: Atelier Quick Badge (Call button removed per Stitch spec) */}
          <View style={styles.glassCard}>
            <View style={styles.atelierRow}>
              <View style={styles.atelierThumbWrap}>
                <Image
                  source={{
                    uri:
                      item.storeImage ||
                      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&q=80',
                  }}
                  style={styles.atelierThumb}
                  contentFit="cover"
                />
              </View>
              <View style={styles.atelierInfo}>
                <Text style={styles.atelierName}>{item.storeName || 'Nagpur Atelier'}</Text>
                <Text style={styles.atelierDetails}>
                  {[
                    item.storeArea || 'Nagpur',
                    item.distanceKm ? `${item.distanceKm} km` : null,
                    item.rating ? `★ ${item.rating}` : null,
                  ].filter(Boolean).join(' · ')}
                </Text>
              </View>

              <View style={styles.atelierActions}>
                <PressableScale
                  onPress={() => {
                    const text = encodeURIComponent(
                      `Hi Kya Pehnu Concierge, I need styling consultation for ${item.name} (${item.storeName || 'Atelier'}).`
                    );
                    Linking.openURL(`https://wa.me/917122549900?text=${text}`).catch(() => {
                      Alert.alert('Stylist Consultation', 'Stylist WhatsApp hotline available at +91 712 254 9900.');
                    });
                  }}
                  style={styles.atelierActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="WhatsApp video styling"
                >
                  <MaterialIcons
                    name="video-camera-front"
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
            <Text style={styles.toastText}>
              Added to Bag ({selectedColor.name} · {selectedSize})
            </Text>
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
            <Text style={styles.totalLabel}>
              {selectedColor.name.toUpperCase()} · SIZE {selectedSize}
            </Text>
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

      {/* 5. Frosted Glass Size Guide Modal */}
      <Modal
        visible={showSizeGuide}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSizeGuide(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sizeModalContent}>
            <View style={styles.sizeModalHeader}>
              <View style={styles.sizeModalHeaderLeft}>
                <View style={styles.sizeModalIconWrap}>
                  <MaterialIcons
                    name="straighten"
                    size={18}
                    color={colors.accentGoldDeep}
                  />
                </View>
                <View>
                  <Text style={styles.sizeModalTitle}>Atelier Size Guide</Text>
                  <Text style={styles.sizeModalSub}>
                    Nagpur Tailor Standard (Inches)
                  </Text>
                </View>
              </View>
              <PressableScale
                onPress={() => setShowSizeGuide(false)}
                style={styles.sizeModalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close Size Guide"
              >
                <MaterialIcons
                  name="close"
                  size={18}
                  color={colors.textObsidian}
                />
              </PressableScale>
            </View>

            {/* Table */}
            <View style={styles.sizeTable}>
              <View style={styles.sizeTableRowHeader}>
                <Text style={[styles.sizeTableCol, styles.sizeTableColHeader]}>
                  Size
                </Text>
                <Text style={[styles.sizeTableCol, styles.sizeTableColHeader]}>
                  Bust
                </Text>
                <Text style={[styles.sizeTableCol, styles.sizeTableColHeader]}>
                  Waist
                </Text>
                <Text style={[styles.sizeTableCol, styles.sizeTableColHeader]}>
                  Hip
                </Text>
              </View>
              {[
                { size: 'XS', bust: '32"', waist: '26"', hip: '36"' },
                { size: 'S', bust: '34"', waist: '28"', hip: '38"' },
                { size: 'M', bust: '36"', waist: '30"', hip: '40"' },
                { size: 'L', bust: '38"', waist: '32"', hip: '42"' },
                { size: 'XL', bust: '40"', waist: '34"', hip: '44"' },
              ].map((row, i) => (
                <View
                  key={row.size}
                  style={[
                    styles.sizeTableRow,
                    selectedSize === row.size && styles.sizeTableRowActive,
                    i % 2 === 1 && styles.sizeTableRowAlt,
                  ]}
                >
                  <Text style={[styles.sizeTableCol, styles.sizeTableColBold]}>
                    {row.size}
                  </Text>
                  <Text style={styles.sizeTableCol}>{row.bust}</Text>
                  <Text style={styles.sizeTableCol}>{row.waist}</Text>
                  <Text style={styles.sizeTableCol}>{row.hip}</Text>
                </View>
              ))}
            </View>

            {/* Concierge Guarantee Pill */}
            <View style={styles.sizeGuaranteeCard}>
              <MaterialIcons
                name="verified"
                size={16}
                color={colors.accentGoldDeep}
              />
              <Text style={styles.sizeGuaranteeText}>
                60-min doorstep trial: Our rider waits up to 15 minutes while you try the fit.
              </Text>
            </View>

            <PressableScale
              onPress={() => setShowSizeGuide(false)}
              style={styles.sizeConfirmBtn}
              accessibilityRole="button"
              accessibilityLabel="Got It"
            >
              <Text style={styles.sizeConfirmBtnText}>Got It</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>
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
  selectedColorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  selectedColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  selectedColorName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  colorSwatchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  colorSwatchWrapSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.accentCrimson,
    borderWidth: 1.5,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  colorSwatchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSlate,
  },
  colorSwatchNameSelected: {
    color: colors.textObsidian,
    fontWeight: '700',
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
  specTextCol: {
    flex: 1,
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
  atelierThumbWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  atelierThumb: {
    width: '100%',
    height: '100%',
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
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  notFoundIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  notFoundTitle: {
    color: colors.textObsidian,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  notFoundSubtitle: {
    color: colors.textAsh,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  notFoundBtn: {
    backgroundColor: colors.accentCrimson,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  notFoundBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 21, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  sizeModalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FDFCFA',
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 10,
  },
  sizeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sizeModalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  sizeModalTitle: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '700',
  },
  sizeModalSub: {
    color: colors.textAsh,
    fontSize: 11,
  },
  sizeModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeTable: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  sizeTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  sizeTableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  sizeTableRowActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  sizeTableRowAlt: {
    backgroundColor: 'rgba(0, 0, 0, 0.015)',
  },
  sizeTableCol: {
    flex: 1,
    fontSize: 12,
    color: colors.textObsidian,
    textAlign: 'center',
  },
  sizeTableColHeader: {
    fontWeight: '700',
    color: colors.textAsh,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  sizeTableColBold: {
    fontWeight: '700',
    color: colors.accentGoldDeep,
  },
  sizeGuaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.06)',
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
  },
  sizeGuaranteeText: {
    flex: 1,
    fontSize: 11,
    color: colors.textCharcoal,
    lineHeight: 16,
  },
  sizeConfirmBtn: {
    backgroundColor: colors.textObsidian,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
