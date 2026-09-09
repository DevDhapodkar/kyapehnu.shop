import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import PressableScale from '../../components/PressableScale';
import AddGarmentModal from '../../components/vendor/AddGarmentModal';
import QuickRestockModal from '../../components/vendor/QuickRestockModal';
import GarmentPreviewModal from '../../components/vendor/GarmentPreviewModal';
import VendorBottomNav from '../../components/vendor/VendorBottomNav';
import { normalizeColor } from '../../constants/colorPalette';
import { formatCurrency as formatINR } from '../../utils/format';
import { colors, radii, spacing } from '../../theme/colors';
import { useVendorStore } from '../../store/useVendorStore';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * CatalogManagerScreen — Senior-Friendly Stock & Inventory Management
 * Designed specifically for Nagpur Boutique Shopkeepers:
 * - High contrast, large fonts & touch targets (50px+)
 * - Unmistakable "ADD NEW GARMENT" Hero button & Floating Action Capsule
 * - Prominent "IN STOCK" / "OUT OF STOCK" one-touch toggle button
 * - Quick Restock & Sizes stepper modal
 * - Storefront Live Preview on thumbnail tap
 * - Guaranteed safe area layout (zero collisions with header or bottom navigation)
 */
export default function CatalogManagerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const products = useVendorStore((state) => state.products);
  const loading = useVendorStore((state) => state.catalogLoading);
  const loadCatalog = useVendorStore((state) => state.loadCatalog);
  const toggleAvailability = useVendorStore((state) => state.toggleAvailability);
  const addProduct = useVendorStore((state) => state.addProduct);
  const updateProduct = useVendorStore((state) => state.updateProduct);
  const vendorProfile = useAuthStore((state) => state.vendorProfile);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [modalVisible, setModalVisible] = useState(Boolean(route?.params?.openAddModal));
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [restockProduct, setRestockProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  useEffect(() => {
    if (loadCatalog) loadCatalog();
  }, [loadCatalog]);

  const categories = [
    { id: 'ALL', label: 'All Items' },
    { id: 'WOMEN', label: 'Women' },
    { id: 'MEN', label: 'Men' },
    { id: 'KIDS', label: 'Kids' },
    { id: 'UNISEX', label: 'Unisex' },
  ];

  const handleToggleItemStock = async (itemId, currentAvailability) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    try {
      await toggleAvailability(itemId, !currentAvailability);
    } catch (err) {
      Alert.alert('Stock Update Failed', err.message || 'Could not update stock status.');
    }
  };

  const handleAddGarmentSubmit = async (payload) => {
    try {
      await addProduct(payload);
      Alert.alert(
        '✓ Garment Added Successfully',
        `"${payload.name}" has been listed to your boutique catalog!`
      );
    } catch (err) {
      throw err;
    }
  };

  const handleSaveRestock = async ({ productId, sizes, isAvailable }) => {
    try {
      await updateProduct(productId, { sizes, isAvailable });
      Alert.alert('✓ Stock Updated', 'Garment inventory counts saved successfully.');
    } catch (err) {
      Alert.alert('Stock Update Failed', err.message || 'Could not update garment stock.');
    }
  };

  const getItemTotalUnits = (item) => {
    if (Array.isArray(item.sizes)) {
      return item.sizes.reduce(
        (sum, s) => sum + (typeof s === 'object' ? s.stock || 0 : 5),
        0
      );
    }
    return 5;
  };

  const filteredItems = products.filter((it) => {
    const isAvail = Boolean(it.isAvailable ?? it.inStock);
    const totalUnits = getItemTotalUnits(it);
    const isLow = isAvail && totalUnits > 0 && totalUnits <= 3;

    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = isAvail;
    else if (stockFilter === 'LOW_STOCK') matchesStock = isLow;
    else if (stockFilter === 'OUT_OF_STOCK') matchesStock = !isAvail;

    const matchesCat =
      selectedCategory === 'ALL' ||
      it.category?.toUpperCase() === selectedCategory;

    const matchesSearch =
      !searchQuery.trim() ||
      it.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.subCategory?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStock && matchesCat && matchesSearch;
  });

  const inStockCount = products.filter((p) => Boolean(p.isAvailable ?? p.inStock)).length;
  const outOfStockCount = products.filter((p) => !Boolean(p.isAvailable ?? p.inStock)).length;
  const lowStockCount = products.filter((p) => {
    const isAvail = Boolean(p.isAvailable ?? p.inStock);
    const units = getItemTotalUnits(p);
    return isAvail && units > 0 && units <= 3;
  }).length;

  const totalValuation = products.reduce((acc, p) => {
    const units = getItemTotalUnits(p);
    const price = Number(p.price) || 0;
    return acc + price * units;
  }, 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Top Header Bar (In Natural Flow to Prevent Hero Overlap) */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.topBarInner}>
          <PressableScale
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('VendorOrders'))}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back-ios-new" size={18} color={colors.textObsidian} />
          </PressableScale>

          <View style={styles.topBarTitleCol}>
            <Text style={styles.shopName} numberOfLines={1}>
              {vendorProfile?.shopName || 'Nagpur Boutique'}
            </Text>
            <Text style={styles.screenSubtitle}>Boutique Inventory</Text>
          </View>

          <PressableScale
            onPress={() => setModalVisible(true)}
            style={styles.headerAddBtn}
            accessibilityRole="button"
            accessibilityLabel="Add New Garment"
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.headerAddBtnText}>Add Item</Text>
          </PressableScale>
        </View>
      </View>

      {/* 3. Main Product List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCatalog}
            tintColor={colors.accentCrimson}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Senior-Friendly Hero Button: ADD NEW GARMENT */}
            <PressableScale
              onPress={() => setModalVisible(true)}
              style={styles.addPieceHeroCard}
              accessibilityRole="button"
              accessibilityLabel="Add New Garment"
            >
              <View style={styles.addPieceHeroIconWrap}>
                <MaterialIcons name="add-a-photo" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.addPieceHeroTextCol}>
                <Text style={styles.addPieceHeroTitle}>ADD NEW GARMENT / APPAREL</Text>
                <Text style={styles.addPieceHeroSubtitle}>
                  List dresses, tops, denim, sarees & more
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
            </PressableScale>

            {/* Catalog Pulse & Valuation Strip */}
            <View style={styles.valuationBanner}>
              <View style={styles.valuationLeft}>
                <MaterialIcons name="account-balance-wallet" size={20} color={colors.accentGoldDeep} />
                <View>
                  <Text style={styles.valuationLabel}>Total Collection Value</Text>
                  <Text style={styles.valuationAmount}>{formatINR(totalValuation)}</Text>
                </View>
              </View>
              <View style={styles.valuationBadge}>
                <Text style={styles.valuationBadgeText}>{products.length} Listed Styles</Text>
              </View>
            </View>

            {/* Quick Stock Summary Ticker */}
            <View style={styles.tickerRow}>
              <PressableScale
                onPress={() => setStockFilter('ALL')}
                style={[
                  styles.tickerBadge,
                  stockFilter === 'ALL' && { borderColor: colors.accentCrimson, borderWidth: 2 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter all items"
              >
                <MaterialIcons name="checkroom" size={18} color={colors.accentCrimson} />
                <Text style={styles.tickerText}>Total: {products.length}</Text>
              </PressableScale>

              <PressableScale
                onPress={() => setStockFilter(stockFilter === 'IN_STOCK' ? 'ALL' : 'IN_STOCK')}
                style={[
                  styles.tickerBadge,
                  { borderColor: '#15803D', backgroundColor: stockFilter === 'IN_STOCK' ? '#DCFCE7' : '#F0FDF4' },
                  stockFilter === 'IN_STOCK' && { borderWidth: 2 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter in-stock items"
              >
                <MaterialIcons name="check-circle" size={18} color="#15803D" />
                <Text style={[styles.tickerText, { color: '#15803D' }]}>{inStockCount} In Stock</Text>
              </PressableScale>

              {lowStockCount > 0 && (
                <PressableScale
                  onPress={() => setStockFilter(stockFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
                  style={[
                    styles.tickerBadge,
                    { borderColor: '#D97706', backgroundColor: stockFilter === 'LOW_STOCK' ? '#FEF3C7' : '#FFFBEB' },
                    stockFilter === 'LOW_STOCK' && { borderWidth: 2 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Filter low-stock items"
                >
                  <MaterialIcons name="warning" size={18} color="#D97706" />
                  <Text style={[styles.tickerText, { color: '#B45309' }]}>{lowStockCount} Low Stock</Text>
                </PressableScale>
              )}

              {outOfStockCount > 0 && (
                <PressableScale
                  onPress={() => setStockFilter(stockFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
                  style={[
                    styles.tickerBadge,
                    { borderColor: '#B91C1C', backgroundColor: stockFilter === 'OUT_OF_STOCK' ? '#FEE2E2' : '#FEF2F2' },
                    stockFilter === 'OUT_OF_STOCK' && { borderWidth: 2 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Filter out-of-stock items"
                >
                  <MaterialIcons name="pause-circle-filled" size={18} color="#B91C1C" />
                  <Text style={[styles.tickerText, { color: '#B91C1C' }]}>{outOfStockCount} Out of Stock</Text>
                </PressableScale>
              )}
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={22} color={colors.textSlate} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search garments, dresses, tops, denim..."
                placeholderTextColor={colors.textAsh}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <PressableScale onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={colors.textAsh} />
                </PressableScale>
              ) : null}
            </View>

            {/* Category Filter Rail */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsRow}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <PressableScale
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={[
                      styles.catPill,
                      isSelected ? styles.catPillActive : styles.catPillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.catPillText,
                        isSelected && styles.catPillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>

            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Boutique Inventory</Text>
              <Text style={styles.sectionCountText}>
                Showing {filteredItems.length} items
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color={colors.accentCrimson} size="large" />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialIcons name="checkroom" size={54} color={colors.accentGold} />
              <Text style={styles.emptyTitle}>No Garments Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL'
                  ? 'Try adjusting your search or stock filter.'
                  : 'Tap "ADD NEW GARMENT" above to list your boutique collection.'}
              </Text>
              <PressableScale
                onPress={() => setModalVisible(true)}
                style={styles.emptyAddBtn}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add First Garment</Text>
              </PressableScale>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isAvailable = Boolean(item.isAvailable ?? item.inStock);
          const totalUnits = getItemTotalUnits(item);
          const thumbnail = item.images?.[0];

          return (
            <View style={styles.garmentCard}>
              {/* Main Product Info Row */}
              <View style={styles.cardTopRow}>
                {/* Thumbnail (Tap to Preview) */}
                <PressableScale
                  onPress={() => setPreviewProduct(item)}
                  style={styles.thumbnailWrapper}
                  accessibilityRole="button"
                  accessibilityLabel="Preview storefront view"
                >
                  {thumbnail ? (
                    <Image source={{ uri: thumbnail }} style={styles.garmentThumbnail} contentFit="cover" />
                  ) : (
                    <View style={styles.garmentThumbnailFallback}>
                      <MaterialIcons name="checkroom" size={28} color={colors.accentGold} />
                    </View>
                  )}
                  <View style={styles.previewTagSmall}>
                    <MaterialIcons name="visibility" size={12} color="#FFFFFF" />
                  </View>
                </PressableScale>

                <View style={styles.garmentInfoCol}>
                  <Text style={styles.garmentName} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.sellingPriceText}>{formatINR(item.price)}</Text>
                    <Text style={styles.stockBadgeText}>· {totalUnits} Units</Text>
                  </View>

                  {item.material || item.subCategory ? (
                    <Text style={styles.materialSubtitle} numberOfLines={1}>
                      {[item.material, item.subCategory].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}

                  {/* Size chips */}
                  {Array.isArray(item.sizes) && item.sizes.length > 0 && (
                    <View style={styles.sizesRow}>
                      {item.sizes.slice(0, 5).map((sz, idx) => {
                        const label = typeof sz === 'object' ? `${sz.size} (${sz.stock})` : String(sz);
                        return (
                          <View key={idx} style={styles.sizePill}>
                            <Text style={styles.sizePillText}>{label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Color dots */}
                  {Array.isArray(item.colors) && item.colors.length > 0 && (
                    <View style={styles.colorDotsRow}>
                      {item.colors.slice(0, 5).map((col, cIdx) => {
                        const norm = normalizeColor(col);
                        return (
                          <View
                            key={cIdx}
                            style={[styles.colorDot, { backgroundColor: norm.hex }]}
                          />
                        );
                      })}
                      {item.colors.length > 5 ? (
                        <Text style={styles.moreColorsText}>+{item.colors.length - 5}</Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.cardActionsRow}>
                {/* 1. Quick Restock Button */}
                <PressableScale
                  onPress={() => setRestockProduct(item)}
                  style={styles.quickRestockCardBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Quick Restock"
                >
                  <MaterialIcons name="bolt" size={18} color={colors.accentGoldDeep} />
                  <Text style={styles.quickRestockCardBtnText}>Restock / Sizes</Text>
                </PressableScale>

                {/* 2. One-Touch Big Stock Toggle Banner */}
                <PressableScale
                  onPress={() => handleToggleItemStock(item._id, isAvailable)}
                  style={[
                    styles.stockBannerBtn,
                    isAvailable ? styles.stockBannerAvailable : styles.stockBannerOutOfStock,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle stock availability"
                >
                  <MaterialIcons
                    name={isAvailable ? 'check-circle' : 'pause-circle-filled'}
                    size={20}
                    color={isAvailable ? '#15803D' : '#B91C1C'}
                  />
                  <Text
                    style={[
                      styles.stockBannerTitle,
                      isAvailable ? styles.stockTitleAvailable : styles.stockTitleOutOfStock,
                    ]}
                  >
                    {isAvailable ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </PressableScale>
              </View>
            </View>
          );
        }}
      />

      {/* Floating Action Capsule (Add Garment) — Safely Docked Above Bottom Nav */}
      <PressableScale
        onPress={() => setModalVisible(true)}
        style={[styles.floatingAddBtn, { bottom: Math.max(insets.bottom, 16) + 78 }]}
        accessibilityRole="button"
        accessibilityLabel="Add New Garment"
      >
        <MaterialIcons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.floatingAddBtnText}>Add Garment</Text>
      </PressableScale>

      {/* Unified Bottom Navigation */}
      <VendorBottomNav activeTab="stock" navigation={navigation} />

      {/* Add Garment Modal */}
      <AddGarmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddGarmentSubmit}
        shopName={vendorProfile?.shopName || 'Nagpur Boutique'}
      />

      {/* Quick Restock Modal */}
      <QuickRestockModal
        visible={Boolean(restockProduct)}
        product={restockProduct}
        onClose={() => setRestockProduct(null)}
        onSave={handleSaveRestock}
      />

      {/* Garment Preview Modal */}
      <GarmentPreviewModal
        visible={Boolean(previewProduct)}
        product={previewProduct}
        shopName={vendorProfile?.shopName || 'Nagpur Boutique'}
        onClose={() => setPreviewProduct(null)}
        onEditStock={(p) => setRestockProduct(p)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4EFE7',
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
    backgroundColor: 'rgba(244, 239, 231, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.12)',
    zIndex: 50,
  },
  topBarInner: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 2,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCol: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  shopName: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: colors.accentCrimson,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentCrimson,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  headerContainer: {
    gap: 12,
    marginBottom: spacing.xs,
  },
  addPieceHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentCrimson,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radii.xl,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  addPieceHeroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addPieceHeroTextCol: {
    flex: 1,
  },
  addPieceHeroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  addPieceHeroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  valuationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  valuationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  valuationLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSlate,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  valuationAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textObsidian,
    letterSpacing: -0.2,
  },
  valuationBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  valuationBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentGoldDeep,
  },
  tickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  tickerText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  searchInput: {
    flex: 1,
    color: colors.textObsidian,
    fontSize: 14.5,
    fontWeight: '600',
  },
  categoryPillsRow: {
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 2,
    paddingRight: spacing.lg,
  },
  catPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
  },
  catPillActive: {
    backgroundColor: colors.textObsidian,
  },
  catPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  catPillText: {
    color: colors.textSlate,
    fontSize: 12.5,
    fontWeight: '700',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textObsidian,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCountText: {
    color: colors.textSlate,
    fontSize: 12.5,
    fontWeight: '600',
  },
  garmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    marginBottom: spacing.xs,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  garmentThumbnail: {
    width: 85,
    height: 95,
    borderRadius: radii.md,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  garmentThumbnailFallback: {
    width: 85,
    height: 95,
    borderRadius: radii.md,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTagSmall: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(18, 18, 21, 0.7)',
    borderRadius: 6,
    padding: 3,
  },
  garmentInfoCol: {
    flex: 1,
    gap: 4,
  },
  garmentName: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellingPriceText: {
    color: colors.accentCrimson,
    fontSize: 17,
    fontWeight: '900',
  },
  stockBadgeText: {
    color: colors.textSlate,
    fontSize: 13,
    fontWeight: '700',
  },
  materialSubtitle: {
    fontSize: 12,
    color: colors.textAsh,
    fontWeight: '600',
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  sizePill: {
    backgroundColor: '#F1F3F5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  sizePillText: {
    color: colors.textObsidian,
    fontSize: 10.5,
    fontWeight: '700',
  },
  colorDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  colorDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  moreColorsText: {
    fontSize: 11,
    color: colors.textAsh,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  quickRestockCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    backgroundColor: '#FAF9F5',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.28)',
  },
  quickRestockCardBtnText: {
    color: colors.accentGoldDeep,
    fontSize: 12.5,
    fontWeight: '800',
  },
  stockBannerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    borderWidth: 1.5,
  },
  stockBannerAvailable: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
  },
  stockBannerOutOfStock: {
    backgroundColor: '#FEF2F2',
    borderColor: '#B91C1C',
  },
  stockBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  stockTitleAvailable: {
    color: '#15803D',
  },
  stockTitleOutOfStock: {
    color: '#B91C1C',
  },
  floatingAddBtn: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentCrimson,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 9999,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 95,
  },
  floatingAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 12,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textObsidian,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: colors.textSlate,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentCrimson,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radii.full,
    marginTop: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
