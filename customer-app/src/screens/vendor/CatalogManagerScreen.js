import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import BrandLogo from '../../components/BrandLogo';
import PressableScale from '../../components/PressableScale';
import AddGarmentModal from '../../components/vendor/AddGarmentModal';
import QuickRestockModal from '../../components/vendor/QuickRestockModal';
import GarmentPreviewModal from '../../components/vendor/GarmentPreviewModal';
import VendorBottomNav from '../../components/vendor/VendorBottomNav';
import { formatCurrency as formatINR } from '../../utils/format';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';
import { useVendorStore } from '../../store/useVendorStore';
import { useAuthStore } from '../../store/useAuthStore';

// Default curated atelier pieces matching stitch_screens/light_catalogue.html
const ATELIER_FALLBACK_PIECES = [
  {
    _id: 'seed-chanderi-angrakha',
    name: 'Chanderi Silk Angrakha',
    brand: 'Dharampeth Handloom',
    subCategory: 'Angrakhas & Kurtas',
    material: 'Pure Chanderi Silk',
    description: 'Zari hemline with mother-of-pearl potli buttons',
    price: 4800,
    mrp: 6499,
    discount: '26% OFF',
    isAvailable: true,
    featured: true,
    qcVerified: true,
    craftBadge: 'Silk Mark Certified',
    avgDispatchMins: 28,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMWlabxFPf8OWmytnkzR3nyYu8zJNERuWidpx5O-R8CJhYN78dmsIo52x-ISUbH3JlS-GhXhhY-u6258e4Pb03KcAkbCzNqfxwacyKoikzlTYlxsKgj42sX1wfxGdz1TN-d08U4epJRA8N7jk5mEhEn21Yd-xUT1nxhXeytWBT8QbV6TFZUChSmJ0GFsZRIWo1QNlQoNZaJT4ixOPB4nfeTKGQBRQXQI5_gwNuG6wbbLnvoDp1x___wg',
    ],
    sizes: [
      { size: 'XS', stock: 1 },
      { size: 'S', stock: 4 },
      { size: 'M', stock: 2 },
      { size: 'L', stock: 3 },
      { size: 'XL', stock: 0 },
    ],
    colors: [{ name: 'Blush Ivory', hex: '#FAF3E8' }],
  },
  {
    _id: 'seed-tussar-kurta-set',
    name: 'Tussar Silk Kurta Set',
    brand: 'Gandhibagh Looms',
    subCategory: 'Angrakhas & Kurtas',
    material: 'Natural Tussar Silk',
    description: 'Natural golden sheen with hand-woven churidar',
    price: 3450,
    mrp: 4500,
    discount: '23% OFF',
    isAvailable: true,
    qcVerified: true,
    craftBadge: 'SKU: TUS-NGP-04',
    avgDispatchMins: 32,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCyauisEi0-cWeznepNuxNb3uLPwd6cBlwLcuGMspuZAmS9_eN78K0jUDvSw1WXGGIcEB0IUOCBDYvhVKiNZNNCobO5gSips1cPFqFReDrAmhLV3DvjelIGTDCcSxPHIPpP_3BWgXdAkrMlKALyb8uu_ek0zJoH-YHX3gb4JZ4xeq6lH3HlOxb5V88wCQ7pTqI6Jyj20kItgxArE1k0qrRXWJ--HqI0kaAa1VJStL6SBIMNMYo1Je_NHA',
    ],
    sizes: [
      { size: '38', stock: 3 },
      { size: '40', stock: 5 },
      { size: '42', stock: 2 },
    ],
    colors: [{ name: 'Mustard Gold', hex: '#D4AF37' }],
  },
  {
    _id: 'seed-organza-marodi-scarf',
    name: 'Organza Marodi Scarf',
    brand: 'Sadar Heritage',
    subCategory: 'Dupattas & Scarves',
    material: 'Sheer Silk Organza',
    description: 'Metallic pita wire handwork with kiran lace border',
    price: 3140,
    mrp: 3800,
    discount: '17% OFF',
    isAvailable: true,
    qcVerified: true,
    craftBadge: 'Ready Dispatch',
    avgDispatchMins: 22,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCsofT8IfFI-cvLykdUIpCPovw30j3lxkWpqnzFqZvvU2xOh_2PiLjiOlLtGdKp-jTjAJM2KnN07TrhLoo0lQabOsWjAZwOo6nLfVAiOcuRJTR0MJKKc0BLph9-Kig1CS9AAeFh7c6HqAsMnlodq-r_cYL0eSD-ye0i-RwVsb3kUZBiiWksjHC3JbJKwdNWsy1iwQX0_aMQH61QurkV11E_2QSzKfqc_5TPLSV5JMabICNG2sY6q-De3w',
    ],
    sizes: [{ size: 'FREE', stock: 6 }],
    colors: [{ name: 'Sage Green', hex: '#87A987' }],
  },
  {
    _id: 'seed-banarasi-zari-jacket',
    name: 'Raw Silk Banarasi Jacket',
    brand: 'Central Nagpur Atelier',
    subCategory: 'Suits & Sets',
    material: 'Raw Silk & Antique Zari',
    description: 'Deep royal maroon raw silk tailored Nehru jacket',
    price: 5200,
    mrp: 6500,
    discount: '20% OFF',
    isAvailable: false,
    qcVerified: false,
    craftBadge: 'Draft / QC Ingest',
    avgDispatchMins: 35,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCw3pBgAPFCFtZqgoWqJC8EwESzAKFUhLWjc5kzzAVL-ox2M5TeM368PVMYNZTakD1QJM2G-zvu-rpivLTOGGiIVXJZoLVK0waw4Q84zyCK1X9O1xRCyeDh6NCukkapUivD9ViSy3t3m4GriGkqO3sh0ItvwEgcjVbJRkBX8C7E1oZEKsIYIU6zwdAVxkUvx1Rw8ItyCiJPYgO2Rp1POb8GPRLuhEES_OpZF5rP_RnwVpmW5I4Z8tZh9A',
    ],
    sizes: [
      { size: 'M', stock: 0 },
      { size: 'L', stock: 0 },
    ],
    colors: [{ name: 'Royal Maroon', hex: '#630D16' }],
  },
];

