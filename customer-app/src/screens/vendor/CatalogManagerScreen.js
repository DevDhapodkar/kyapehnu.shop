import { useCallback, useEffect, useState } from 'react';
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
  TextInput,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import GlassButton from '../../components/GlassButton';
import GlassCard from '../../components/GlassCard';
import PressableScale from '../../components/PressableScale';
import { colors, radii, spacing } from '../../theme/colors';
import useVendorStore from '../../store/useVendorStore';
import { uploadProductImages } from '../../api/vendorApi';
import { selection, notifySuccess, notifyError } from '../../utils/haptics';
import { formatCurrency } from '../../utils/format';

const CATEGORIES = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'];
const MAX_IMAGES = 5;

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

// How a listing's moderation status reads to the vendor, and its tint.
const REVIEW_STATUS = {
  PENDING_QC: { label: 'IN REVIEW', tone: 'pending' },
  APPROVED: { label: 'LIVE', tone: 'live' },
  REJECTED: { label: 'REJECTED', tone: 'rejected' },
  ARCHIVED: { label: 'ARCHIVED', tone: 'muted' },
  DRAFT: { label: 'DRAFT', tone: 'muted' },
};

/**
 * Catalog manager: flip a listing in or out of stock, and add a new one.
 *
 * Availability is the primary job — it's the control a shop reaches for a
 * dozen times a day — so it lives on every row as a switch with no
 * confirmation step. The add form stays collapsed behind a toggle so it never
 * competes with the list for the first screenful.
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
      // In/out of stock is flipped a dozen times a day — a selection detent is
      // the right weight, and it fires on the intent, before the round trip.
      selection();
      try {
        await toggleAvailability(product._id, next);
      } catch (err) {
        notifyError();
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

      notifySuccess();
      setDraft(EMPTY_DRAFT);
      setComposerOpen(false);
    } catch (err) {
      notifyError();
      Alert.alert('Could not add listing', err.message);
    } finally {
      setSaving(false);
    }
  }, [addProduct, draft]);

  const renderItem = useCallback(
    ({ item }) => {
      const inStock = item.isAvailable;
      const review = REVIEW_STATUS[item.status] ?? null;

      return (
        <GlassCard compact style={styles.row}>
          <View style={styles.rowBody}>
            <View style={styles.rowText}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.productMeta}>
                {item.category} · {formatCurrency(item.price)}
                {item.sizes?.length ? ` · ${item.sizes.map((s) => s.size).join(' / ')}` : ''}
              </Text>
              <View style={styles.badgeRow}>
                {review ? (
                  <Text style={[styles.reviewBadge, styles[`review_${review.tone}`]]}>
                    {review.label}
                  </Text>
                ) : null}
                <Text style={[styles.stockLabel, !inStock && styles.stockLabelOff]}>
                  {inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                </Text>
              </View>
              {item.status === 'REJECTED' && item.qc?.reason ? (
                <Text style={styles.rejectReason}>{item.qc.reason}</Text>
              ) : null}
            </View>

            {pendingProductId === item._id ? (
              <ActivityIndicator color={colors.platinum} style={styles.rowSpinner} />
            ) : (
              <Switch
                value={inStock}
                onValueChange={(next) => onToggle(item, next)}
                accessibilityLabel={`${item.name} availability`}
                trackColor={{ false: colors.graphite, true: colors.crimson }}
                thumbColor={colors.ivory}
                ios_backgroundColor={colors.graphite}
              />
            )}
          </View>
        </GlassCard>
      );
    },
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
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCatalog}
            tintColor={colors.platinum}
            colors={[colors.platinum]}
            progressBackgroundColor={colors.charcoal}
          />
        }
        ListHeaderComponent={
          <View>
            {error ? (
              <GlassCard strong compact style={styles.banner}>
                <Text style={styles.bannerTitle}>Catalog out of sync</Text>
                <Text style={styles.bannerBody}>{error}</Text>
              </GlassCard>
            ) : null}

            <PressableScale
              onPress={() => setComposerOpen((open) => !open)}
              haptic="light"
              accessibilityLabel={composerOpen ? 'Close new listing form' : 'New listing'}
              style={styles.composerToggle}
            >
              <Text style={styles.composerToggleText}>
                {composerOpen ? '— CLOSE' : '+ NEW LISTING'}
              </Text>
            </PressableScale>

            {composerOpen ? (
              <GlassCard strong compact style={styles.composer}>
                <Field
                  label="NAME"
                  value={draft.name}
                  onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
                  placeholder="Charcoal linen shirt"
                />

                <Field
                  label="BRAND"
                  value={draft.brand}
                  onChangeText={(brand) => setDraft((d) => ({ ...d, brand }))}
                  placeholder="e.g. Raymond, or your shop label"
                />

                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((category) => {
                    const active = draft.category === category;
                    return (
                      <PressableScale
                        key={category}
                        haptic={false}
                        onPress={() => {
                          if (draft.category === category) return;
                          selection();
                          setDraft((d) => ({ ...d, category }));
                        }}
                        accessibilityRole="radio"
                        accessibilityLabel={category}
                        accessibilityState={{ selected: active }}
                        style={[styles.categoryChip, active && styles.categoryChipActive]}
                      >
                        <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                          {category}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>

                <Field
                  label="TYPE"
                  value={draft.subCategory}
                  onChangeText={(subCategory) => setDraft((d) => ({ ...d, subCategory }))}
                  placeholder="Shirt, Kurta, Dress, Trousers…"
                />

                <View style={styles.twoCol}>
                  <Field
                    label="SELLING PRICE (₹)"
                    value={draft.price}
                    onChangeText={(price) => setDraft((d) => ({ ...d, price }))}
                    placeholder="2400"
                    keyboardType="number-pad"
                    containerStyle={styles.colField}
                  />
                  <Field
                    label="MRP (₹)"
                    value={draft.mrp}
                    onChangeText={(mrp) => setDraft((d) => ({ ...d, mrp }))}
                    placeholder="3200"
                    keyboardType="number-pad"
                    containerStyle={styles.colField}
                  />
                </View>

                <Field
                  label="SIZES & STOCK"
                  value={draft.sizes}
                  onChangeText={(sizes) => setDraft((d) => ({ ...d, sizes }))}
                  placeholder="S:3, M:5, L:2"
                  autoCapitalize="characters"
                />
                <Text style={styles.hint}>Format size:stock — e.g. S:3, M:5. No number = 1 in stock.</Text>

                <Field
                  label="COLOURS"
                  value={draft.colors}
                  onChangeText={(colors) => setDraft((d) => ({ ...d, colors }))}
                  placeholder="Black, Ivory"
                />

                <View style={styles.twoCol}>
                  <Field
                    label="FABRIC / MATERIAL"
                    value={draft.material}
                    onChangeText={(material) => setDraft((d) => ({ ...d, material }))}
                    placeholder="100% Cotton"
                    containerStyle={styles.colField}
                  />
                  <Field
                    label="PATTERN"
                    value={draft.pattern}
                    onChangeText={(pattern) => setDraft((d) => ({ ...d, pattern }))}
                    placeholder="Solid, Printed…"
                    containerStyle={styles.colField}
                  />
                </View>

                <View style={styles.twoCol}>
                  <Field
                    label="FIT"
                    value={draft.fit}
                    onChangeText={(fit) => setDraft((d) => ({ ...d, fit }))}
                    placeholder="Regular, Slim…"
                    containerStyle={styles.colField}
                  />
                  <Field
                    label="OCCASION"
                    value={draft.occasion}
                    onChangeText={(occasion) => setDraft((d) => ({ ...d, occasion }))}
                    placeholder="Casual, Formal…"
                    containerStyle={styles.colField}
                  />
                </View>

                <View style={styles.twoCol}>
                  <Field
                    label="NET QTY (units)"
                    value={draft.netQuantity}
                    onChangeText={(netQuantity) => setDraft((d) => ({ ...d, netQuantity }))}
                    placeholder="1"
                    keyboardType="number-pad"
                    containerStyle={styles.colField}
                  />
                  <Field
                    label="COUNTRY OF ORIGIN"
                    value={draft.countryOfOrigin}
                    onChangeText={(countryOfOrigin) => setDraft((d) => ({ ...d, countryOfOrigin }))}
                    placeholder="India"
                    containerStyle={styles.colField}
                  />
                </View>

                <Field
                  label="CARE INSTRUCTIONS"
                  value={draft.careInstructions}
                  onChangeText={(careInstructions) => setDraft((d) => ({ ...d, careInstructions }))}
                  placeholder="Machine wash cold, do not bleach"
                />

                <Field
                  label="DESCRIPTION"
                  value={draft.description}
                  onChangeText={(description) => setDraft((d) => ({ ...d, description }))}
                  placeholder="Optional"
                  multiline
                />

                <Text style={styles.fieldLabel}>PHOTOS ({draft.images.length}/{MAX_IMAGES})</Text>
                <View style={styles.thumbRow}>
                  {draft.images.map((img) => (
                    <PressableScale
                      key={img.publicId}
                      onPress={() => removeImage(img.publicId)}
                      haptic="medium"
                      accessibilityLabel="Remove photo"
                      style={styles.thumbWrap}
                    >
                      <Image
                        source={{ uri: img.thumbnails?.thumb || img.url }}
                        style={styles.thumb}
                        contentFit="cover"
                      />
                      <View style={styles.thumbRemove}>
                        <Text style={styles.thumbRemoveText}>×</Text>
                      </View>
                    </PressableScale>
                  ))}

                  {draft.images.length < MAX_IMAGES ? (
                    <PressableScale
                      onPress={onPickImages}
                      haptic="light"
                      accessibilityLabel="Add photos"
                      style={styles.addThumb}
                    >
                      {uploading ? (
                        <ActivityIndicator color={colors.platinum} />
                      ) : (
                        <Text style={styles.addThumbText}>＋</Text>
                      )}
                    </PressableScale>
                  ) : null}
                </View>

                <Text style={styles.qcNote}>
                  New listings go live after a quick quality check.
                </Text>

                <GlassButton
                  label="Add Listing"
                  onPress={onSubmit}
                  loading={saving}
                  disabled={uploading}
                  style={styles.submit}
                />
              </GlassCard>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <GlassCard style={styles.empty}>
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptyBody}>
                Add your first product and it appears in the customer flow straight away.
              </Text>
            </GlassCard>
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

/** Labelled text input, so the composer's fields stay identical. */
function Field({ label, style, containerStyle, multiline, ...inputProps }) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={colors.slate}
        style={[styles.input, multiline && styles.inputMultiline, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  banner: {
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    color: colors.ivory,
    fontSize: 14,
  },
  bannerBody: {
    color: colors.ash,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  composerToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 9,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    marginBottom: spacing.sm,
  },
  composerToggleText: {
    color: colors.platinum,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  composer: {
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
  },
  input: {
    color: colors.ivory,
    fontSize: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 11,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.obsidianDeep,
  },
  inputMultiline: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colField: {
    flex: 1,
  },
  hint: {
    color: colors.slate,
    fontSize: 10,
    lineHeight: 14,
    marginTop: -6,
    marginBottom: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  categoryChipActive: {
    backgroundColor: colors.charcoalLight,
    borderColor: colors.graphite,
  },
  categoryText: {
    color: colors.ash,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  categoryTextActive: {
    color: colors.ivory,
    fontWeight: '600',
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.glassFillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: {
    color: colors.ivory,
    fontSize: 14,
    lineHeight: 16,
  },
  addThumb: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThumbText: {
    color: colors.platinum,
    fontSize: 24,
    fontWeight: '300',
  },
  qcNote: {
    color: colors.slate,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  submit: {
    marginTop: spacing.xs,
  },
  row: {
    marginBottom: spacing.sm,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  rowSpinner: {
    width: 51, // matches the Switch footprint so rows don't jump mid-toggle
  },
  productName: {
    color: colors.ivory,
    fontSize: 15,
  },
  productMeta: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 8,
  },
  reviewBadge: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  review_pending: { color: colors.gold },
  review_live: { color: '#3fb27f' },
  review_rejected: { color: colors.crimsonBright },
  review_muted: { color: colors.slate },
  stockLabel: {
    color: colors.platinum,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  stockLabelOff: {
    color: colors.slate,
  },
  rejectReason: {
    color: colors.ash,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  empty: {
    marginTop: spacing.md,
  },
  emptyTitle: {
    color: colors.ivory,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  emptyBody: {
    color: colors.ash,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});
