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
import VendorBottomNav from '../../components/vendor/VendorBottomNav';
import { normalizeColor } from '../../constants/colorPalette';
import { formatCurrency as formatINR } from '../../utils/format';
import { colors, radii, spacing } from '../../theme/colors';
import { useVendorStore } from '../../store/useVendorStore';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * CatalogManagerScreen — Senior-Friendly Stock & Inventory Management
 * Designed specifically for 50-60 year old Indian shopkeeper uncles:
 * - High contrast, large fonts & touch targets (50px+)
 * - Unmistakable "+ NAYA KAPDA JODEIN" Hero button & Floating Action Button
 * - Prominent "DUKAAN MEIN HAI" / "STOCK KHATAM" one-touch toggle button
 * - Clean bilingual wording
 * - Seamless Cloudinary-backed Add Garment modal
 */
export default function CatalogManagerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const products = useVendorStore((state) => state.products);
  const loading = useVendorStore((state) => state.catalogLoading);
  const loadCatalog = useVendorStore((state) => state.loadCatalog);
  const toggleAvailability = useVendorStore((state) => state.toggleAvailability);
  const addProduct = useVendorStore((state) => state.addProduct);
  const vendorProfile = useAuthStore((state) => state.vendorProfile);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [modalVisible, setModalVisible] = useState(Boolean(route?.params?.openAddModal));

  useEffect(() => {
    if (loadCatalog) loadCatalog();
  }, [loadCatalog]);

  const categories = [
    { id: 'ALL', label: 'Sabhi (All)' },
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
      Alert.alert('Stock Update Failed', err.message || 'Stock update nahi ho saka.');
    }
  };

  const handleAddGarmentSubmit = async (payload) => {
    try {
      await addProduct(payload);
      Alert.alert(
        '✓ Kapda Jod Diya Gaya',
        `"${payload.name}" dukan catalog mein jod diya gaya hai!`
      );
    } catch (err) {
      throw err;
    }
  };

  const filteredItems = products.filter((it) => {
    const matchesCat =
      selectedCategory === 'ALL' ||
      it.category?.toUpperCase() === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      it.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.subCategory?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const inStockCount = products.filter((p) => p.isAvailable).length;
  const outOfStockCount = products.filter((p) => !p.isAvailable).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Top Header Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <View style={styles.topBarInner}>
          <PressableScale
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Peeche jayein"
          >
            <MaterialIcons name="arrow-back-ios-new" size={18} color={colors.textObsidian} />
          </PressableScale>

          <View style={styles.topBarTitleCol}>
            <Text style={styles.shopName} numberOfLines={1}>
              {vendorProfile?.shopName || 'Nagpur Boutique'}
            </Text>
            <Text style={styles.screenSubtitle}>👗 Mera Stock & Inventory</Text>
          </View>

          <PressableScale
            onPress={() => setModalVisible(true)}
            style={styles.headerAddBtn}
            accessibilityRole="button"
            accessibilityLabel="Naya kapda jodein"
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.headerAddBtnText}>+ Naya</Text>
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
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + 95,
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
            {/* Senior-Friendly Hero Button: + NAYA KAPDA JODEIN */}
            <PressableScale
              onPress={() => setModalVisible(true)}
              style={styles.addPieceHeroCard}
              accessibilityRole="button"
              accessibilityLabel="Naya Kapda Jodein"
            >
              <View style={styles.addPieceHeroIconWrap}>
                <MaterialIcons name="add-a-photo" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.addPieceHeroTextCol}>
                <Text style={styles.addPieceHeroTitle}>+ NAYA KAPDA / SAREE JODEIN</Text>
                <Text style={styles.addPieceHeroSubtitle}>
                  Photo kheenchein aur dukan par chadhayein
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
            </PressableScale>

            {/* Quick Stock Summary Ticker */}
            <View style={styles.tickerRow}>
              <View style={styles.tickerBadge}>
                <MaterialIcons name="checkroom" size={18} color={colors.accentCrimson} />
                <Text style={styles.tickerText}>Total: {products.length} Piece</Text>
              </View>
              <View style={[styles.tickerBadge, { borderColor: '#15803D', backgroundColor: '#F0FDF4' }]}>
                <MaterialIcons name="check-circle" size={18} color="#15803D" />
                <Text style={[styles.tickerText, { color: '#15803D' }]}>{inStockCount} Dukan Mein Hai</Text>
              </View>
              {outOfStockCount > 0 && (
                <View style={[styles.tickerBadge, { borderColor: '#B91C1C', backgroundColor: '#FEF2F2' }]}>
                  <MaterialIcons name="pause-circle-filled" size={18} color="#B91C1C" />
                  <Text style={[styles.tickerText, { color: '#B91C1C' }]}>{outOfStockCount} Khatam</Text>
                </View>
              )}
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={22} color={colors.textSlate} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Kapda, saree ya fabric dhoondhein..."
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
              <Text style={styles.sectionTitle}>Dukan Ka Stock</Text>
              <Text style={styles.sectionCountText}>
                {filteredItems.length} Piece Dikha Rahe Hain
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
              <Text style={styles.emptyTitle}>Koi Kapda Nahi Mila</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'Search ya filter badal kar dekhein.'
                  : 'Upar diye gaye "+ NAYA KAPDA JODEIN" button se apni dukan ke kapde jodein.'}
              </Text>
              <PressableScale
                onPress={() => setModalVisible(true)}
                style={styles.emptyAddBtn}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>+ Pehla Kapda Jodein</Text>
              </PressableScale>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isAvailable = Boolean(item.isAvailable ?? item.inStock);
          const totalUnits = Array.isArray(item.sizes)
            ? item.sizes.reduce(
                (sum, s) => sum + (typeof s === 'object' ? s.stock || 0 : 5),
                0
              )
            : 0;
          const thumbnail = item.images?.[0];

          return (
            <View style={styles.garmentCard}>
              {/* Main Product Info Row */}
              <View style={styles.cardTopRow}>
                {/* Thumbnail */}
                {thumbnail ? (
                  <Image source={{ uri: thumbnail }} style={styles.garmentThumbnail} contentFit="cover" />
                ) : (
                  <View style={styles.garmentThumbnailFallback}>
                    <MaterialIcons name="checkroom" size={28} color={colors.accentGold} />
                  </View>
                )}

                <View style={styles.garmentInfoCol}>
                  <Text style={styles.garmentName} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.sellingPriceText}>{formatINR(item.price)}</Text>
                    <Text style={styles.stockBadgeText}>· {totalUnits} Piece</Text>
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

              {/* One-Touch Big Stock Toggle Banner (Designed for Uncles) */}
              <PressableScale
                onPress={() => handleToggleItemStock(item._id, isAvailable)}
                style={[
                  styles.stockBannerBtn,
                  isAvailable ? styles.stockBannerAvailable : styles.stockBannerOutOfStock,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Stock badlein"
              >
                <MaterialIcons
                  name={isAvailable ? 'check-circle' : 'pause-circle-filled'}
                  size={24}
                  color={isAvailable ? '#15803D' : '#B91C1C'}
                />
                <View style={styles.stockBannerTextCol}>
                  <Text
                    style={[
                      styles.stockBannerTitle,
                      isAvailable ? styles.stockTitleAvailable : styles.stockTitleOutOfStock,
                    ]}
                  >
                    {isAvailable ? '✓ DUKAAN MEIN HAI (In Stock)' : '✕ STOCK KHATAM (Out of Stock)'}
                  </Text>
                  <Text style={styles.stockBannerSub}>
                    {isAvailable
                      ? 'Grahak ise order kar sakte hain. Tap karein band karne ke liye.'
                      : 'Grahak ise nahi dekh sakte. Dukan mein aane par tap karein.'}
                  </Text>
                </View>
              </PressableScale>
            </View>
          );
        }}
      />

      {/* Floating Action Button (+ Naya Kapda) */}
      <PressableScale
        onPress={() => setModalVisible(true)}
        style={[styles.floatingAddBtn, { bottom: insets.bottom + 70 }]}
        accessibilityRole="button"
        accessibilityLabel="Naya Kapda Jodein"
      >
        <MaterialIcons name="add" size={26} color="#FFFFFF" />
        <Text style={styles.floatingAddBtnText}>+ NAYA KAPDA</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4EFE7',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
  },
  topBarInner: {
    height: 54,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 2,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
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
    paddingVertical: 2,
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
  stockBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  stockBannerAvailable: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
  },
  stockBannerOutOfStock: {
    backgroundColor: '#FEF2F2',
    borderColor: '#B91C1C',
  },
  stockBannerTextCol: {
    flex: 1,
  },
  stockBannerTitle: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  stockTitleAvailable: {
    color: '#15803D',
  },
  stockTitleOutOfStock: {
    color: '#B91C1C',
  },
  stockBannerSub: {
    fontSize: 11.5,
    color: colors.textSlate,
    marginTop: 1,
  },
  floatingAddBtn: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentCrimson,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 9999,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 90,
  },
  floatingAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
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
