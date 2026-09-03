import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import PressableScale from '../../components/PressableScale';
import { formatINR } from '../../data/mockStores';
import { colors, radii, spacing } from '../../theme/colors';
import useVendorStore from '../../store/useVendorStore';

/**
 * CatalogManagerScreen — Atelier Inventory Control (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen ca0185e0f8db40b080a15add97d40cac:
 * - Animated drifting ambient background blobs
 * - Floating frosted header with + New Listing action
 * - 3 Inventory Overview Metric Cards: Active, In Review, Low Stock Alerts
 * - Category filter rail with search input
 * - Inventory cards with live in-stock toggles, sizing chips, and edit triggers
 * - Modal to add / edit garments with glass styling
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function CatalogManagerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const catalog = useVendorStore((state) => state.catalog);
  const loadCatalog = useVendorStore((state) => state.loadCatalog);
  const toggleStock = useVendorStore((state) => state.toggleStock);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemSizes, setNewItemSizes] = useState('S, M, L');

  useEffect(() => {
    if (loadCatalog) loadCatalog();
  }, [loadCatalog]);

  const fallbackItems = [
    {
      _id: 'item-1',
      name: 'Handwoven Chanderi Angrakha',
      price: 4800,
      sizes: ['S', 'M', 'L'],
      category: 'chanderi',
      inStock: true,
      stockCount: 8,
    },
    {
      _id: 'item-2',
      name: 'Sculpted Linen Co-ord',
      price: 2890,
      sizes: ['M', 'L'],
      category: 'coords',
      inStock: true,
      stockCount: 4,
    },
    {
      _id: 'item-3',
      name: 'Tussar Silk Kurta',
      price: 3450,
      sizes: ['L', 'XL'],
      category: 'kurtas',
      inStock: true,
      stockCount: 6,
    },
    {
      _id: 'item-4',
      name: 'Tissue Silk Draped Saree',
      price: 6200,
      sizes: ['Free Size'],
      category: 'sarees',
      inStock: false,
      stockCount: 0,
    },
  ];

  const [items, setItems] = useState(
    catalog?.length > 0 ? catalog : fallbackItems
  );

  const categories = [
    { id: 'all', label: 'All (27)' },
    { id: 'chanderi', label: 'Chanderi (8)' },
    { id: 'sarees', label: 'Sarees (12)' },
    { id: 'kurtas', label: 'Kurtas (5)' },
    { id: 'coords', label: 'Co-ords (2)' },
  ];

  const handleToggleItemStock = (itemId) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setItems((prev) =>
      prev.map((it) => (it._id === itemId ? { ...it, inStock: !it.inStock } : it))
    );
    if (toggleStock) {
      toggleStock(itemId);
    }
  };

  const handleCreateItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      Alert.alert('Missing Info', 'Please provide a garment name and price.');
      return;
    }
    const created = {
      _id: `item-${Date.now()}`,
      name: newItemName.trim(),
      price: parseInt(newItemPrice, 10) || 3500,
      sizes: newItemSizes.split(',').map((s) => s.trim()),
      category: 'chanderi',
      inStock: true,
      stockCount: 5,
    };
    setItems((prev) => [created, ...prev]);
    setModalVisible(false);
    setNewItemName('');
    setNewItemPrice('');
    Alert.alert('Listing Created', `${created.name} is now live in Nagpur!`);
  };

  const filteredItems = items.filter((it) => {
    const matchesCat =
      selectedCategory === 'all' || it.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      it.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Top Bar */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarInner} pointerEvents="auto">
          <PressableScale
            onPress={() => navigation.goBack()}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={17}
              color={colors.textObsidian}
            />
          </PressableScale>

          <View style={styles.topBarTitleCol}>
            <Text style={styles.shopName}>Studio Anamika · Nagpur</Text>
            <Text style={styles.screenSubtitle}>Catalogue & Stock</Text>
          </View>

          <PressableScale
            onPress={() => setModalVisible(true)}
            style={styles.newListingBtn}
            accessibilityRole="button"
            accessibilityLabel="New Listing"
          >
            <MaterialIcons name="add" size={15} color="#FFFFFF" />
            <Text style={styles.newListingLabel}>New Piece</Text>
          </PressableScale>
        </View>
      </View>

      {/* 3. Main Body */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* 3 Inventory Metric Cards */}
            <View style={styles.metricCardsRow}>
              <View style={styles.metricCard}>
                <View style={styles.metricIconWrap}>
                  <MaterialIcons
                    name="checkroom"
                    size={16}
                    color={colors.accentGold}
                  />
                </View>
                <Text style={styles.metricValue}>24 Pieces</Text>
                <Text style={styles.metricLabel}>Live & Ready</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconWrap}>
                  <MaterialIcons
                    name="verified"
                    size={16}
                    color={colors.accentCrimson}
                  />
                </View>
                <Text style={styles.metricValue}>3 In Review</Text>
                <Text style={styles.metricLabel}>&lt; 2h QC</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconWrap}>
                  <MaterialIcons
                    name="notifications-active"
                    size={16}
                    color={colors.accentGoldDeep}
                  />
                </View>
                <Text style={styles.metricValue}>2 Low Stock</Text>
                <Text style={styles.metricLabel}>Restock Soon</Text>
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <MaterialIcons
                name="search"
                size={18}
                color={colors.textSlate}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search silhouettes, fabrics..."
                placeholderTextColor={colors.textAsh}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <PressableScale onPress={() => setSearchQuery('')}>
                  <MaterialIcons
                    name="close"
                    size={16}
                    color={colors.textAsh}
                  />
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
                      isSelected ? styles.catPillActive : styles.catPillGlass,
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

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Nagpur Storefront Stock</Text>
              <Text style={styles.sectionSubtitle}>
                Showing {filteredItems.length} pieces
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.inventoryCard}>
            <View style={styles.cardMainRow}>
              <View style={styles.itemInfoCol}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.itemPrice}>
                    {formatINR(item.price)}
                  </Text>
                  <Text style={styles.stockCountText}>
                    {item.stockCount} in studio
                  </Text>
                </View>

                {/* Sizing Chips */}
                <View style={styles.sizesRow}>
                  {item.sizes?.map((sz, sIdx) => (
                    <View key={sIdx} style={styles.sizeChip}>
                      <Text style={styles.sizeChipText}>{sz}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Stock Switch & Edit */}
              <View style={styles.switchCol}>
                <Switch
                  value={item.inStock}
                  onValueChange={() => handleToggleItemStock(item._id)}
                  trackColor={{
                    false: 'rgba(0,0,0,0.1)',
                    true: colors.accentCrimson,
                  }}
                  thumbColor="#FFFFFF"
                />
                <Text style={styles.stockStatusLabel}>
                  {item.inStock ? 'In Stock' : 'Paused'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* 4. New Listing Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Atelier Piece</Text>
              <PressableScale
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <MaterialIcons
                  name="close"
                  size={18}
                  color={colors.textObsidian}
                />
              </PressableScale>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Garment Name</Text>
              <TextInput
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="e.g. Handwoven Zari Angrakha"
                placeholderTextColor={colors.textAsh}
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Price (₹ INR)</Text>
              <TextInput
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                placeholder="e.g. 4800"
                keyboardType="numeric"
                placeholderTextColor={colors.textAsh}
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Available Sizes</Text>
              <TextInput
                value={newItemSizes}
                onChangeText={setNewItemSizes}
                placeholder="e.g. XS, S, M, L"
                placeholderTextColor={colors.textAsh}
                style={styles.modalInput}
              />

              <PressableScale
                onPress={handleCreateItem}
                style={styles.createBtn}
              >
                <Text style={styles.createBtnText}>Publish to Storefront</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
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
    height: 52,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  topBarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCol: {
    alignItems: 'center',
  },
  shopName: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '700',
  },
  screenSubtitle: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '600',
  },
  newListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentCrimson,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  newListingLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  headerContainer: {
    gap: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  metricCardsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.lg,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(18, 18, 20, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricValue: {
    color: colors.textObsidian,
    fontSize: 11.5,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.textAsh,
    fontSize: 9,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  searchInput: {
    flex: 1,
    color: colors.textObsidian,
    fontSize: 12.5,
    paddingVertical: 0,
  },
  categoryPillsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  catPillActive: {
    backgroundColor: colors.textObsidian,
  },
  catPillGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  catPillText: {
    color: colors.textSlate,
    fontSize: 11,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textObsidian,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textAsh,
    fontSize: 11,
  },
  inventoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    marginBottom: spacing.xs,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfoCol: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    color: colors.textObsidian,
    fontSize: 14.5,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
  },
  stockCountText: {
    color: colors.accentGoldDeep,
    fontSize: 11,
    fontWeight: '600',
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  sizeChip: {
    backgroundColor: 'rgba(18, 18, 20, 0.04)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
  },
  sizeChipText: {
    color: colors.textSlate,
    fontSize: 9.5,
    fontWeight: '600',
  },
  switchCol: {
    alignItems: 'center',
    gap: 2,
    paddingLeft: spacing.sm,
  },
  stockStatusLabel: {
    color: colors.textAsh,
    fontSize: 9.5,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.textObsidian,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    gap: spacing.sm,
  },
  inputLabel: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textObsidian,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  createBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 9999,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
