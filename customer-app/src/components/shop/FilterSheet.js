import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEPARTMENTS, SORTS } from '../../shop/catalog';
import { colors, radii, spacing } from '../../theme/colors';

/**
 * FilterSheet
 *
 * A bottom-sheet modal for refining a product list. It edits a *draft* copy of
 * the filters so nothing changes behind the list until the shopper taps Apply —
 * Clear resets the draft, closing without Apply discards it. `facets` (distinct
 * types/sizes/price for the current department) comes from the catalogue so the
 * sheet only offers chips that can match something.
 *
 * Props:
 *  - visible, onClose
 *  - facets: { types, sizes, price:{min,max} }
 *  - filters, sort: the currently applied state
 *  - onApply(nextFilters, nextSort)
 *  - lockDepartment: when true the department row is hidden (already scoped)
 *
 * The parent remounts this on open (via a `key`), so the `useState` initialisers
 * below seed the draft from the live applied state each time it opens — no
 * effect, no stale draft.
 */
export default function FilterSheet({ visible, onClose, facets, filters, sort, onApply, lockDepartment }) {
  const [draft, setDraft] = useState(filters);
  const [draftSort, setDraftSort] = useState(sort);

  const toggleIn = (key) => (value) =>
    setDraft((d) => {
      const list = d[key] ?? [];
      return { ...d, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  const toggleType = toggleIn('types');
  const toggleSize = toggleIn('sizes');

  const setPrice = (key) => (text) => {
    const n = text.replace(/[^\d]/g, '');
    setDraft((d) => ({ ...d, [key]: n ? Number(n) : null }));
  };

  const clearAll = () =>
    setDraft((d) => ({
      ...d,
      types: [],
      sizes: [],
      minPrice: null,
      maxPrice: null,
      query: '',
      department: lockDepartment ? d.department : null,
    }));

  const apply = () => {
    onApply(draft, draftSort);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={clearAll} hitSlop={spacing.xs}>
            <Text style={styles.clear}>Clear all</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Group label="Sort by">
            <ChipRow
              options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
              selected={[draftSort]}
              onToggle={(v) => setDraftSort(v)}
            />
          </Group>

          {!lockDepartment ? (
            <Group label="Department">
              <ChipRow
                options={DEPARTMENTS.map((d) => ({ value: d.key, label: d.label }))}
                selected={draft.department ? [draft.department] : []}
                onToggle={(v) => setDraft((d) => ({ ...d, department: d.department === v ? null : v }))}
              />
            </Group>
          ) : null}

          {facets.types.length ? (
            <Group label="Type">
              <ChipRow
                options={facets.types.map((t) => ({ value: t, label: t }))}
                selected={draft.types ?? []}
                onToggle={toggleType}
              />
            </Group>
          ) : null}

          {facets.sizes.length ? (
            <Group label="Size">
              <ChipRow
                options={facets.sizes.map((s) => ({ value: s, label: s }))}
                selected={draft.sizes ?? []}
                onToggle={toggleSize}
              />
            </Group>
          ) : null}

          <Group label={`Price (₹${facets.price.min} – ₹${facets.price.max})`}>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                placeholderTextColor={colors.slate}
                keyboardType="number-pad"
                value={draft.minPrice != null ? String(draft.minPrice) : ''}
                onChangeText={setPrice('minPrice')}
              />
              <Text style={styles.priceDash}>—</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                placeholderTextColor={colors.slate}
                keyboardType="number-pad"
                value={draft.maxPrice != null ? String(draft.maxPrice) : ''}
                onChangeText={setPrice('maxPrice')}
              />
            </View>
          </Group>
        </ScrollView>

        <Pressable style={({ pressed }) => [styles.apply, pressed && styles.applyPressed]} onPress={apply}>
          <Text style={styles.applyLabel}>SHOW RESULTS</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Group({ label, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function ChipRow({ options, selected, onToggle }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <Pressable
            key={o.value}
            onPress={() => onToggle(o.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '86%',
    backgroundColor: colors.obsidianDeep,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.graphite,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { color: colors.ivory, fontSize: 20, fontWeight: '300' },
  clear: { color: colors.gold, fontSize: 13 },
  body: { paddingBottom: spacing.md },
  group: { marginBottom: spacing.md },
  groupLabel: { color: colors.slate, fontSize: 10, letterSpacing: 2, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  chipActive: { borderColor: colors.crimsonBright, backgroundColor: colors.crimson },
  chipLabel: { color: colors.platinum, fontSize: 13 },
  chipLabelActive: { color: colors.ivory, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: {
    flex: 1,
    color: colors.ivory,
    fontSize: 15,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
  },
  priceDash: { color: colors.ash },
  apply: {
    marginTop: spacing.sm,
    backgroundColor: colors.crimsonBright,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  applyPressed: { opacity: 0.8 },
  applyLabel: { color: colors.ivory, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
});
