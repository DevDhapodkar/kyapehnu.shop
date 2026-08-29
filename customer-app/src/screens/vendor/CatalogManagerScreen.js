import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';

import ListingComposer, { MAX_IMAGES } from '../../components/vendor/ListingComposer';
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  StatRow,
  StatTile,
  Surface,
} from '../../components/ui';
import { colors, radii, spacing } from '../../theme/colors';
import { duration, easing, stagger, type } from '../../theme/tokens';
import { useVendorStore } from '../../store/useVendorStore';
import { uploadProductImages } from '../../api/vendorApi';
import { formatCurrency } from '../../utils/format';
import { selection, success } from '../../utils/haptics';

const EMPTY_DRAFT = {
  name: '',
  brand: '',
  category: 'WOMEN',
  subCategory: '',
  price: '', // selling price
  mrp: '', // printed MRP (strike-through)
  sizes: '', // "S:3, M:5, L:2"  (size:stock)
  colors: '', // "Black, Ivory"
  material: '',
  pattern: '',
  fit: '',
  occasion: '',
  careInstructions: '',
  countryOfOrigin: 'India',
  netQuantity: '1',
  description: '',
  images: [], // [{ url, thumbnails }] returned from the upload endpoint
};

/** Parse "S:3, M:5, L" into [{ size:'S', stock:3 }, ...] (default stock 1). */
const parseSizes = (raw) =>
  raw
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [size, stock] = chunk.split(':').map((s) => s.trim());
      const n = Number(stock);
      return { size, stock: Number.isFinite(n) && n >= 0 ? n : 1 };
    });

/** Split a comma list into trimmed, non-empty values. */
const parseList = (raw) =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * How a listing's moderation status reads to the vendor, and the Chip tone that
 * carries it. Approval is the thing a shopkeeper is waiting on, so it gets a
 * real tint rather than another grey label.
 */
const REVIEW_STATUS = {
  PENDING_QC: { label: 'In review', tone: 'gold', icon: 'clock' },
  APPROVED: { label: 'Live', tone: 'jade', icon: 'check-circle' },
  REJECTED: { label: 'Rejected', tone: 'crimson', icon: 'x-circle' },
  ARCHIVED: { label: 'Archived', tone: 'neutral', icon: 'archive' },
  DRAFT: { label: 'Draft', tone: 'neutral', icon: 'edit-3' },
};

/**
 * Catalog manager: flip a listing in or out of stock, and add a new one.
 *
 * Availability is the primary job — it's the control a shop reaches for a
 * dozen times a day — so it lives on every row as a switch with no
 * confirmation step, and a row that is out of stock desaturates its own
 * photograph so the state is readable from arm's length. The add form stays
 * collapsed behind a toggle so it never competes with the list for the first
 * screenful.
 */
