import { useState } from 'react';
import { Image } from 'expo-image';
import { Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Chip,
  Divider,
  Gradient,
  Icon,
  IconButton,
  StatRow,
  StatTile,
  Surface,
} from '../components/ui';
import { formatINR } from '../data/mockStores';
import { selectCartCount, useCartStore } from '../store/useCartStore';
import { colors, radii, spacing } from '../theme/colors';
import { duration, easing, elevation, stagger, type } from '../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.62;

/** Attributes shown in the specification grid, in the order a buyer scans them. */
const SPEC_FIELDS = [
  { key: 'brand', label: 'Brand' },
  { key: 'colorway', label: 'Colour' },
  { key: 'material', label: 'Material' },
  { key: 'pattern', label: 'Pattern' },
  { key: 'fit', label: 'Fit' },
  { key: 'occasion', label: 'Occasion' },
  { key: 'careInstructions', label: 'Care' },
  { key: 'countryOfOrigin', label: 'Origin' },
  { key: 'sku', label: 'SKU' },
];

/**
 * ProductDetailScreen (PDP)
 *
 * Immersive by construction: the photograph runs full-bleed under the status
 * bar and the detail sheet is pulled up over its lower edge, so the two layers
 * read as glass laid on print rather than as two stacked panels.
 *
 * The hero parallaxes as the sheet travels — the image drifts up at roughly
 * half the sheet's speed and dims as it goes, which is what makes the sheet
 * feel like it is sliding over a photograph that is physically behind it
 * instead of scrolling in lockstep with it.
 */
