import { useState } from 'react';
import { Image } from 'expo-image';
import { Dimensions, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Chip, Gradient, IconButton, PillButton, Surface } from '../components/ui';
import { formatINR } from '../data/mockStores';
import { selectCartCount, useCartStore } from '../store/useCartStore';
import { colors, gradients, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.58;

/**
 * ProductDetailScreen (PDP)
 *
 * The photograph is the page. It runs full-bleed under the status bar and turns
 * a corner at its lower edge, so the garment reads as a card the sheet is
 * sliding out from under rather than a banner with text below it.
 *
 * Every piece of chrome floats: circular buttons over the image, a frosted
 * sheet overlapping its bottom corners, and a docked action bar that never
 * scrolls away — the price and the commit are always one thumb-reach apart.
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

  const handleAdd = () => {
    addToCart(product, selectedSize);
    setAdded(true);
  };

  const eta = typeof product.etaMinutes === 'number' ? `${product.etaMinutes} min` : null;
  const distance = typeof product.distanceKm === 'number' ? `${product.distanceKm} km away` : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
        bounces={false}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: product.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={280}
          />
          {/* Holds the floating chrome legible over a bright photograph. */}
          <Gradient
            pointerEvents="none"
            colors={gradients.topScrim}
            direction="vertical"
            steps={16}
            style={styles.heroScrim}
          />
        </View>

        <Surface tone="thick" radius={radii.xl} elevation="high" style={styles.sheet} sheen>
          <View style={styles.chipRow}>
            {product.category ? <Chip label={product.category} size="sm" tone="regular" /> : null}
            {eta ? <Chip label={`Ready in ${eta}`} size="sm" tone="light" /> : null}
          </View>

          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(product.price)}</Text>
            {product.mrp ? (
              <>
                <Text style={styles.mrp}>{formatINR(product.mrp)}</Text>
                <Chip label={`${discount}% off`} size="sm" tint={colors.mint} />
              </>
            ) : null}
          </View>

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          {sizes.length ? (
            <>
              <Text style={styles.blockLabel}>{sizes.length > 1 ? 'SELECT SIZE' : 'SIZE'}</Text>
              <View style={styles.sizeRow}>
                {sizes.map((size) => {
                  const active = size === selectedSize;

                  return (
                    <Pressable
                      key={size}
                      onPress={() => {
                        setSelectedSize(size);
                        // The bar flips back to "Add to Cart" so a size change
                        // never silently applies to the line already in the bag.
                        setAdded(false);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Size ${size}`}
                      style={({ pressed }) => [
                        styles.sizeChip,
                        active && styles.sizeChipActive,
                        pressed && !active && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.sizeText, active && styles.sizeTextActive]}>{size}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Surface tone="thin" radius={radii.lg} elevation="none" style={styles.storeCard}>
            <Avatar name={product.storeName} size={44} />
            <View style={styles.storeText}>
              <Text style={styles.storeLabel}>SOLD BY</Text>
              <Text style={styles.storeName} numberOfLines={1}>
                {product.storeName}
              </Text>
              <Text style={styles.storeMeta} numberOfLines={1}>
                {[product.storeArea, distance].filter(Boolean).join('  ·  ') || 'Nagpur'}
              </Text>
            </View>
          </Surface>

          <Text style={styles.blockLabel}>DETAILS</Text>
          <Surface tone="thin" radius={radii.lg} elevation="none" style={styles.detailCard}>
            <Detail label="Brand" value={product.brand} />
            <Detail label="Colour" value={product.colorway} />
            <Detail label="Material" value={product.material} />
            <Detail label="Pattern" value={product.pattern} />
            <Detail label="Fit" value={product.fit} />
            <Detail label="Occasion" value={product.occasion} />
            <Detail label="Care" value={product.careInstructions} />
            <Detail
              label="Net Quantity"
              value={product.netQuantity ? `${product.netQuantity} N` : null}
            />
            <Detail label="Country of Origin" value={product.countryOfOrigin} />
            <Detail label="SKU" value={product.sku} />
          </Surface>
        </Surface>
      </ScrollView>

      {/* Floating chrome over the hero. */}
      <View style={[styles.topBar, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
        <IconButton
          glyph="←"
          tone="glass"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        />
        <IconButton
          glyph="◇"
          tone="glass"
          badge={cartCount > 0 ? cartCount : undefined}
          onPress={() => navigation.navigate('Cart')}
          accessibilityLabel={cartCount > 0 ? `Bag, ${cartCount} items` : 'Bag, empty'}
        />
      </View>

      {/* Docked action bar. */}
      <View
        style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.sm }]}
        pointerEvents="box-none"
      >
        <Surface tone="thick" radius={radii.xl} elevation="high" style={styles.actionCard}>
          <View style={styles.actionSummary}>
            <Text style={styles.actionLabel}>TOTAL PRICE</Text>
            <Text style={styles.actionPrice}>{formatINR(product.price)}</Text>
            <Text style={styles.actionMeta}>
              {selectedSize ? `Size ${selectedSize}` : 'One size'}
            </Text>
          </View>

          {added ? (
            <PillButton
              label="View Bag"
              icon="→"
              size="lg"
              onPress={() => navigation.navigate('Cart')}
            />
          ) : (
            <PillButton
              label="Add to Cart"
              icon="+"
              size="lg"
              onPress={handleAdd}
              disabled={sizes.length > 0 && !selectedSize}
            />
          )}
        </Surface>
      </View>
    </View>
  );
}

function Detail({ label, value }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.surface,
    // The sheet rides up over this edge, so the photograph has to stop at the
    // hero's box rather than painting under the sheet's translucent fill.
    overflow: 'hidden',
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '34%',
  },
  sheet: {
    // Rides up over the photograph's lower edge, so the two layers read as
    // glass laid on print rather than two stacked blocks.
    marginTop: -radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.h1,
    color: colors.ivory,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  price: {
    ...typography.numericLg,
    fontSize: 26,
    color: colors.ivory,
  },
  mrp: {
    ...typography.body,
    color: colors.slate,
    textDecorationLine: 'line-through',
  },
  description: {
    ...typography.bodyLg,
    color: colors.platinum,
    marginTop: spacing.sm + 2,
  },
  blockLabel: {
    ...typography.eyebrow,
    color: colors.ash,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  sizeChip: {
    minWidth: 56,
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeChipActive: {
    backgroundColor: colors.light,
    borderColor: colors.light,
  },
  pressed: {
    opacity: 0.7,
  },
  sizeText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.platinum,
  },
  sizeTextActive: {
    color: colors.onLight,
    fontWeight: '700',
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    marginTop: spacing.lg,
  },
  storeText: {
    flex: 1,
    minWidth: 0,
  },
  storeLabel: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 1.8,
    color: colors.ash,
  },
  storeName: {
    ...typography.h3,
    color: colors.ivory,
    marginTop: 3,
  },
  storeMeta: {
    ...typography.caption,
    color: colors.ash,
    marginTop: 2,
  },
  detailCard: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.slate,
    width: 108,
  },
  detailValue: {
    ...typography.caption,
    color: colors.platinum,
    flex: 1,
    lineHeight: 19,
  },

  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md - 2,
  },
  actionSummary: {
    flex: 1,
    minWidth: 0,
  },
  actionLabel: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 1.8,
    color: colors.ash,
  },
  actionPrice: {
    ...typography.numeric,
    fontSize: 22,
    color: colors.ivory,
    marginTop: 2,
  },
  actionMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.ash,
    marginTop: 1,
  },
});
