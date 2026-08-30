import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { Chip, Field, PillButton, SectionHeader, Surface } from '../ui';
import { uploadProductImages } from '../../api/vendorApi';
import { colors, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

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

/**
 * ListingComposer — the "new listing" form.
 *
 * Owns its own draft, its own uploads and its own validation, and hands the
 * parent a finished product payload. That split is what keeps the catalogue
 * screen readable: the screen is a list with a toggle, and everything about
 * *composing* a listing lives here.
 *
 * It stays collapsed behind a pill by default. The control a shop reaches for a
 * dozen times a day is the availability switch on an existing row, and an
 * always-open twenty-field form would push those rows off the first screenful.
 *
 * Props:
 *  - open:     whether the form is expanded
 *  - onToggle: flip the expanded state
 *  - onSubmit: async (payload) => void; rejects with a message on failure
 */
export default function ListingComposer({ open, onToggle, onSubmit }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const setField = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));

  const onPickImages = useCallback(async () => {
    const remaining = MAX_IMAGES - draft.images.length;
    if (remaining <= 0) {
      return Alert.alert('Enough photos', `Up to ${MAX_IMAGES} images per listing.`);
    }

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

  const handleSubmit = useCallback(async () => {
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
      await onSubmit({
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

      setDraft(EMPTY_DRAFT);
      onToggle();
    } catch (err) {
      Alert.alert('Could not add listing', err.message);
    } finally {
      setSaving(false);
    }
  }, [draft, onSubmit, onToggle]);

  return (
    <View>
      <PillButton
        label={open ? 'Close' : 'New listing'}
        variant={open ? 'ghost' : 'light'}
        icon={open ? '×' : '+'}
        onPress={onToggle}
        style={styles.toggle}
      />

      {!open ? null : (
        <Surface tone="regular" radius={radii.xl} elevation="medium" style={styles.composer} sheen>
          <SectionHeader
            eyebrow="New listing"
            title="What are you putting on the rail?"
            style={styles.header}
          />

          <Field
            label="NAME"
            value={draft.name}
            onChangeText={setField('name')}
            placeholder="Charcoal linen shirt"
          />

          <Field
            label="BRAND"
            value={draft.brand}
            onChangeText={setField('brand')}
            placeholder="e.g. Raymond, or your shop label"
          />

          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((category) => {
              const active = draft.category === category;
              return (
                <Chip
                  key={category}
                  label={category}
                  tone={active ? 'light' : 'surface'}
                  selected={active}
                  onPress={() => setDraft((d) => ({ ...d, category }))}
                />
              );
            })}
          </View>

          <Field
            label="TYPE"
            value={draft.subCategory}
            onChangeText={setField('subCategory')}
            placeholder="Shirt, Kurta, Dress, Trousers…"
          />

          <View style={styles.twoCol}>
            <Field
              label="SELLING PRICE (₹)"
              value={draft.price}
              onChangeText={setField('price')}
              placeholder="2400"
              keyboardType="number-pad"
              containerStyle={styles.colField}
            />
            <Field
              label="MRP (₹)"
              value={draft.mrp}
              onChangeText={setField('mrp')}
              placeholder="3200"
              keyboardType="number-pad"
              containerStyle={styles.colField}
            />
          </View>

          <Field
            label="SIZES & STOCK"
            value={draft.sizes}
            onChangeText={setField('sizes')}
            placeholder="S:3, M:5, L:2"
            autoCapitalize="characters"
            hint="Format size:stock — e.g. S:3, M:5. No number = 1 in stock."
          />

          <Field
            label="COLOURS"
            value={draft.colors}
            onChangeText={setField('colors')}
            placeholder="Black, Ivory"
          />

          <View style={styles.twoCol}>
            <Field
              label="FABRIC / MATERIAL"
              value={draft.material}
              onChangeText={setField('material')}
              placeholder="100% Cotton"
              containerStyle={styles.colField}
            />
            <Field
              label="PATTERN"
              value={draft.pattern}
              onChangeText={setField('pattern')}
              placeholder="Solid, Printed…"
              containerStyle={styles.colField}
            />
          </View>

          <View style={styles.twoCol}>
            <Field
              label="FIT"
              value={draft.fit}
              onChangeText={setField('fit')}
              placeholder="Regular, Slim…"
              containerStyle={styles.colField}
            />
            <Field
              label="OCCASION"
              value={draft.occasion}
              onChangeText={setField('occasion')}
              placeholder="Casual, Formal…"
              containerStyle={styles.colField}
            />
          </View>

          <View style={styles.twoCol}>
            <Field
              label="NET QTY (units)"
              value={draft.netQuantity}
              onChangeText={setField('netQuantity')}
              placeholder="1"
              keyboardType="number-pad"
              containerStyle={styles.colField}
            />
            <Field
              label="COUNTRY OF ORIGIN"
              value={draft.countryOfOrigin}
              onChangeText={setField('countryOfOrigin')}
              placeholder="India"
              containerStyle={styles.colField}
            />
          </View>

          <Field
            label="CARE INSTRUCTIONS"
            value={draft.careInstructions}
            onChangeText={setField('careInstructions')}
            placeholder="Machine wash cold, do not bleach"
          />

          <Field
            label="DESCRIPTION"
            value={draft.description}
            onChangeText={setField('description')}
            placeholder="Optional"
            multiline
          />

          <Text style={styles.fieldLabel}>
            PHOTOS ({draft.images.length}/{MAX_IMAGES})
          </Text>
          <View style={styles.thumbRow}>
            {draft.images.map((img) => (
              <Pressable
                key={img.publicId}
                onPress={() => removeImage(img.publicId)}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                style={({ pressed }) => [styles.thumbWrap, pressed && styles.pressed]}
              >
                <Image
                  source={{ uri: img.thumbnails?.thumb || img.url }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.thumbRemove}>
                  <Text style={styles.thumbRemoveText}>×</Text>
                </View>
              </Pressable>
            ))}

            {draft.images.length < MAX_IMAGES ? (
              <Pressable
                onPress={onPickImages}
                accessibilityRole="button"
                accessibilityLabel="Add photos"
                style={({ pressed }) => [styles.addThumb, pressed && styles.pressed]}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.platinum} />
                ) : (
                  <Text style={styles.addThumbText}>+</Text>
                )}
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.qcNote}>New listings go live after a quick quality check.</Text>

          <PillButton
            label="Add listing"
            variant="gradient"
            size="lg"
            icon="→"
            full
            onPress={handleSubmit}
            loading={saving}
            disabled={uploading}
          />
        </Surface>
      )}
    </View>
  );
}

const THUMB = 70;

const styles = StyleSheet.create({
  toggle: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  composer: {
    padding: spacing.md - 2,
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md - 2,
  },
  fieldLabel: {
    ...typography.micro,
    fontSize: 9,
    letterSpacing: 1.8,
    color: colors.ash,
    marginBottom: 7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colField: {
    flex: 1,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceHigh,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.glassOverImage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: {
    color: colors.ivory,
    fontSize: 14,
    lineHeight: 16,
  },
  addThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThumbText: {
    color: colors.platinum,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '300',
  },
  pressed: {
    opacity: 0.7,
  },
  qcNote: {
    ...typography.caption,
    fontSize: 11,
    color: colors.slate,
    marginBottom: spacing.sm,
  },
});