export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const insets = useSafeAreaInsets();

  const sizes = product.sizes ?? [];
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? null);
  const [added, setAdded] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const cartCount = useCartStore(selectCartCount);

  const discount = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleAdd = () => {
    addToCart(product, selectedSize);
    setAdded(true);
  };

  // Parallax: the hero rises at half speed, scales up slightly on over-scroll
  // (so a bounce at the top reveals more image rather than a gap), and fades
  // toward obsidian as the sheet covers it.
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [0, 0, HERO_HEIGHT * 0.5]) },
      {
        scale: interpolate(
          scrollY.value,
          [-HERO_HEIGHT, 0],
          [1.6, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const heroFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.75],
      [0, 0.75],
      Extrapolation.CLAMP,
    ),
  }));

  // The floating chrome gains its own backdrop only once the photograph has
  // scrolled away from behind it.
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT * 0.5, HERO_HEIGHT * 0.8], [0, 1], Extrapolation.CLAMP),
  }));

  const eta = typeof product.etaMinutes === 'number' ? `${product.etaMinutes} min` : '~1 hr';
  const distance = typeof product.distanceKm === 'number' ? `${product.distanceKm} km` : '—';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* The hero lives outside the ScrollView so it can move independently of
          the content that scrolls over it. */}
      <Animated.View style={[styles.hero, heroStyle]} pointerEvents="none">
        <Image
          source={{ uri: product.image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={320}
        />
        <Gradient fill preset="imageScrimTop" locations={[0, 0.35]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.heroFade, heroFadeStyle]} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        // Clears the docked action bar, which is ~120pt tall plus its inset.
        contentContainerStyle={{ paddingBottom: insets.bottom + 196 }}
      >
        <View style={styles.heroSpacer} />

        <View style={styles.sheet}>
          <Gradient fill preset="chrome" />
          <View pointerEvents="none" style={styles.sheetHighlight} />

          {/* Grab handle — signals the sheet is the thing that moves. */}
          <View style={styles.handle} />

          <Animated.View entering={FadeInDown.duration(duration.slow).easing(easing.out)}>
            <Text style={styles.category}>{String(product.category ?? '').toUpperCase()}</Text>
            <Text style={styles.name}>{product.name}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatINR(product.price)}</Text>
              {product.mrp ? (
                <>
                  <Text style={styles.mrp}>{formatINR(product.mrp)}</Text>
                  <View style={styles.discountPill}>
                    <Text style={styles.discountText}>{discount}% OFF</Text>
                  </View>
                </>
              ) : null}
            </View>
          </Animated.View>

          {/* The three facts that decide the purchase, before any prose. */}
          <Surface tone="sunken" padding="compact" lift="flat" style={styles.factCard}>
            <StatRow>
              <StatTile icon="navigation" value={distance} label="away" emphasis="jade" />
              <StatTile icon="clock" value={eta} label="delivery" emphasis="gold" />
              <StatTile icon="credit-card" value="COD" label="on delivery" />
            </StatRow>
          </Surface>

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          {sizes.length > 0 ? (
            <>
              <Divider />
              <View style={styles.blockHeader}>
                <Text style={styles.blockLabel}>
                  {sizes.length > 1 ? 'SELECT SIZE' : 'SIZE'}
                </Text>
                {selectedSize ? (
                  <Text style={styles.blockValue}>{selectedSize}</Text>
                ) : (
                  <Text style={styles.blockPrompt}>Pick one to continue</Text>
                )}
              </View>

              <View style={styles.sizeRow}>
                {sizes.map((size, index) => (
                  <Animated.View
                    key={size}
                    entering={FadeIn.delay(stagger(index, 35)).duration(duration.base)}
                  >
                    <Chip
                      label={size}
                      selected={size === selectedSize}
                      uppercase={false}
                      onPress={() => {
                        setSelectedSize(size);
                        // Changing size makes the previous "added" line stale —
                        // the bag holds the old size, not this one.
                        setAdded(false);
                      }}
                      accessibilityLabel={`Size ${size}`}
                      style={styles.sizeChip}
                    />
                  </Animated.View>
                ))}
              </View>
            </>
          ) : null}

          <Divider label="Details" />
          <View style={styles.specGrid}>
            {SPEC_FIELDS.map((field) => (
              <Spec key={field.key} label={field.label} value={product[field.key]} />
            ))}
            <Spec
              label="Net Quantity"
              value={product.netQuantity ? `${product.netQuantity} N` : null}
            />
          </View>

          <Divider label="Sold by" />
          <View style={styles.storeRow}>
            <View style={styles.storeIcon}>
              <Icon name="shopping-bag" size="md" color={colors.gold} />
            </View>
            <View style={styles.storeBody}>
              <Text style={styles.storeName}>{product.storeName}</Text>
              <Text style={styles.storeMeta}>
                {[
                  product.storeArea,
                  typeof product.distanceKm === 'number'
                    ? `${product.distanceKm} km away`
                    : null,
                  typeof product.etaMinutes === 'number' ? `~${product.etaMinutes} min` : null,
                ]
                  .filter(Boolean)
                  .join('  ·  ') || 'Independent Nagpur shop'}
              </Text>
            </View>
          </View>

          <View style={styles.assurance}>
            <Icon name="shield" size="sm" color={colors.jade} />
            <Text style={styles.assuranceText}>
              The rider waits while you try it on. Pay only what fits.
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Floating back / bag chrome. */}
      <View style={[styles.topBar, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
        <Animated.View
          style={[styles.topBarChrome, { height: insets.top + 60 }, chromeStyle]}
          pointerEvents="none"
        >
          <Gradient fill preset="chrome" />
        </Animated.View>

        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <IconButton
          icon="shopping-bag"
          onPress={() => navigation.navigate('Cart')}
          accessibilityLabel={`Your bag, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
          badge={cartCount || undefined}
          tone={cartCount > 0 ? 'accent' : 'glass'}
        />
      </View>

      {/* Docked action bar. */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Gradient fill preset="chrome" />
        <View pointerEvents="none" style={styles.sheetHighlight} />

        <View style={styles.actionRow}>
          <View style={styles.actionSummary}>
            <Text style={styles.actionPrice}>{formatINR(product.price)}</Text>
            <Text style={styles.actionMeta}>
              {selectedSize ? `Size ${selectedSize}` : sizes.length ? 'Select a size' : 'One size'}
            </Text>
          </View>

          {added ? (
            <Button
              label="View Bag"
              icon="check"
              variant="secondary"
              onPress={() => navigation.navigate('Cart')}
              style={styles.actionButton}
            />
          ) : (
            <Button
              label="Add to Bag"
              icon="plus"
              onPress={handleAdd}
              disabled={sizes.length > 0 && !selectedSize}
              accessibilityHint="Adds this piece to your bag"
              style={styles.actionButton}
            />
          )}
        </View>
      </View>
    </View>
  );
}

/** One label/value pair in the specification grid. Empty values are dropped. */
function Spec({ label, value }) {
  if (!value) return null;

  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    backgroundColor: colors.charcoal,
  },
  heroFade: {
    backgroundColor: colors.obsidian,
  },
  heroSpacer: {
    height: HERO_HEIGHT,
  },

  sheet: {
    position: 'relative',
    // Pulled up over the photograph's lower edge.
    marginTop: -radii.xl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  sheetHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.graphiteLight,
    marginBottom: spacing.m,
  },

  category: {
    ...type.eyebrow,
    marginBottom: spacing.xs,
  },
  name: {
    ...type.title,
    fontSize: 27,
    lineHeight: 33,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.sm,
  },
  price: {
    ...type.numeric,
    fontSize: 24,
  },
  mrp: {
    ...type.bodySmall,
    color: colors.slate,
    textDecorationLine: 'line-through',
  },
  discountPill: {
    paddingHorizontal: spacing.s,
    paddingVertical: 3,
    borderRadius: radii.xs,
    backgroundColor: colors.crimsonWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196, 36, 58, 0.45)',
  },
  discountText: {
    ...type.caption,
    color: colors.crimsonGlow,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  factCard: {
    marginTop: spacing.m,
  },
  description: {
    ...type.body,
    marginTop: spacing.m,
  },

  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  blockLabel: {
    ...type.eyebrow,
    color: colors.ash,
    letterSpacing: 2.4,
  },
  blockValue: {
    ...type.label,
    fontSize: 12,
    color: colors.ivory,
  },
  blockPrompt: {
    ...type.caption,
    color: colors.gold,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  sizeChip: {
    minWidth: 58,
    justifyContent: 'center',
  },

  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  spec: {
    // Two per row, with the gap accounted for.
    width: '47%',
    paddingVertical: spacing.xs,
  },
  specLabel: {
    ...type.caption,
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  specValue: {
    ...type.bodySmall,
    color: colors.platinum,
    marginTop: 3,
  },

  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldWashSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200, 162, 74, 0.3)',
  },
  storeBody: {
    flex: 1,
  },
  storeName: {
    ...type.subheading,
  },
  storeMeta: {
    ...type.caption,
    color: colors.ash,
    marginTop: 3,
  },
  assurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.jadeWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(78, 140, 106, 0.28)',
  },
  assuranceText: {
    ...type.caption,
    color: colors.platinum,
    flex: 1,
    lineHeight: 17,
  },

  topBar: {
    position: 'absolute',
    left: spacing.m,
    right: spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topBarChrome: {
    position: 'absolute',
    left: -spacing.m,
    right: -spacing.m,
    bottom: -spacing.sm,
    top: -spacing.xl,
  },

  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
    overflow: 'hidden',
    ...elevation.high,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionSummary: {
    flex: 1,
  },
  actionPrice: {
    ...type.numeric,
    fontSize: 20,
  },
  actionMeta: {
    ...type.caption,
    color: colors.ash,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  actionButton: {
    minWidth: 172,
  },
});
