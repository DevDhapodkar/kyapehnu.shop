import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { colors, radii, spacing } from '../../theme/colors';
import useVendorStore from '../../store/useVendorStore';
import { uploadProductImage } from '../../api/uploads';
import { formatCurrency } from '../../utils/format';

const CATEGORIES = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'];

const EMPTY_DRAFT = {
  name: '',
  category: 'WOMEN',
  price: '',
  sizes: '',
  description: '',
  imageUrl: null,
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

  // Pick a photo from the library and upload it to Cloudinary (via a signed,
  // server-issued URL). The returned CDN URL is stashed on the draft and saved
  // with the listing. Photos are optional — a listing without one still works.
  const onPickImage = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return Alert.alert('Permission needed', 'Allow photo access to add a product image.');
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (result.canceled) return;

      setUploading(true);
      const url = await uploadProductImage(result.assets[0]);
      setDraft((d) => ({ ...d, imageUrl: url }));
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const onToggle = useCallback(
    async (product, next) => {
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

    if (!draft.name.trim()) return Alert.alert('Name required', 'Give the listing a name.');
    if (!Number.isFinite(price) || price <= 0) {
      return Alert.alert('Price required', 'Enter the price in whole rupees.');
    }

    // The Product schema wants `sizes: [{ size, stock }]`; the form takes the
    // shorthand a vendor would actually type ("S, M, L") and expands it.
    const sizes = draft.sizes
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean)
      .map((size) => ({ size, stock: 1 }));

    setSaving(true);
    try {
      // Backend expects `basePriceRupees` (vendor's price); the admin adds the
      // Kya Pehnu margin at approval. New listings land in PENDING_APPROVAL.
      await addProduct({
        name: draft.name.trim(),
        category: draft.category,
        basePriceRupees: price,
        description: draft.description.trim() || undefined,
        sizes: sizes.length ? sizes : [{ size: 'FREE', stock: 1 }],
        images: draft.imageUrl ? [draft.imageUrl] : undefined,
      });

      setDraft(EMPTY_DRAFT);
      setComposerOpen(false);
    } catch (err) {
      Alert.alert('Could not add listing', err.message);
    } finally {
      setSaving(false);
    }
  }, [addProduct, draft]);

  const renderItem = useCallback(
    ({ item }) => {
      const inStock = item.isAvailable;

      return (
        <GlassCard compact style={styles.row}>
          <View style={styles.rowBody}>
            <View style={styles.rowText}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.productMeta}>
                {item.category} · {formatCurrency(item.discountPrice ?? item.price)}
                {item.sizes?.length ? ` · ${item.sizes.map((s) => s.size).join(' / ')}` : ''}
              </Text>
              <Text style={[styles.stockLabel, !inStock && styles.stockLabelOff]}>
                {inStock ? 'IN STOCK' : 'OUT OF STOCK'}
              </Text>
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

            <Pressable
              onPress={() => setComposerOpen((open) => !open)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.composerToggle, pressed && styles.pressed]}
            >
              <Text style={styles.composerToggleText}>
                {composerOpen ? '— CLOSE' : '+ NEW LISTING'}
              </Text>
            </Pressable>

            {composerOpen ? (
              <GlassCard strong compact style={styles.composer}>
                <Text style={styles.fieldLabel}>PHOTO</Text>
                <Pressable
                  onPress={onPickImage}
                  disabled={uploading}
                  accessibilityRole="button"
                  accessibilityLabel="Add product photo"
                  style={({ pressed }) => [styles.photoPicker, pressed && styles.pressed]}
                >
                  {draft.imageUrl ? (
                    <Image source={{ uri: draft.imageUrl }} style={styles.photoPreview} contentFit="cover" />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      {uploading ? (
                        <ActivityIndicator color={colors.platinum} />
                      ) : (
                        <Text style={styles.photoPlaceholderText}>+ ADD PHOTO</Text>
                      )}
                    </View>
                  )}
                  {draft.imageUrl && !uploading ? (
                    <Text style={styles.photoReplace}>Tap to replace</Text>
                  ) : null}
                </Pressable>

                <Field
                  label="NAME"
                  value={draft.name}
                  onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
                  placeholder="Charcoal linen shirt"
                />

                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((category) => {
                    const active = draft.category === category;
                    return (
                      <Pressable
                        key={category}
                        onPress={() => setDraft((d) => ({ ...d, category }))}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          active && styles.categoryChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                          {category}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Field
                  label="PRICE (₹)"
                  value={draft.price}
                  onChangeText={(price) => setDraft((d) => ({ ...d, price }))}
                  placeholder="2400"
                  keyboardType="number-pad"
                />

                <Field
                  label="SIZES"
                  value={draft.sizes}
                  onChangeText={(sizes) => setDraft((d) => ({ ...d, sizes }))}
                  placeholder="S, M, L, XL"
                  autoCapitalize="characters"
                />

                <Field
                  label="DESCRIPTION"
                  value={draft.description}
                  onChangeText={(description) => setDraft((d) => ({ ...d, description }))}
                  placeholder="Optional"
                  multiline
                />

                <GlassButton
                  label="Add Listing"
                  onPress={onSubmit}
                  loading={saving}
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

/** Labelled text input, so the composer's five fields stay identical. */
function Field({ label, style, multiline, ...inputProps }) {
  return (
    <View style={styles.field}>
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
  pressed: {
    opacity: 0.7,
  },
  composer: {
    marginBottom: spacing.md,
  },
  photoPicker: {
    marginBottom: spacing.sm,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: radii.sm,
    backgroundColor: colors.charcoalLight,
  },
  photoPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.obsidianDeep,
  },
  photoPlaceholderText: {
    color: colors.platinum,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  photoReplace: {
    color: colors.ash,
    fontSize: 10,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 6,
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
  stockLabel: {
    color: colors.platinum,
    fontSize: 9,
    letterSpacing: 1.8,
    marginTop: 8,
  },
  stockLabelOff: {
    color: colors.slate,
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
