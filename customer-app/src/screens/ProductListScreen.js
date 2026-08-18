import { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProductGridCard from '../components/ProductGridCard';
import FilterSheet from '../components/shop/FilterSheet';
import {
  activeFilterCount,
  applyCatalog,
  departmentLabel,
  emptyFilters,
  filterProducts,
  getFacets,
  SORTS,
} from '../shop/catalog';
import useCatalog from '../shop/useCatalog';
import { colors, radii, spacing } from '../theme/colors';

/**
 * ProductListScreen — the filterable, sortable browsing grid.
 *
 * Reached from the shop welcome page (a department tile, "Browse all", or a
 * search). Route params seed the initial filters:
 *   - department: pre-scope to a department (and lock it in the filter sheet)
 *   - query:      pre-fill the search
 *   - title:      header title
 *
 * The header carries live search + sort chips; the deeper facets (type, size,
 * price) live in the FilterSheet so the header stays clean.
 */
export default function ProductListScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const params = route.params ?? {};

  const [filters, setFilters] = useState(() => ({
    ...emptyFilters(),
    department: params.department ?? null,
    query: params.query ?? '',
  }));
  const [sort, setSort] = useState('proximity');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { products, source } = useCatalog();

  const lockDepartment = Boolean(params.department);

  useLayoutEffect(() => {
    navigation.setOptions({ title: params.title ?? 'Shop' });
  }, [navigation, params.title]);

  // Facets are computed for the department scope only, so the chips a shopper
  // sees always belong to what they're browsing and don't churn as they filter.
  const facets = useMemo(
    () => getFacets(filterProducts(products, { department: filters.department })),
    [products, filters.department]
  );

  const results = useMemo(() => applyCatalog(products, filters, sort), [products, filters, sort]);

  const count = activeFilterCount(filters);
  const openProduct = (product) => navigation.navigate('ProductDetail', { product });

  const header = (
    <View style={styles.header}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder={`Search${filters.department ? ` in ${departmentLabel(filters.department)}` : ''}…`}
          placeholderTextColor={colors.slate}
          value={filters.query}
          onChangeText={(query) => setFilters((f) => ({ ...f, query }))}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {filters.query ? (
          <Pressable onPress={() => setFilters((f) => ({ ...f, query: '' }))} hitSlop={spacing.xs}>
            <Text style={styles.clearSearch}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.controlRow}>
        <FlatList
          data={SORTS}
          keyExtractor={(s) => s.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
          renderItem={({ item }) => {
            const active = sort === item.key;
            return (
              <Pressable onPress={() => setSort(item.key)} style={[styles.sortChip, active && styles.sortChipActive]}>
                <Text style={[styles.sortLabel, active && styles.sortLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          }}
        />
        <Pressable style={styles.filterBtn} onPress={() => setSheetOpen(true)} accessibilityLabel="Open filters">
          <Text style={styles.filterBtnLabel}>Filters{count ? ` (${count})` : ''}</Text>
        </Pressable>
      </View>

      <Text style={styles.count}>
        {results.length} {results.length === 1 ? 'piece' : 'pieces'}
        {source === 'sample' ? '  ·  sample catalogue' : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
        renderItem={({ item }) => (
          <ProductGridCard product={item} onPress={() => openProduct(item)} style={styles.card} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing matches those filters.</Text>
            <Pressable onPress={() => setFilters((f) => ({ ...emptyFilters(), department: lockDepartment ? f.department : null }))}>
              <Text style={styles.emptyReset}>Clear filters</Text>
            </Pressable>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <FilterSheet
        key={sheetOpen ? 'filters-open' : 'filters-closed'}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        facets={facets}
        filters={filters}
        sort={sort}
        onApply={(nextFilters, nextSort) => {
          setFilters(nextFilters);
          setSort(nextSort);
        }}
        lockDepartment={lockDepartment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  list: { paddingHorizontal: spacing.md },
  header: { paddingTop: spacing.md, paddingBottom: spacing.sm },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
    paddingRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  search: { flex: 1, color: colors.ivory, fontSize: 15, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  clearSearch: { color: colors.ash, fontSize: 15, paddingHorizontal: 4 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sortRow: { gap: spacing.xs, alignItems: 'center', flexGrow: 1 },
  sortChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  sortChipActive: { borderColor: colors.gold, backgroundColor: colors.glassFillStrong },
  sortLabel: { color: colors.ash, fontSize: 12 },
  sortLabelActive: { color: colors.gold, fontWeight: '600' },
  filterBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.crimsonBright,
    backgroundColor: colors.crimson,
  },
  filterBtnLabel: { color: colors.ivory, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  count: { color: colors.slate, fontSize: 11, letterSpacing: 0.6, marginTop: spacing.sm },
  column: { gap: spacing.sm, marginBottom: spacing.sm },
  card: { marginBottom: 0 },
  empty: { alignItems: 'center', paddingTop: spacing.xl },
  emptyTitle: { color: colors.ash, fontSize: 14, marginBottom: spacing.sm },
  emptyReset: { color: colors.gold, fontSize: 13, fontWeight: '600' },
});