export default function CatalogManagerScreen() {
  const products = useVendorStore((state) => state.products);
  const loading = useVendorStore((state) => state.catalogLoading);
  const error = useVendorStore((state) => state.catalogError);
  const pendingProductId = useVendorStore((state) => state.pendingProductId);
  const loadCatalog = useVendorStore((state) => state.loadCatalog);
  const toggleAvailability = useVendorStore((state) => state.toggleAvailability);
  const addProduct = useVendorStore((state) => state.addProduct);

  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const onPickImages = useCallback(async () => {
    const remaining = MAX_IMAGES - draft.images.length;
    if (remaining <= 0) return Alert.alert('Enough photos', `Up to ${MAX_IMAGES} images per listing.`);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert('Permission needed', 'Allow photo access to add product images.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const { images } = await uploadProductImages(result.assets);
      setDraft((d) => ({ ...d, images: [...d.images, ...images] }));
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  }, [draft.images.length]);

  const removeImage = useCallback((publicId) => {
    setDraft((d) => ({ ...d, images: d.images.filter((img) => img.publicId !== publicId) }));
  }, []);

  const onToggle = useCallback(
    async (product, next) => {
      selection();
      try {
        await toggleAvailability(product._id, next);
      } catch (err) {
        Alert.alert('Could not update', err.message);
      }
    },
    [toggleAvailability]
  );

  const onSubmit = useCallback(async () => {
    const price = Number(draft.price);
    const mrp = draft.mrp ? Number(draft.mrp) : undefined;
    const netQuantity = Number(draft.netQuantity) || 1;

    if (!draft.name.trim()) return Alert.alert('Name required', 'Give the listing a name.');
    if (!Number.isFinite(price) || price <= 0) {
      return Alert.alert('Price required', 'Enter the selling price in whole rupees.');
    }
    if (mrp !== undefined && (!Number.isFinite(mrp) || mrp < price)) {
      return Alert.alert('Check MRP', 'MRP should be a number at least equal to the selling price.');
    }

    const sizes = parseSizes(draft.sizes);

    setSaving(true);
    try {
      await addProduct({
        name: draft.name.trim(),
        brand: draft.brand.trim() || undefined,
        category: draft.category,
        subCategory: draft.subCategory.trim() || undefined,
        price,
        mrp,
        sizes: sizes.length ? sizes : [{ size: 'FREE', stock: 1 }],
        colors: parseList(draft.colors),
        material: draft.material.trim() || undefined,
        pattern: draft.pattern.trim() || undefined,
        fit: draft.fit.trim() || undefined,
        occasion: draft.occasion.trim() || undefined,
        careInstructions: draft.careInstructions.trim() || undefined,
        countryOfOrigin: draft.countryOfOrigin.trim() || 'India',
        netQuantity,
        description: draft.description.trim() || undefined,
        images: draft.images.map((img) => img.url),
        isAvailable: true,
      });

      success();
      setDraft(EMPTY_DRAFT);
      setComposerOpen(false);
    } catch (err) {
      Alert.alert('Could not add listing', err.message);
    } finally {
      setSaving(false);
    }
  }, [addProduct, draft]);

  // The three numbers a shopkeeper checks before adding anything else.
  const stats = useMemo(() => {
    const live = products.filter((p) => p.status === 'APPROVED' && p.isAvailable).length;
    const inReview = products.filter((p) => p.status === 'PENDING_QC').length;
    const off = products.filter((p) => !p.isAvailable).length;
    return { live, inReview, off };
  }, [products]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <CatalogRow
        product={item}
        index={index}
        busy={pendingProductId === item._id}
        onToggle={(next) => onToggle(item, next)}
      />
    ),
    [onToggle, pendingProductId]
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCatalog}
            tintColor={colors.platinum}
            colors={[colors.crimsonBright]}
            progressBackgroundColor={colors.charcoal}
          />
        }
        ListHeaderComponent={
          <View>
            {error ? (
              <Surface tone="accent" padding="compact" lift="low" style={styles.banner}>
                <View style={styles.bannerRow}>
                  <Icon name="alert-triangle" size="sm" color={colors.crimsonGlow} />
                  <View style={styles.bannerBody}>
                    <Text style={styles.bannerTitle}>Catalog out of sync</Text>
                    <Text style={styles.bannerText}>{error}</Text>
                  </View>
                </View>
              </Surface>
            ) : null}

            {products.length > 0 ? (
              <Surface tone="sunken" padding="compact" lift="flat" style={styles.statCard}>
                <StatRow>
                  <StatTile icon="check-circle" value={String(stats.live)} label="live" emphasis="jade" />
                  <StatTile icon="clock" value={String(stats.inReview)} label="in review" emphasis="gold" />
                  <StatTile
                    icon="eye-off"
                    value={String(stats.off)}
                    label="out of stock"
                    emphasis="muted"
                  />
                </StatRow>
              </Surface>
            ) : null}

            <Button
              label={composerOpen ? 'Close' : 'New listing'}
              icon={composerOpen ? 'chevron-up' : 'plus'}
              variant={composerOpen ? 'ghost' : 'primary'}
              onPress={() => setComposerOpen((open) => !open)}
              fullWidth
              style={styles.composerToggle}
            />

            {composerOpen ? (
              <ListingComposer
                draft={draft}
                setDraft={setDraft}
                onPickImages={onPickImages}
                onRemoveImage={removeImage}
                onSubmit={onSubmit}
                saving={saving}
                uploading={uploading}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="grid"
              title="No listings yet"
              body="Add your first product and it appears in the customer feed as soon as it clears the quality check."
              actionLabel={composerOpen ? undefined : 'Add a listing'}
              onAction={composerOpen ? undefined : () => setComposerOpen(true)}
            />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

/**
 * One catalogue row.
 *
 * The photograph is the identifier — a shopkeeper recognises the garment long
 * before they read its name — so an unavailable row dims its own image rather
 * than only flipping a word from "in stock" to "out of stock".
 */
function CatalogRow({ product, index, busy, onToggle }) {
  const inStock = product.isAvailable;
  const review = REVIEW_STATUS[product.status];
  const cover = product.images?.[0];
  const stock = (product.sizes ?? []).reduce((sum, s) => sum + (s.stock ?? 0), 0);

  return (
    <Animated.View
      entering={FadeInDown.delay(stagger(index)).duration(duration.slow).easing(easing.out)}
      style={styles.rowWrap}
    >
      <Surface padding="compact" lift="low">
        <View style={styles.row}>
          <View style={[styles.coverWrap, !inStock && styles.coverOff]}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={styles.coverEmpty}>
                <Icon name="image" size="md" color={colors.slate} />
              </View>
            )}
          </View>

          <View style={styles.rowText}>
            <Text style={[styles.productName, !inStock && styles.productNameOff]} numberOfLines={1}>
              {product.name}
            </Text>

            <Text style={styles.productMeta} numberOfLines={1}>
              {product.category} · {formatCurrency(product.price)}
              {product.sizes?.length ? ` · ${product.sizes.map((s) => s.size).join(' / ')}` : ''}
            </Text>

            <View style={styles.badgeRow}>
              {review ? (
                <Chip label={review.label} icon={review.icon} tone={review.tone} size="sm" />
              ) : null}
              {stock > 0 ? (
                <Text style={styles.stockText}>{stock} in stock</Text>
              ) : null}
            </View>

            {product.status === 'REJECTED' && product.qc?.reason ? (
              <Text style={styles.rejectReason}>{product.qc.reason}</Text>
            ) : null}
          </View>

          {busy ? (
            <ActivityIndicator color={colors.platinum} style={styles.rowSpinner} />
          ) : (
            <Switch
              value={inStock}
              onValueChange={onToggle}
              accessibilityLabel={`${product.name} availability`}
              trackColor={{ false: colors.graphite, true: colors.crimson }}
              thumbColor={colors.ivory}
              ios_backgroundColor={colors.graphite}
            />
          )}
        </View>
      </Surface>
    </Animated.View>
  );
}

const COVER = 64;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  list: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  banner: {
    marginBottom: spacing.sm,
  },
  bannerRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  bannerBody: {
    flex: 1,
  },
  bannerTitle: {
    ...type.subheading,
    fontSize: 14,
  },
  bannerText: {
    ...type.caption,
    color: colors.ash,
    marginTop: 3,
    lineHeight: 17,
  },
  statCard: {
    marginBottom: spacing.sm,
  },
  composerToggle: {
    marginBottom: spacing.sm,
  },

  rowWrap: {
    marginBottom: spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coverWrap: {
    width: COVER,
    height: COVER,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  coverOff: {
    // Desaturating the photograph is what makes "out of stock" readable at a
    // glance down a long list.
    opacity: 0.35,
  },
  cover: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.charcoalLight,
  },
  coverEmpty: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.charcoalLight,
  },
  rowText: {
    flex: 1,
  },
  productName: {
    ...type.subheading,
    fontSize: 15,
    fontWeight: '400',
  },
  productNameOff: {
    color: colors.ash,
  },
  productMeta: {
    ...type.caption,
    color: colors.ash,
    marginTop: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stockText: {
    ...type.caption,
    color: colors.slate,
    fontSize: 10,
  },
  rejectReason: {
    ...type.caption,
    color: colors.crimsonGlow,
    marginTop: 5,
    lineHeight: 16,
  },
  rowSpinner: {
    width: 51,
  },
});
