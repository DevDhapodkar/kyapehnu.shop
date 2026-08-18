import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DEPARTMENTS,
  departmentCount,
  departmentCover,
  sortProducts,
} from '../shop/catalog';
import useCatalog from '../shop/useCatalog';
import { colors, radii, spacing } from '../theme/colors';

/**
 * ShopHomeScreen — the welcome page for the shopping experience.
 *
 * The first thing a shopper sees when they choose to browse: a search field, the
 * department tiles (Men, Women, Kids, Watches, Accessories), and a small
 * "best savings" strip. Every tile deep-links into ProductListScreen with the
 * department pre-selected; the list is where filtering and sorting happen.
 */
export default function ShopHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { products } = useCatalog();

  const openList = (params) => navigation.navigate('ProductList', params);

  const onSearch = () => {
    const q = query.trim();
    openList(q ? { query: q, title: `“${q}”` } : { title: 'All' });
  };

  // A short "biggest saving" rail to give the welcome page a merchandised feel.
  const deals = sortProducts(products, 'discount').slice(0, 6);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>KYA PEHNU?</Text>
      <Text style={styles.title}>Shop the city.</Text>
      <Text style={styles.subtitle}>
        Independent Nagpur shops, delivered within the hour. Start with a department
        or search for something specific.
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search shirts, dresses, watches…"
          placeholderTextColor={colors.slate}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        <Pressable style={styles.searchBtn} onPress={onSearch} accessibilityLabel="Search">
          <Text style={styles.searchBtnLabel}>GO</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Departments</Text>
        <Pressable onPress={() => openList({ title: 'All' })} hitSlop={spacing.xs}>
          <Text style={styles.sectionLink}>Browse all →</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {DEPARTMENTS.map((dept) => {
          const cover = departmentCover(dept.key, products);
          const count = departmentCount(dept.key, products);
          return (
            <Pressable
              key={dept.key}
              onPress={() => openList({ department: dept.key, title: dept.label })}
              accessibilityRole="button"
              accessibilityLabel={`${dept.label}, ${count} items`}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            >
              {cover ? (
                <Image source={{ uri: cover }} style={styles.tileImage} contentFit="cover" transition={200} />
              ) : (
                <View style={[styles.tileImage, styles.tileFallback]} />
              )}
              <View style={styles.tileScrim} pointerEvents="none" />
              <View style={styles.tileText}>
                <Text style={styles.tileLabel}>{dept.label}</Text>
                <Text style={styles.tileBlurb} numberOfLines={1}>{dept.blurb}</Text>
                <Text style={styles.tileCount}>{count} pieces</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Best savings today</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealRail}>
        {deals.map((p) => {
          const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
          return (
            <Pressable
              key={p.id}
              onPress={() => navigation.navigate('ProductDetail', { product: p })}
              style={({ pressed }) => [styles.deal, pressed && styles.tilePressed]}
            >
              <Image source={{ uri: p.image }} style={styles.dealImage} contentFit="cover" transition={200} />
              {off ? (
                <View style={styles.dealBadge}><Text style={styles.dealBadgeText}>{off}% OFF</Text></View>
              ) : null}
              <Text style={styles.dealName} numberOfLines={1}>{p.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  content: { paddingHorizontal: spacing.md },
  eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 4, marginBottom: spacing.sm },
  title: { color: colors.ivory, fontSize: 32, fontWeight: '300', letterSpacing: -0.6, marginBottom: spacing.xs },
  subtitle: { color: colors.ash, fontSize: 14, lineHeight: 21, marginBottom: spacing.lg },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  search: {
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
  searchBtn: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.crimsonBright,
  },
  searchBtnLabel: { color: colors.ivory, fontWeight: '700', letterSpacing: 1.5, fontSize: 13 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.ivory, fontSize: 18, fontWeight: '300', letterSpacing: -0.3 },
  sectionLink: { color: colors.gold, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '47.8%',
    flexGrow: 1,
    height: 150,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.charcoal,
  },
  tilePressed: { opacity: 0.85 },
  tileImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  tileFallback: { backgroundColor: colors.charcoalLight },
  tileScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,6,0.42)' },
  tileText: { flex: 1, justifyContent: 'flex-end', padding: spacing.sm },
  tileLabel: { color: colors.ivory, fontSize: 20, fontWeight: '400', letterSpacing: -0.3 },
  tileBlurb: { color: colors.platinum, fontSize: 11, marginTop: 2 },
  tileCount: { color: colors.gold, fontSize: 10, letterSpacing: 0.8, marginTop: 4 },
  dealRail: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.md },
  deal: { width: 120 },
  dealImage: { width: 120, height: 150, borderRadius: radii.md, backgroundColor: colors.charcoalLight },
  dealBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.crimsonBright,
    borderRadius: radii.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  dealBadgeText: { color: colors.ivory, fontSize: 9, fontWeight: '700' },
  dealName: { color: colors.platinum, fontSize: 12, marginTop: 5 },
});
