import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Divider from '../ui/Divider';
import Icon from '../ui/Icon';
import PressableScale from '../ui/PressableScale';
import Surface from '../ui/Surface';
import TextField from '../ui/TextField';
import { colors, radii, spacing } from '../../theme/colors';
import { duration, easing, stagger, type } from '../../theme/tokens';

export const CATEGORIES = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'];
export const MAX_IMAGES = 5;

/**
 * ListingComposer
 *
 * The "add a product" form, lifted out of the catalog screen so neither file
 * has to carry both the list and the twenty fields behind it.
 *
 * The form is ordered by what a shopkeeper actually knows when they pick up the
 * phone: photos first (they have just taken them), then the two facts that make
 * a listing sellable — name and price — and only then the attribute long tail,
 * which is folded under its own labelled divider so it reads as optional rather
 * than as twelve more required boxes.
 */
export default function ListingComposer({
  draft,
  setDraft,
  onPickImages,
  onRemoveImage,
  onSubmit,
  saving,
  uploading,
}) {
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Animated.View entering={FadeInDown.duration(duration.slow).easing(easing.out)}>
      <Surface padding="default" lift="medium" style={styles.composer}>
        {/* Photos ------------------------------------------------------ */}
        <View style={styles.blockHeader}>
          <Text style={styles.blockLabel}>PHOTOS</Text>
          <Text style={styles.blockCount}>
            {draft.images.length}/{MAX_IMAGES}
          </Text>
        </View>

        <View style={styles.thumbRow}>
          {draft.images.map((img, index) => (
            <Animated.View key={img.publicId} entering={FadeIn.delay(stagger(index, 40))}>
              <PressableScale
                onPress={() => onRemoveImage(img.publicId)}
                haptic="medium"
                scaleTo={0.92}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                style={styles.thumbWrap}
              >
                <Image
                  source={{ uri: img.thumbnails?.thumb || img.url }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.thumbRemove}>
                  <Icon name="x" size={11} color={colors.ivory} />
                </View>
              </PressableScale>
            </Animated.View>
          ))}

          {draft.images.length < MAX_IMAGES ? (
            <PressableScale
              onPress={onPickImages}
              scaleTo={0.93}
              accessibilityRole="button"
              accessibilityLabel="Add photos"
              style={styles.addThumb}
            >
              {uploading ? (
                <ActivityIndicator color={colors.platinum} />
              ) : (
                <>
                  <Icon name="camera" size="lg" color={colors.gold} />
                  <Text style={styles.addThumbText}>ADD</Text>
                </>
              )}
            </PressableScale>
          ) : null}
        </View>

        <Text style={styles.hint}>
          The first photo is the one buyers see in the feed. Shoot on the rail, in daylight.
        </Text>

        <Divider label="The basics" />

        <TextField
          label="Name"
          icon="tag"
          value={draft.name}
          onChangeText={set('name')}
          placeholder="Charcoal linen shirt"
        />

        <TextField
          label="Brand"
          icon="award"
          value={draft.brand}
          onChangeText={set('brand')}
          placeholder="e.g. Raymond, or your shop label"
        />

        <Text style={styles.fieldLabel}>CATEGORY</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={draft.category === category}
              onPress={() => setDraft((d) => ({ ...d, category }))}
              accessibilityLabel={`Category ${category}`}
            />
          ))}
        </View>

        <TextField
          label="Type"
          icon="grid"
          value={draft.subCategory}
          onChangeText={set('subCategory')}
          placeholder="Shirt, Kurta, Dress, Trousers…"
        />

        <View style={styles.twoCol}>
          <TextField
            label="Selling price (₹)"
            value={draft.price}
            onChangeText={set('price')}
            placeholder="2400"
            keyboardType="number-pad"
            style={styles.colField}
          />
          <TextField
            label="MRP (₹)"
            value={draft.mrp}
            onChangeText={set('mrp')}
            placeholder="3200"
            keyboardType="number-pad"
            style={styles.colField}
          />
        </View>

        <TextField
          label="Sizes & stock"
          icon="layers"
          value={draft.sizes}
          onChangeText={set('sizes')}
          placeholder="S:3, M:5, L:2"
          autoCapitalize="characters"
          hint="Format size:stock — e.g. S:3, M:5. No number means 1 in stock."
        />

        <TextField
          label="Colours"
          icon="droplet"
          value={draft.colors}
          onChangeText={set('colors')}
          placeholder="Black, Ivory"
        />

        <Divider label="Details buyers ask about" />

        <View style={styles.twoCol}>
          <TextField
            label="Fabric / material"
            value={draft.material}
            onChangeText={set('material')}
            placeholder="100% Cotton"
            style={styles.colField}
          />
          <TextField
            label="Pattern"
            value={draft.pattern}
            onChangeText={set('pattern')}
            placeholder="Solid, Printed…"
            style={styles.colField}
          />
        </View>

        <View style={styles.twoCol}>
          <TextField
            label="Fit"
            value={draft.fit}
            onChangeText={set('fit')}
            placeholder="Regular, Slim…"
            style={styles.colField}
          />
          <TextField
            label="Occasion"
            value={draft.occasion}
            onChangeText={set('occasion')}
            placeholder="Casual, Formal…"
            style={styles.colField}
          />
        </View>

        <View style={styles.twoCol}>
          <TextField
            label="Net qty (units)"
            value={draft.netQuantity}
            onChangeText={set('netQuantity')}
            placeholder="1"
            keyboardType="number-pad"
            style={styles.colField}
          />
          <TextField
            label="Country of origin"
            value={draft.countryOfOrigin}
            onChangeText={set('countryOfOrigin')}
            placeholder="India"
            style={styles.colField}
          />
        </View>

        <TextField
          label="Care instructions"
          icon="info"
          value={draft.careInstructions}
          onChangeText={set('careInstructions')}
          placeholder="Machine wash cold, do not bleach"
        />

        <TextField
          label="Description"
          value={draft.description}
          onChangeText={set('description')}
          placeholder="Optional — what makes this piece worth the trip?"
          multiline
        />

        <View style={styles.qcNote}>
          <Icon name="shield" size="sm" color={colors.gold} />
          <Text style={styles.qcText}>
            New listings go live after a quick quality check — usually within the hour.
          </Text>
        </View>

        <Button
          label="Add listing"
          icon="plus-circle"
          onPress={onSubmit}
          loading={saving}
          disabled={uploading}
          size="lg"
          fullWidth
          style={styles.submit}
        />
      </Surface>
    </Animated.View>
  );
}

const THUMB = 74;

const styles = StyleSheet.create({
  composer: {
    marginBottom: spacing.sm,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  blockLabel: {
    ...type.eyebrow,
    color: colors.ash,
    letterSpacing: 2.4,
  },
  blockCount: {
    ...type.caption,
    color: colors.slate,
    fontVariant: ['tabular-nums'],
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.charcoalLight,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrimStrong,
  },
  addThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(200, 162, 74, 0.4)',
    backgroundColor: colors.goldWashSoft,
  },
  addThumbText: {
    ...type.caption,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  hint: {
    ...type.caption,
    color: colors.slate,
    marginTop: spacing.s,
    lineHeight: 16,
  },
  fieldLabel: {
    ...type.caption,
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.sm,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  colField: {
    flex: 1,
  },
  qcNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.s,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.goldWashSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200, 162, 74, 0.24)',
  },
  qcText: {
    ...type.caption,
    color: colors.platinum,
    flex: 1,
    lineHeight: 17,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
