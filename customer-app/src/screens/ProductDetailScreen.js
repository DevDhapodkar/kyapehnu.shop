import { useState } from 'react';
import { Image } from 'expo-image';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassButton from '../components/GlassButton';
import { formatINR } from '../data/mockStores';
import { selectCartCount, useCartStore } from '../store/useCartStore';
import { colors, radii, spacing } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.62;

/**
 * ProductDetailScreen (PDP)
 *
 * Immersive by construction: the photograph runs full-bleed under the status
 * bar, and every piece of chrome is a frosted pane floating over it. The detail
 * sheet overlaps the hero's lower edge so the two layers read as glass on print.
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
            style={styles.heroImage}
            contentFit="cover"
            transition={280}
          />
          {/* Scrim keeps the floating chrome legible over a bright photograph. */}
          <View pointerEvents="none" style={styles.heroScrim} />
        </View>

        <View style={styles.sheet}>
          <View pointerEvents="none" style={styles.sheetFill} />
          <View pointerEvents="none" style={styles.sheetHighlight} />

          <Text style={styles.category}>{product.category.toUpperCase()}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(product.price)}</Text>
            {product.mrp ? (
              <>
                <Text style={styles.mrp}>{formatINR(product.mrp)}</Text>
                <Text style={styles.discount}>{discount}% off</Text>
              </>
            ) : null}
          </View>

          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.blockLabel}>
            {sizes.length > 1 ? 'SELECT SIZE' : 'SIZE'}
          </Text>
          <View style={styles.sizeRow}>
            {sizes.map((size) => {
              const active = size === selectedSize;
              return (
                <Pressable
                  key={size}
                  onPress={() => {
                    setSelectedSize(size);
                    setAdded(false);
                  }}
                  style={[styles.sizeChip, active && styles.sizeChipActive]}
                >
                  <Text style={[styles.sizeText, active && styles.sizeTextActive]}>
                    {size}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          <Text style={styles.blockLabel}>DETAILS</Text>
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

          <View style={styles.divider} />

          <Text style={styles.blockLabel}>SOLD BY</Text>
          <Text style={styles.storeName}>{product.storeName}</Text>
          <Text style={styles.storeMeta}>
            {[
              product.storeArea,
              typeof product.distanceKm === 'number' ? `${product.distanceKm} km away` : null,
              typeof product.etaMinutes === 'number' ? `~${product.etaMinutes} min` : null,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
        </View>
      </ScrollView>

      {/* Floating back / bag chrome. */}
      <View
        style={[styles.topBar, { top: insets.top + spacing.xs }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Text style={styles.circleGlyph}>←</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Cart')}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Text style={styles.circleGlyph}>◇</Text>
          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* Docked action bar. */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View pointerEvents="none" style={styles.actionFill} />
        <View pointerEvents="none" style={styles.actionHighlight} />

        <View style={styles.actionRow}>
          <View style={styles.actionSummary}>
            <Text style={styles.actionPrice}>{formatINR(product.price)}</Text>
            <Text style={styles.actionMeta}>
              {selectedSize ? `Size ${selectedSize}` : 'One size'}
            </Text>
          </View>

          {added ? (
            <GlassButton
              label="View Bag"
              onPress={() => navigation.navigate('Cart')}
              style={styles.actionButton}
            />
          ) : (
            <GlassButton
              label="Add to Cart"
              onPress={handleAdd}
              disabled={sizes.length > 0 && !selectedSize}
              style={styles.actionButton}
            />
          )}
        </View>
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
    backgroundColor: colors.obsidian,
  },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.charcoal,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  sheet: {
    position: 'relative',
    marginTop: -radii.lg * 1.6,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFillStrong,
  },
  sheetHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  category: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.ivory,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  price: {
    color: colors.ivory,
    fontSize: 22,
    fontWeight: '600',
  },
  mrp: {
    color: colors.slate,
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginLeft: spacing.sm,
  },
  discount: {
    color: colors.crimsonBright,
    fontSize: 12,
    letterSpacing: 0.8,
    marginLeft: spacing.sm,
  },
  description: {
    color: colors.platinum,
    fontSize: 15,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.md,
  },
  blockLabel: {
    color: colors.ash,
    fontSize: 10,
    letterSpacing: 2.5,
    marginBottom: spacing.sm,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeChip: {
    minWidth: 54,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  sizeChipActive: {
    borderColor: colors.ivory,
    backgroundColor: colors.graphite,
  },
  sizeText: {
    color: colors.platinum,
    fontSize: 13,
    letterSpacing: 0.6,
  },
  sizeTextActive: {
    color: colors.ivory,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    color: colors.slate,
    fontSize: 13,
    width: 96,
  },
  detailValue: {
    color: colors.platinum,
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },
  storeName: {
    color: colors.ivory,
    fontSize: 16,
    fontWeight: '400',
  },
  storeMeta: {
    color: colors.ash,
    fontSize: 12,
    marginTop: 4,
  },

  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  pressed: {
    opacity: 0.7,
  },
  circleGlyph: {
    color: colors.ivory,
    fontSize: 18,
    lineHeight: 22,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.crimsonBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.ivory,
    fontSize: 10,
    fontWeight: '700',
  },

  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
    overflow: 'hidden',
  },
  actionFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFillStrong,
  },
  actionHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionSummary: {
    flex: 1,
  },
  actionPrice: {
    color: colors.ivory,
    fontSize: 19,
    fontWeight: '600',
  },
  actionMeta: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
  },
  actionButton: {
    minWidth: 168,
  },
});