const WEAVE_CATEGORIES = [
  { id: 'ALL', label: 'All Weaves' },
  { id: 'ANGRAKHA', label: 'Angrakhas & Kurtas' },
  { id: 'SAREE', label: 'Sarees & Drapes' },
  { id: 'DUPATTA', label: 'Dupattas & Scarves' },
  { id: 'SUIT', label: 'Suits & Sets' },
  { id: 'WESTERN', label: 'Modern & Fusion' },
];

/**
 * CatalogManagerScreen — Stitch-Aligned Inventory Atelier
 * Implements Stitch Screen:
 * - final_light_theme Catalogue Manager (Mobile)
 * - Ivory Studio Luxury & Royal Crimson Noir theme tokens via useTheme()
 * - Official BrandLogo squircle emblem and localized Nagpur header
 * - Atelier Metrics Ribbon (Live & Ready, Low Stock, QC Ingest)
 * - Luxury Garment Cards with editorial portrait thumbnails, price stack, size ledger & dispatch callout
 * - Interactive stock availability switch toggling
 * - 6-Step Ingestion Studio trigger (+ Ingest Piece)
 */
export default function CatalogManagerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const products = useVendorStore((state) => state.products);
  const loading = useVendorStore((state) => state.catalogLoading);
  const loadCatalog = useVendorStore((state) => state.loadCatalog);
  const toggleAvailability = useVendorStore((state) => state.toggleAvailability);
  const addProduct = useVendorStore((state) => state.addProduct);
  const updateProduct = useVendorStore((state) => state.updateProduct);
  const vendorProfile = useAuthStore((state) => state.vendorProfile);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeave, setSelectedWeave] = useState('ALL');
  const [modalVisible, setModalVisible] = useState(Boolean(route?.params?.openAddModal));
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [restockProduct, setRestockProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  useEffect(() => {
    if (loadCatalog) loadCatalog();
  }, [loadCatalog]);

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
        'Piece Ingested Successfully',
        `"${payload.name}" has been submitted for QC and added to your atelier catalog!`
      );
    } catch (err) {
      throw err;
    }
  };

  const handleSaveRestock = async ({ productId, sizes, isAvailable }) => {
    try {
      await updateProduct(productId, { sizes, isAvailable });
      Alert.alert('Stock Updated', 'Garment inventory counts saved successfully.');
    } catch (err) {
      Alert.alert('Stock Update Failed', err.message || 'Could not update garment stock.');
    }
  };

  const getItemTotalUnits = (item) => {
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      return item.sizes.reduce(
        (sum, s) => sum + (typeof s === 'object' ? s.stock || 0 : 5),
        0
      );
    }
    return 5;
  };

  // Merge loaded products with fallback catalog if empty
  const allItems = products && products.length > 0 ? products : ATELIER_FALLBACK_PIECES;

  const inStockCount = allItems.filter((p) => Boolean(p.isAvailable ?? p.inStock)).length;
  const lowStockCount = allItems.filter((p) => {
    const isAvail = Boolean(p.isAvailable ?? p.inStock);
    const units = getItemTotalUnits(p);
    return isAvail && units > 0 && units <= 3;
  }).length;
  const outOfStockCount = allItems.filter((p) => !Boolean(p.isAvailable ?? p.inStock)).length;

  const filteredItems = allItems.filter((it) => {
    const isAvail = Boolean(it.isAvailable ?? it.inStock);
    const totalUnits = getItemTotalUnits(it);
    const isLow = isAvail && totalUnits > 0 && totalUnits <= 3;

    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = isAvail && !isLow;
    else if (stockFilter === 'LOW_STOCK') matchesStock = isLow;
    else if (stockFilter === 'OUT_OF_STOCK') matchesStock = !isAvail;

    let matchesWeave = true;
    if (selectedWeave !== 'ALL') {
      const catText = `${it.category || ''} ${it.subCategory || ''} ${it.name || ''}`.toLowerCase();
      if (selectedWeave === 'ANGRAKHA') {
        matchesWeave = catText.includes('angrakha') || catText.includes('kurta');
      } else if (selectedWeave === 'SAREE') {
        matchesWeave = catText.includes('saree') || catText.includes('drape') || catText.includes('lehenga');
      } else if (selectedWeave === 'DUPATTA') {
        matchesWeave = catText.includes('dupatta') || catText.includes('scarf');
      } else if (selectedWeave === 'SUIT') {
        matchesWeave = catText.includes('suit') || catText.includes('jacket') || catText.includes('sherwani') || catText.includes('set');
      } else if (selectedWeave === 'WESTERN') {
        matchesWeave = catText.includes('dress') || catText.includes('top') || catText.includes('denim') || catText.includes('shirt');
      }
    }

    const matchesSearch =
      !searchQuery.trim() ||
      it.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.subCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.material?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.brand?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStock && matchesWeave && matchesSearch;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.groundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Animated Atmospheric Studio Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Top Header Bar (Stitch Matched) */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 4,
            backgroundColor: isDark ? 'rgba(14, 14, 16, 0.92)' : 'rgba(250, 249, 245, 0.92)',
            borderBottomColor: colors.borderHairline,
          },
        ]}
      >
        <View style={styles.topBarInner}>
          <BrandLogo size="sm" showEmblem={true} />

          {/* Location selector */}
          <PressableScale
            style={[
              styles.locationSelectorBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : (colors.surfaceContainerLow || '#F4F4F0'),
              },
            ]}
          >
            <MaterialIcons name="near-me" size={14} color={colors.accentGold || '#B38A2B'} />
            <Text style={[styles.locationSelectorText, { color: colors.textObsidian }]}>
              {vendorProfile?.address?.area || 'Sitabuldi'}, Nagpur
            </Text>
            <MaterialIcons name="expand-more" size={15} color={colors.textAsh} />
          </PressableScale>

          {/* Profile Avatar with status */}
          <PressableScale
            onPress={() => navigation.navigate('VendorProfile')}
            style={styles.profileAvatarBtn}
            accessibilityRole="button"
            accessibilityLabel="Store Profile"
          >
            <View
              style={[
                styles.profileAvatarCircle,
                {
                  borderColor: isDark ? 'rgba(200, 162, 74, 0.4)' : 'rgba(179, 138, 43, 0.3)',
                  backgroundColor: isDark ? '#222226' : '#FAF9F5',
                },
              ]}
            >
              <MaterialIcons name="storefront" size={16} color={colors.textObsidian} />
            </View>
            <View style={[styles.avatarStatusDot, { backgroundColor: colors.accentCrimson }]} />
          </PressableScale>
        </View>
      </View>

      {/* 3. Main Product Stack */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id || item.name}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Math.max(insets.top + 76, 86),
            paddingBottom: insets.bottom + 120,
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
          <View style={styles.catalogHeader}>
            {/* Atelier Atmospheric Context & Primary Ingest Trigger */}
            <View style={styles.headerContextRow}>
              <View style={styles.headerTitlesCol}>
                <Text style={[styles.atelierEyebrow, { color: colors.accentGold || '#B38A2B' }]}>
                  INVENTORY ATELIER
                </Text>
                <View style={styles.titleWithPulseRow}>
                  <Text style={[styles.atelierTitle, { color: colors.textObsidian }]}>
                    {inStockCount} Curated Pieces Live
                  </Text>
                  <View style={[styles.livePulseDot, { backgroundColor: colors.accentCrimson }]} />
                </View>
              </View>

              {/* Primary Ingest Action Button */}
              <PressableScale
                onPress={() => setModalVisible(true)}
                style={[
                  styles.ingestActionBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.surfaceCard || '#FFFFFF'),
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.borderHairline,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Ingest new piece"
              >
                <MaterialIcons name="add" size={18} color={colors.accentCrimson} />
                <Text style={[styles.ingestActionBtnText, { color: colors.accentCrimson }]}>
                  Ingest Piece
                </Text>
              </PressableScale>
            </View>

            {/* Atelier Metrics Ribbon (3-Column Grid) */}
            <View
              style={[
                styles.metricsRibbonContainer,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : (colors.surfaceContainerLow || '#F4F4F0'),
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <PressableScale
                onPress={() => setStockFilter(stockFilter === 'IN_STOCK' ? 'ALL' : 'IN_STOCK')}
                style={[
                  styles.metricTile,
                  {
                    backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                    borderColor: stockFilter === 'IN_STOCK' ? colors.accentCrimson : 'transparent',
                    borderWidth: stockFilter === 'IN_STOCK' ? 1.5 : 0,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.textObsidian }]}>
                  {inStockCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textAsh }]}>
                  LIVE & READY
                </Text>
              </PressableScale>

              <PressableScale
                onPress={() => setStockFilter(stockFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
                style={[
                  styles.metricTile,
                  {
                    backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                    borderColor: stockFilter === 'LOW_STOCK' ? (colors.accentGold || '#B38A2B') : 'transparent',
                    borderWidth: stockFilter === 'LOW_STOCK' ? 1.5 : 0,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.accentGoldDeep || '#946C18' }]}>
                  {lowStockCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textAsh }]}>
                  LOW STOCK
                </Text>
              </PressableScale>

              <PressableScale
                onPress={() => setStockFilter(stockFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
                style={[
                  styles.metricTile,
                  {
                    backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                    borderColor: stockFilter === 'OUT_OF_STOCK' ? colors.accentCrimson : 'transparent',
                    borderWidth: stockFilter === 'OUT_OF_STOCK' ? 1.5 : 0,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.accentCrimson }]}>
                  {outOfStockCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textAsh }]}>
                  QC INGEST
                </Text>
              </PressableScale>
            </View>

            {/* Search and Atelier Barcode Scan Trigger */}
            <View style={styles.searchScanRow}>
              <View
                style={[
                  styles.searchBarWrap,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.surfaceContainerLow || '#F4F4F0'),
                    borderColor: colors.borderHairline,
                  },
                ]}
              >
                <MaterialIcons name="search" size={20} color={colors.textAsh} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search weave, silhouette, SKU (e.g. Chanderi)..."
                  placeholderTextColor={colors.textAsh}
                  style={[styles.searchInputText, { color: colors.textObsidian }]}
                />
                {searchQuery ? (
                  <PressableScale onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="close" size={18} color={colors.textAsh} />
                  </PressableScale>
                ) : null}
              </View>

              <PressableScale
                style={[
                  styles.scanQrBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                    borderColor: colors.borderHairline,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Scan SKU QR Tag"
              >
                <MaterialIcons name="filter-center-focus" size={20} color={colors.textSlate} />
              </PressableScale>
            </View>

            {/* Category Filter Rail (Pills) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsContainer}
            >
              {WEAVE_CATEGORIES.map((cat) => {
                const isActive = selectedWeave === cat.id;
                return (
                  <PressableScale
                    key={cat.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setSelectedWeave(cat.id);
                    }}
                    style={[
                      styles.weavePill,
                      isActive
                        ? {
                            backgroundColor: isDark ? colors.accentCrimson : colors.textObsidian,
                            borderColor: isDark ? colors.accentCrimson : colors.textObsidian,
                          }
                        : {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                            borderColor: 'transparent',
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.weavePillText,
                        isActive
                          ? { color: '#FFFFFF', fontWeight: '600' }
                          : { color: colors.textSlate },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.accentCrimson} size="large" />
            </View>
          ) : (
            <View
              style={[
                styles.emptyContainer,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <MaterialIcons name="checkroom" size={54} color={colors.accentGold || '#B38A2B'} />
              <Text style={[styles.emptyTitle, { color: colors.textObsidian }]}>
                No Curated Pieces Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textAsh }]}>
                {searchQuery || selectedWeave !== 'ALL' || stockFilter !== 'ALL'
                  ? 'Try adjusting your search query, weave category, or stock status.'
                  : 'Tap "Ingest Piece" above to curate and list your boutique collection.'}
              </Text>
              <PressableScale
                onPress={() => setModalVisible(true)}
                style={[styles.emptyIngestBtn, { backgroundColor: colors.accentCrimson }]}
              >
                <MaterialIcons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.emptyIngestBtnText}>Ingest First Piece</Text>
              </PressableScale>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isAvailable = Boolean(item.isAvailable ?? item.inStock);
          const totalUnits = getItemTotalUnits(item);
          const thumbnail = item.images?.[0];
          const discountStr = item.discount || (item.mrp && item.price && item.mrp > item.price
            ? `${Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF`
            : null);

          return (
            <View
              style={[
                styles.garmentCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              {/* Main Top Editorial Row */}
              <View style={styles.cardTopFlexRow}>
                {/* Editorial Garment Thumbnail */}
                <PressableScale
                  onPress={() => setPreviewProduct(item)}
                  style={[
                    styles.thumbnailContainer,
                    {
                      backgroundColor: isDark ? '#222226' : (colors.surfaceContainerLow || '#F4F4F0'),
                      borderColor: colors.borderHairline,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Preview Piece"
                >
                  {thumbnail ? (
                    <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} contentFit="cover" />
                  ) : (
                    <View style={styles.thumbnailFallback}>
                      <MaterialIcons name="checkroom" size={32} color={colors.accentGold || '#B38A2B'} />
                    </View>
                  )}
                  {item.featured ? (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>Featured</Text>
                    </View>
                  ) : null}
                </PressableScale>

                {/* Garment Context & Price Stack */}
                <View style={styles.cardDetailsCol}>
                  {/* Origin Brand & Availability Switch */}
                  <View style={styles.originAndSwitchRow}>
                    <Text
                      style={[styles.atelierOriginText, { color: colors.accentGold || '#B38A2B' }]}
                      numberOfLines={1}
                    >
                      {item.brand || vendorProfile?.shopName || 'Nagpur Atelier'}
                    </Text>

                    <Switch
                      value={isAvailable}
                      onValueChange={() => handleToggleItemStock(item._id, isAvailable)}
                      trackColor={{
                        false: isDark ? '#2B2B30' : '#E3E2DF',
                        true: colors.accentCrimson,
                      }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={isDark ? '#2B2B30' : '#E3E2DF'}
                      style={styles.availabilitySwitch}
                    />
                  </View>

                  {/* Garment Title */}
                  <Text
                    style={[styles.garmentTitle, { color: colors.textObsidian }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>

                  {/* Subtitle / Detailing */}
                  <Text
                    style={[styles.garmentSubtitle, { color: colors.textAsh }]}
                    numberOfLines={1}
                  >
                    {item.description || item.material || item.subCategory || 'Handcrafted atelier weave'}
                  </Text>

                  {/* Price Row with Tabular Font */}
                  <View style={styles.pricingRow}>
                    <Text style={[styles.priceAmount, { color: colors.accentCrimson }]}>
                      {formatINR(item.price)}
                    </Text>
                    {item.mrp && item.mrp > item.price ? (
                      <Text style={[styles.mrpAmount, { color: colors.textAsh }]}>
                        {formatINR(item.mrp)}
                      </Text>
                    ) : null}
                    {discountStr ? (
                      <Text style={[styles.discountTag, { color: colors.accentGold || '#B38A2B' }]}>
                        {discountStr}
                      </Text>
                    ) : null}
                  </View>

                  {/* Badges & Heritage Stamp */}
                  <View style={styles.badgesFlowRow}>
                    {item.qcVerified !== false ? (
                      <View
                        style={[
                          styles.qcVerifiedBadge,
                          {
                            backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : (colors.groundSubtle || '#F4F3EE'),
                          },
                        ]}
                      >
                        <MaterialIcons name="check-circle" size={11} color={colors.accentGoldDeep || '#946C18'} />
                        <Text style={[styles.qcBadgeText, { color: colors.accentGoldDeep || '#946C18' }]}>
                          QC Verified
                        </Text>
                      </View>
                    ) : null}

                    {item.craftBadge ? (
                      <View
                        style={[
                          styles.craftBadge,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainerLow || '#F4F4F0'),
                          },
                        ]}
                      >
                        <Text style={[styles.craftBadgeText, { color: colors.textSlate }]}>
                          {item.craftBadge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Size Matrix Selector & Real-Time Stock Counts */}
              <View style={[styles.sizeLedgerSection, { borderTopColor: colors.borderHairline }]}>
                <View style={styles.sizeLedgerHeaderRow}>
                  <Text style={[styles.sizeLedgerEyebrow, { color: colors.textAsh }]}>
                    ATELIER SIZING & STOCK LEDGER
                  </Text>
                  {totalUnits <= 3 && isAvailable ? (
                    <Text style={[styles.lowStockWarningText, { color: colors.accentCrimson }]}>
                      Low: {totalUnits} units left
                    </Text>
                  ) : (
                    <Text style={[styles.totalStockCountText, { color: colors.textSlate }]}>
                      {totalUnits} Total Units
                    </Text>
                  )}
                </View>

                {/* Size Pills Row */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sizePillsRow}
                >
                  {Array.isArray(item.sizes) && item.sizes.length > 0 ? (
                    item.sizes.map((sz, sIdx) => {
                      const sizeName = typeof sz === 'object' ? sz.size : String(sz);
                      const sizeCount = typeof sz === 'object' ? sz.stock ?? 5 : 5;
                      const isZero = sizeCount === 0;

                      return (
                        <PressableScale
                          key={sIdx}
                          onPress={() => setRestockProduct(item)}
                          style={[
                            styles.sizeLedgerPill,
                            {
                              backgroundColor: isZero
                                ? (isDark ? 'rgba(255, 255, 255, 0.03)' : (colors.surfaceContainerHighest || '#E3E2DF'))
                                : (isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.groundSubtle || '#F4F3EE')),
                              borderColor: colors.borderHairline,
                              opacity: isZero ? 0.6 : 1,
                            },
                          ]}
                        >
                          <Text style={[styles.sizeLedgerPillName, { color: colors.textObsidian }]}>
                            {sizeName}
                          </Text>
                          <Text
                            style={[
                              styles.sizeLedgerPillCount,
                              {
                                color: isZero
                                  ? colors.textAsh
                                  : sizeCount <= 2
                                  ? colors.accentCrimson
                                  : colors.textSlate,
                              },
                            ]}
                          >
                            {isZero ? 'Out' : `${sizeCount} left`}
                          </Text>
                        </PressableScale>
                      );
                    })
                  ) : (
                    <PressableScale
                      onPress={() => setRestockProduct(item)}
                      style={[
                        styles.sizeLedgerPill,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.groundSubtle || '#F4F3EE'),
                          borderColor: colors.borderHairline,
                        },
                      ]}
                    >
                      <Text style={[styles.sizeLedgerPillName, { color: colors.textObsidian }]}>
                        Standard
                      </Text>
                      <Text style={[styles.sizeLedgerPillCount, { color: colors.textSlate }]}>
                        5 in stock
                      </Text>
                    </PressableScale>
                  )}
                </ScrollView>
              </View>

              {/* Nagpur Hyperlocal Logistics Dispatch Footer */}
              <View
                style={[
                  styles.dispatchFooterRow,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : (colors.surfaceContainerLow || '#F4F4F0'),
                    borderTopColor: colors.borderHairline,
                  },
                ]}
              >
                <View style={styles.dispatchTimeCol}>
                  <MaterialIcons name="schedule" size={14} color={colors.accentCrimson} />
                  <Text style={[styles.dispatchTimeText, { color: colors.textSlate }]}>
                    Avg <Text style={{ fontWeight: '700', color: colors.textObsidian }}>{item.avgDispatchMins || 28} mins</Text> to Dharampeth & Sitabuldi
                  </Text>
                </View>

                <PressableScale
                  onPress={() => setPreviewProduct(item)}
                  style={styles.moreActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Preview details"
                >
                  <MaterialIcons name="visibility" size={17} color={colors.textAsh} />
                </PressableScale>
              </View>
            </View>
          );
        }}
      />

      {/* Floating Action Button (Add Garment) */}
      <PressableScale
        onPress={() => setModalVisible(true)}
        style={[
          styles.floatingActionBtn,
          {
            bottom: Math.max(insets.bottom, 16) + 72,
            backgroundColor: colors.accentCrimson,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Ingest Piece"
      >
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.floatingActionBtnText}>Ingest Piece</Text>
      </PressableScale>

      {/* Unified Bottom Navigation */}
      <VendorBottomNav activeTab="catalog" navigation={navigation} />

      {/* 6-Step Ingestion Studio Modal */}
      <AddGarmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddGarmentSubmit}
        shopName={vendorProfile?.shopName || 'Nagpur Atelier'}
      />

      {/* Quick Restock Modal */}
      <QuickRestockModal
        visible={Boolean(restockProduct)}
        product={restockProduct}
        onClose={() => setRestockProduct(null)}
        onSave={handleSaveRestock}
      />

      {/* Garment Storefront Preview Modal */}
      <GarmentPreviewModal
        visible={Boolean(previewProduct)}
        product={previewProduct}
        shopName={vendorProfile?.shopName || 'Nagpur Atelier'}
        onClose={() => setPreviewProduct(null)}
        onEditStock={(p) => setRestockProduct(p)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  locationSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(18, 18, 20, 0.08)',
  },
  locationSelectorText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  profileAvatarBtn: {
    position: 'relative',
  },
  profileAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStatusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FAF9F5',
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  catalogHeader: {
    marginBottom: spacing.md,
  },
  headerContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  headerTitlesCol: {
    flex: 1,
  },
  atelierEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  titleWithPulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  atelierTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    ...Platform.select({
      web: { fontFamily: '"EB Garamond", serif' },
      ios: { fontFamily: 'Georgia' },
    }),
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  ingestActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(196, 36, 58, 0.12)',
      },
    }),
  },
  ingestActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metricsRibbonContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  metricNumber: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  searchScanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  scanQrBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  weavePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  weavePillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  garmentCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(18, 18, 20, 0.04)',
      },
    }),
  },
  cardTopFlexRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 96,
    height: 128,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(18, 18, 21, 0.85)',
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardDetailsCol: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  originAndSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atelierOriginText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginRight: 6,
  },
  availabilitySwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  garmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginTop: 2,
    ...Platform.select({
      web: { fontFamily: '"EB Garamond", serif' },
      ios: { fontFamily: 'Georgia' },
    }),
  },
  garmentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  mrpAmount: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  discountTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgesFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  qcVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  qcBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  craftBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  craftBadgeText: {
    fontSize: 10,
  },
  sizeLedgerSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  sizeLedgerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sizeLedgerEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  lowStockWarningText: {
    fontSize: 10,
    fontWeight: '600',
  },
  totalStockCountText: {
    fontSize: 10,
  },
  sizePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeLedgerPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 46,
  },
  sizeLedgerPillName: {
    fontSize: 11,
    fontWeight: '700',
  },
  sizeLedgerPillCount: {
    fontSize: 8,
    marginTop: 1,
  },
  dispatchFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  dispatchTimeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dispatchTimeText: {
    fontSize: 11,
  },
  moreActionBtn: {
    padding: 4,
  },
  floatingActionBtn: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radii.full,
    zIndex: 40,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(196, 36, 58, 0.35)',
      },
      default: {
        elevation: 6,
      },
    }),
  },
  floatingActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyIngestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    marginTop: spacing.lg,
  },
  emptyIngestBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
