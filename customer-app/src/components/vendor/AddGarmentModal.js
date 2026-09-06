import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import PressableScale from '../PressableScale';
import ColorWheelPicker from './ColorWheelPicker';
import { uploadProductImages } from '../../api/vendorApi';
import { COLOR_PALETTE, normalizeColor } from '../../constants/colorPalette';
import { colors, radii, spacing } from '../../theme/colors';

/**
 * Modern contemporary & Western apparel taxonomy
 */
export const MODERN_SUB_CATEGORIES = {
  WOMEN: [
    'One-Piece Dress',
    'Maxi Dress',
    'Midi Dress',
    'Mini Dress',
    'Bodycon Dress',
    'Jumpsuit / Romper',
    'Tops',
    'Crop Top',
    'Blouse',
    'T-Shirt',
    'Oversized T-Shirt',
    'Tank Top / Camisole',
    'Corset Top',
    'Casual Shirt',
    'Oversized Shirt',
    'Wide Leg Jeans',
    'Straight Fit Jeans',
    'Mom Jeans',
    'Skinny Jeans',
    'Cargo Pants',
    'Trousers',
    'Shorts',
    'Skirts',
    'Co-ord Set',
    'Blazer',
    'Denim Jacket',
    'Hoodie / Sweatshirt',
    'Saree',
    'Kurta / Kurti',
    'Lehenga',
    'Anarkali',
    'Indo-Western Set',
    'Dupatta',
  ],
  MEN: [
    'T-Shirt',
    'Oversized T-Shirt',
    'Graphic Tee',
    'Polo T-Shirt',
    'Casual Shirt',
    'Linen Shirt',
    'Formal Shirt',
    'Oversized Cotton Shirt',
    'Denim Shirt',
    'Straight Fit Jeans',
    'Wide Leg Jeans',
    'Slim Fit Jeans',
    'Cargo Pants',
    'Trousers / Chinos',
    'Shorts',
    'Co-ord Set',
    'Blazer',
    'Denim Jacket',
    'Leather Jacket',
    'Hoodie / Sweatshirt',
    'Kurta',
    'Sherwani',
    'Nehru Jacket',
  ],
  KIDS: [
    'T-Shirt',
    'Dress',
    'Shirt',
    'Jeans',
    'Shorts',
    'Co-ord Set',
    'Jumpsuit',
    'Ethnic Wear',
    'Hoodie / Jacket',
  ],
  UNISEX: [
    'Oversized T-Shirt',
    'Graphic Tee',
    'Hoodie / Sweatshirt',
    'Casual Shirt',
    'Cargo Pants',
    'Wide Leg Jeans',
    'Denim Jacket',
    'Tracksuit / Co-ord',
  ],
};

const FABRIC_PRESETS = [
  'Denim',
  '100% Pure Cotton',
  'French Terry Cotton',
  'Ribbed Knit',
  'Georgette',
  'Chiffon',
  'Satin Silk',
  'Linen Blend',
  'Poplin',
  'Lycra / Elastane',
  'Velvet',
  'Crepe',
  'Leather / Faux Leather',
  'Fleece',
  'Pure Chanderi Silk',
  'Mulmul Cotton',
  'Banarasi Brocade',
];

const PATTERN_PRESETS = [
  'Solid / Plain',
  'Graphic Print',
  'Floral',
  'Striped',
  'Plaid / Checked',
  'Typography Print',
  'Tie-Dye / Ombre',
  'Acid Wash / Distressed',
  'Embroidered',
  'Handblock Printed',
  'Zardozi / Ethnic Work',
];

const FIT_PRESETS = [
  'Oversized',
  'Boxy Fit',
  'Slim Fit',
  'Regular Fit',
  'Relaxed Fit',
  'Wide Leg',
  'Straight Fit',
  'Bodycon',
  'A-Line Flared',
  'Cropped',
  'Tailored',
];

const OCCASION_PRESETS = [
  'Casual / Daily Wear',
  'Party & Night Out',
  'Streetwear & College',
  'Work & Formal',
  'Vacation & Resort',
  'Festive & Wedding',
  'Athleisure & Gym',
];

const SLEEVE_PRESETS = [
  'Half Sleeves',
  'Full Sleeves',
  'Sleeveless',
  'Drop Shoulder',
  'Cap Sleeves',
  'Three-Quarter',
  'Puff Sleeves',
  'Bell Sleeves',
];

const NECK_PRESETS = [
  'Crew Neck / Round',
  'V-Neck',
  'Square Neck',
  'Sweetheart',
  'Polo Collar',
  'Spread Collar',
  'Halter Neck',
  'Turtleneck / High Neck',
  'Hooded',
  'Cowl Neck',
  'Off-Shoulder',
];

const CARE_PRESETS = [
  'Machine Wash Cold',
  'Gentle Cycle',
  'Hand Wash Cold',
  'Dry Clean Only',
  'Tumble Dry Low',
];

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE', '28', '30', '32', '34', '36'];

export default function AddGarmentModal({
  visible,
  onClose,
  onSubmit,
  shopName = 'Nagpur Boutique',
}) {
  const insets = useSafeAreaInsets();

  // Basic Info
  const [name, setName] = useState('');
  const [brand, setBrand] = useState(shopName);
  const [category, setCategory] = useState('WOMEN');
  const [subCategory, setSubCategory] = useState('One-Piece Dress');
  const [description, setDescription] = useState('');

  // Pricing (Selling Price only — MRP defaulted or set on QC)
  const [price, setPrice] = useState('');
  const [netQuantity, setNetQuantity] = useState('1');
  const [countryOfOrigin, setCountryOfOrigin] = useState('India');

  // Sizing & Stock
  const [selectedSizes, setSelectedSizes] = useState([
    { size: 'S', stock: 5 },
    { size: 'M', stock: 8 },
    { size: 'L', stock: 5 },
  ]);

  // Colors & Color Chart
  const [selectedColors, setSelectedColors] = useState([
    { name: 'Obsidian Black', hex: '#121215' },
    { name: 'Heritage Gold', hex: '#D97706' },
  ]);

  // Specifications
  const [material, setMaterial] = useState('100% Pure Cotton');
  const [pattern, setPattern] = useState('Solid / Plain');
  const [fit, setFit] = useState('Regular Fit');
  const [occasion, setOccasion] = useState('Casual / Daily Wear');
  const [sleeve, setSleeve] = useState('Half Sleeves');
  const [neck, setNeck] = useState('Crew Neck / Round');
  const [careInstructions, setCareInstructions] = useState('Machine Wash Cold');

  // Direct Media Uploads (Photos & Videos only - Cloudinary backend)
  const [mediaList, setMediaList] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(false);

  // When category changes, pick sensible default sub-category if current is invalid
  const handleCategoryChange = (newCat) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setCategory(newCat);
    const available = MODERN_SUB_CATEGORIES[newCat] || [];
    if (!available.includes(subCategory) && available.length > 0) {
      setSubCategory(available[0]);
    }
  };

  // Toggle size selection
  const handleToggleSize = (sizeStr) => {
    setSelectedSizes((prev) => {
      const exists = prev.find((s) => s.size === sizeStr);
      if (exists) {
        if (prev.length <= 1) {
          Alert.alert('Size Required', 'At least one size must remain selected.');
          return prev;
        }
        return prev.filter((s) => s.size !== sizeStr);
      }
      return [...prev, { size: sizeStr, stock: 5 }];
    });
  };

  const handleUpdateStock = (sizeStr, delta) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedSizes((prev) =>
      prev.map((s) => {
        if (s.size === sizeStr) {
          const newStock = Math.max(0, (s.stock || 0) + delta);
          return { ...s, stock: newStock };
        }
        return s;
      })
    );
  };

  const handleSetStockDirect = (sizeStr, stockVal) => {
    const parsed = parseInt(stockVal, 10);
    setSelectedSizes((prev) =>
      prev.map((s) =>
        s.size === sizeStr ? { ...s, stock: isNaN(parsed) ? 0 : Math.max(0, parsed) } : s
      )
    );
  };

  // Toggle color from presets
  const handleToggleColor = (paletteItem) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedColors((prev) => {
      const exists = prev.find(
        (c) => c.name.toLowerCase() === paletteItem.name.toLowerCase()
      );
      if (exists) {
        if (prev.length <= 1) {
          Alert.alert('Color Required', 'At least one color must remain selected.');
          return prev;
        }
        return prev.filter(
          (c) => c.name.toLowerCase() !== paletteItem.name.toLowerCase()
        );
      }
      return [...prev, paletteItem];
    });
  };

  const handleRemoveColor = (colToRemove) => {
    setSelectedColors((prev) => {
      if (prev.length <= 1) {
        Alert.alert('Color Required', 'At least one color must remain selected.');
        return prev;
      }
      return prev.filter(
        (c) => c.name.toLowerCase() !== colToRemove.name.toLowerCase()
      );
    });
  };

  // Add color from the interactive Color Wheel Picker
  const handleAddCustomColorFromWheel = (newCol) => {
    const exists = selectedColors.some(
      (c) => c.name.toLowerCase() === newCol.name.toLowerCase() || c.hex.toLowerCase() === newCol.hex.toLowerCase()
    );
    if (!exists) {
      setSelectedColors((prev) => [...prev, newCol]);
    }
  };

  // Direct Media Pickers & Upload Handlers
  const handlePickCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Camera Permission', 'Please grant camera access to capture product photos.');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        await handleUploadAssets(result.assets);
      }
    } catch (err) {
      Alert.alert('Camera Error', err.message || 'Could not open camera.');
    }
  };

  const handlePickGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Gallery Permission', 'Please grant photo library access to upload photos or videos.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        await handleUploadAssets(result.assets);
      }
    } catch (err) {
      Alert.alert('Gallery Error', err.message || 'Could not open photo library.');
    }
  };

  const handleUploadAssets = async (assets) => {
    setUploadingMedia(true);
    try {
      const response = await uploadProductImages(assets);
      const uploaded = (response?.images || []).map((img) => ({
        url: img.url,
        publicId: img.publicId,
        isVideo: img.resourceType === 'video' || img.url?.endsWith('.mp4') || img.url?.endsWith('.mov'),
      }));
      setMediaList((prev) => [...prev, ...uploaded]);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Failed to upload photo/video. Please retry.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = (indexToRemove) => {
    setMediaList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublish = async () => {
    console.log('[handlePublish called]', { name, price, colorsCount: selectedColors?.length, sizesCount: selectedSizes?.length });
    if (!name.trim()) {
      console.warn('[handlePublish validation failed] name is empty');
      Alert.alert('Product Name Required', 'Please enter a name for this garment or outfit.');
      return;
    }
    const cleanPriceStr = String(price).replace(/[^0-9]/g, '');
    const parsedPrice = parseInt(cleanPriceStr, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      console.warn('[handlePublish validation failed] price is invalid:', price);
      Alert.alert('Price Required', 'Please enter a valid selling price in ₹ INR.');
      return;
    }

    if (selectedColors.length === 0) {
      console.warn('[handlePublish validation failed] no colors selected');
      Alert.alert('Color Required', 'Please select at least one available color.');
      return;
    }

    if (selectedSizes.length === 0) {
      console.warn('[handlePublish validation failed] no sizes selected');
      Alert.alert('Size Required', 'Please select at least one available size.');
      return;
    }

    let finalMedia = mediaList;
    if (finalMedia.length === 0) {
      finalMedia = [{
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        publicId: `sample_${Date.now()}`,
        isVideo: false,
      }];
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim() || shopName,
      category: category.toUpperCase(),
      subCategory: subCategory.trim(),
      description: description.trim(),
      price: parsedPrice,
      mrp: Math.round(parsedPrice * 1.25),
      sizes: selectedSizes,
      colors: selectedColors,
      material: material.trim(),
      pattern: pattern.trim(),
      fit: fit.trim(),
      occasion: occasion.trim(),
      sleeve: sleeve.trim(),
      neck: neck.trim(),
      careInstructions: careInstructions.trim(),
      netQuantity: parseInt(netQuantity, 10) || 1,
      countryOfOrigin: countryOfOrigin.trim() || 'India',
      images: finalMedia.map((m) => m.url).filter(Boolean),
      isAvailable: true,
    };

    console.log('[handlePublish executing onSubmit] payload:', payload);
    setLoading(true);
    try {
      await onSubmit(payload);
      console.log('[handlePublish onSubmit SUCCESS]');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onClose();
    } catch (err) {
      console.error('[handlePublish onSubmit ERROR]:', err);
      Alert.alert('Publish Failed', err.message || 'Could not add product to catalog.');
    } finally {
      setLoading(false);
    }
  };

  const activeSubCategories = MODERN_SUB_CATEGORIES[category] || MODERN_SUB_CATEGORIES.WOMEN;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, { paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8 }]}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.modalTitle}>Add Garment to Catalog</Text>
            <Text style={styles.modalSubtitle}>
              {shopName} · Live Catalog & Dispatch Queue
            </Text>
          </View>
          <PressableScale onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close Modal">
            <MaterialIcons name="close" size={22} color={colors.textObsidian} />
          </PressableScale>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: ESSENTIAL IDENTITY & MODERN TAXONOMY */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Garment Identity & Category</Text>
            </View>

            <Text style={styles.fieldLabel}>Product Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Floral Georgette One-Piece, Oversized Cotton Tee, Wide Leg Jeans"
              placeholderTextColor={colors.textAsh}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Brand / Atelier Label</Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder={shopName}
              placeholderTextColor={colors.textAsh}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Department (Gender) *</Text>
            <View style={styles.chipRow}>
              {['WOMEN', 'MEN', 'KIDS', 'UNISEX'].map((cat) => {
                const isActive = category === cat;
                return (
                  <PressableScale
                    key={cat}
                    onPress={() => handleCategoryChange(cat)}
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  >
                    <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Sub-Category *</Text>
            <View style={styles.chipRow}>
              {activeSubCategories.map((sub) => {
                const isActive = subCategory === sub;
                return (
                  <PressableScale
                    key={sub}
                    onPress={() => setSubCategory(sub)}
                    style={[styles.subCategoryPill, isActive && styles.subCategoryPillActive]}
                  >
                    <Text style={[styles.subCategoryPillText, isActive && styles.subCategoryPillTextActive]}>
                      {sub}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Description & Styling Details</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe silhouette, fabric feel, styling suggestions, or unique detailing..."
              placeholderTextColor={colors.textAsh}
              multiline
              numberOfLines={3}
              style={[styles.textInput, styles.textArea]}
            />
          </View>

          {/* SECTION 2: PRICING & SPECIFICATIONS */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Pricing & Retail Package</Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.fieldLabel}>Selling Price (₹ INR) *</Text>
              <View style={styles.currencyInputRow}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="1499"
                  placeholderTextColor={colors.textAsh}
                  keyboardType="numeric"
                  style={styles.priceInput}
                />
              </View>

              {/* Clear Admin MRP Notice */}
              <View style={styles.adminMrpBanner}>
                <MaterialIcons name="verified-user" size={20} color={colors.accentGoldDeep} />
                <View style={styles.adminMrpBannerTextCol}>
                  <Text style={styles.adminMrpBannerTitle}>Standard MRP & QC Calibration</Text>
                  <Text style={styles.adminMrpBannerDesc}>
                    Printed MRP is auto-calibrated with a 25% strike-through discount upon listing approval.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.columnItem}>
                <Text style={styles.fieldLabel}>Net Quantity (Units)</Text>
                <TextInput
                  value={netQuantity}
                  onChangeText={setNetQuantity}
                  placeholder="1"
                  placeholderTextColor={colors.textAsh}
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </View>
              <View style={styles.columnItem}>
                <Text style={styles.fieldLabel}>Country of Origin</Text>
                <TextInput
                  value={countryOfOrigin}
                  onChangeText={setCountryOfOrigin}
                  placeholder="India"
                  placeholderTextColor={colors.textAsh}
                  style={styles.textInput}
                />
              </View>
            </View>
          </View>

          {/* SECTION 3: SIZES & INVENTORY STOCK */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Available Sizes & Stock Inventory</Text>
            </View>
            <Text style={styles.sectionHelperText}>
              Select all sizes currently in stock at your boutique and enter quantity:
            </Text>

            {/* Size Selector Grid */}
            <View style={styles.sizeSelectorRow}>
              {DEFAULT_SIZES.map((sz) => {
                const isSelected = Boolean(selectedSizes.find((s) => s.size === sz));
                return (
                  <PressableScale
                    key={sz}
                    onPress={() => handleToggleSize(sz)}
                    style={[styles.sizeTile, isSelected && styles.sizeTileActive]}
                  >
                    <Text style={[styles.sizeTileText, isSelected && styles.sizeTileTextActive]}>
                      {sz}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {/* Stock Count Stepper Rows */}
            <View style={styles.stockCountersContainer}>
              <Text style={styles.stockCountersHeader}>Boutique Piece Count:</Text>
              {selectedSizes.map((item) => (
                <View key={item.size} style={styles.stockCounterRow}>
                  <View style={styles.stockSizePill}>
                    <Text style={styles.stockSizePillText}>{item.size}</Text>
                  </View>

                  <Text style={styles.stockCounterLabel}>Available Pieces:</Text>

                  {/* Stepper controls */}
                  <View style={styles.stepperWrap}>
                    <PressableScale
                      onPress={() => handleUpdateStock(item.size, -1)}
                      style={styles.stepperBtn}
                      accessibilityLabel="Decrease count"
                    >
                      <MaterialIcons name="remove" size={18} color={colors.textObsidian} />
                    </PressableScale>

                    <TextInput
                      value={String(item.stock)}
                      onChangeText={(val) => handleSetStockDirect(item.size, val)}
                      keyboardType="numeric"
                      style={styles.stepperInput}
                    />

                    <PressableScale
                      onPress={() => handleUpdateStock(item.size, 1)}
                      style={styles.stepperBtn}
                      accessibilityLabel="Increase count"
                    >
                      <MaterialIcons name="add" size={18} color={colors.textObsidian} />
                    </PressableScale>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 4: COLOR PALETTE & INTERACTIVE COLOR WHEEL */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Color Palette & Custom Shade</Text>
            </View>
            <Text style={styles.sectionHelperText}>
              Select available colors from popular presets or spin the visual Color Wheel below:
            </Text>

            {/* Active Selected Colors Bar */}
            <View style={styles.selectedColorsBox}>
              <Text style={styles.selectedColorsTitle}>
                Selected Colors ({selectedColors.length}):
              </Text>
              <View style={styles.selectedColorsPillsRow}>
                {selectedColors.map((col) => {
                  const norm = normalizeColor(col);
                  return (
                    <View key={norm.name + norm.hex} style={styles.activeColorPill}>
                      <View style={[styles.activeColorDot, { backgroundColor: norm.hex }]} />
                      <Text style={styles.activeColorPillName}>{norm.name}</Text>
                      <PressableScale
                        onPress={() => handleRemoveColor(col)}
                        hitSlop={8}
                        style={styles.removeColorIconBtn}
                        accessibilityLabel={`Remove ${norm.name}`}
                      >
                        <MaterialIcons name="close" size={14} color={colors.textSlate} />
                      </PressableScale>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Curated Popular Shades Grid */}
            <Text style={styles.subSectionTitle}>Popular Fashion Shades (Tap to Select):</Text>
            <View style={styles.colorPaletteGrid}>
              {COLOR_PALETTE.map((item) => {
                const isSelected = selectedColors.some(
                  (c) => c.name.toLowerCase() === item.name.toLowerCase()
                );
                return (
                  <PressableScale
                    key={item.name}
                    onPress={() => handleToggleColor(item)}
                    style={[
                      styles.paletteColorCard,
                      isSelected && styles.paletteColorCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.paletteSwatchCircle,
                        {
                          backgroundColor: item.hex,
                          borderColor: item.border || 'rgba(0, 0, 0, 0.15)',
                        },
                      ]}
                    >
                      {isSelected ? (
                        <MaterialIcons
                          name="check"
                          size={16}
                          color={item.hex === '#F9F6F0' ? '#121215' : '#FFFFFF'}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.paletteColorName,
                        isSelected && styles.paletteColorNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {/* Interactive Color Wheel Section */}
            <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>Visual Color Wheel & Custom Shade:</Text>
            <ColorWheelPicker onAddColor={handleAddCustomColorFromWheel} />
          </View>

          {/* SECTION 5: FABRIC, FIT & GARMENT SPECIFICATIONS */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Fabric & Garment Specifications</Text>
            </View>

            <Text style={styles.fieldLabel}>Material / Fabric *</Text>
            <View style={styles.chipRow}>
              {FABRIC_PRESETS.map((f) => (
                <PressableScale
                  key={f}
                  onPress={() => setMaterial(f)}
                  style={[styles.specPill, material === f && styles.specPillActive]}
                >
                  <Text style={[styles.specPillText, material === f && styles.specPillTextActive]}>
                    {f}
                  </Text>
                </PressableScale>
              ))}
            </View>
            <TextInput
              value={material}
              onChangeText={setMaterial}
              placeholder="Or enter custom fabric name..."
              placeholderTextColor={colors.textAsh}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Pattern / Print</Text>
            <View style={styles.chipRow}>
              {PATTERN_PRESETS.map((p) => (
                <PressableScale
                  key={p}
                  onPress={() => setPattern(p)}
                  style={[styles.specPill, pattern === p && styles.specPillActive]}
                >
                  <Text style={[styles.specPillText, pattern === p && styles.specPillTextActive]}>
                    {p}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Fit Type</Text>
            <View style={styles.chipRow}>
              {FIT_PRESETS.map((item) => (
                <PressableScale
                  key={item}
                  onPress={() => setFit(item)}
                  style={[styles.specPill, fit === item && styles.specPillActive]}
                >
                  <Text style={[styles.specPillText, fit === item && styles.specPillTextActive]}>
                    {item}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Occasion</Text>
            <View style={styles.chipRow}>
              {OCCASION_PRESETS.map((item) => (
                <PressableScale
                  key={item}
                  onPress={() => setOccasion(item)}
                  style={[styles.specPill, occasion === item && styles.specPillActive]}
                >
                  <Text style={[styles.specPillText, occasion === item && styles.specPillTextActive]}>
                    {item}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Sleeve Style</Text>
            <View style={styles.chipRow}>
              {SLEEVE_PRESETS.map((s) => (
                <PressableScale
                  key={s}
                  onPress={() => setSleeve(s)}
                  style={[styles.specPill, sleeve === s && styles.specPillActive]}
                >
                  <Text style={[styles.specPillText, sleeve === s && styles.specPillTextActive]}>
                    {s}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Neckline / Collar</Text>
            <View style={styles.chipRow}>
              {NECK_PRESETS.map((n) => (
                <PressableScale
                  key={n}
                  onPress={() => setNeck(n)}
                  style={[styles.specPill, neck === n && styles.specPillActive]}
                >
                  <Text style={[styles.specPillText, neck === n && styles.specPillTextActive]}>
                    {n}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Care Instructions</Text>
            <View style={styles.chipRow}>
              {CARE_PRESETS.map((c) => (
                <PressableScale
                  key={c}
                  onPress={() => setCareInstructions(c)}
                  style={[styles.specPill, careInstructions === c && styles.specPillActive]}
                >
                  <Text style={[styles.specPillText, careInstructions === c && styles.specPillTextActive]}>
                    {c}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>

          {/* SECTION 6: PHOTO & VIDEO UPLOAD */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>6</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Product Photography & Video</Text>
            </View>
            <Text style={styles.sectionHelperText}>
              Snap high-res photos or short videos of the garment directly on your phone:
            </Text>

            {/* Big Action Buttons */}
            <View style={styles.mediaUploadButtonsCol}>
              <PressableScale
                onPress={handlePickCamera}
                disabled={uploadingMedia}
                style={[styles.mediaActionBtn, styles.cameraBtn]}
                accessibilityRole="button"
                accessibilityLabel="Capture photo with camera"
              >
                <MaterialIcons name="photo-camera" size={24} color="#FFFFFF" />
                <Text style={styles.mediaActionBtnTextWhite}>📸 Take Photo / Video (Camera)</Text>
              </PressableScale>

              <PressableScale
                onPress={handlePickGallery}
                disabled={uploadingMedia}
                style={[styles.mediaActionBtn, styles.galleryBtn]}
                accessibilityRole="button"
                accessibilityLabel="Choose from photo library"
              >
                <MaterialIcons name="photo-library" size={24} color={colors.textObsidian} />
                <Text style={styles.mediaActionBtnTextDark}>🖼️ Choose from Gallery (Photo / Video)</Text>
              </PressableScale>

              <PressableScale
                onPress={() => {
                  const sampleImages = [
                    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
                  ];
                  const randomSample = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                  setMediaList((prev) => [
                    ...prev,
                    { url: randomSample, publicId: `sample_${Date.now()}`, isVideo: false },
                  ]);
                }}
                disabled={uploadingMedia}
                style={[
                  styles.mediaActionBtn,
                  { backgroundColor: '#FDF2F4', borderWidth: 1.5, borderColor: '#FECDD3' },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Use studio sample photo"
              >
                <MaterialIcons name="auto-awesome" size={22} color={colors.accentCrimson} />
                <Text style={[styles.mediaActionBtnTextDark, { color: colors.accentCrimson, fontWeight: '600' }]}>
                  ✨ Use Studio Lookbook Photo
                </Text>
              </PressableScale>
            </View>

            {/* Uploading Status Banner */}
            {uploadingMedia ? (
              <View style={styles.uploadingProgressCard}>
                <ActivityIndicator size="small" color={colors.accentCrimson} />
                <Text style={styles.uploadingProgressText}>
                  Uploading media to cloud storage...
                </Text>
              </View>
            ) : null}

            {/* Uploaded Media Previews */}
            {mediaList.length > 0 ? (
              <View style={styles.mediaGallerySection}>
                <Text style={styles.mediaGalleryHeader}>
                  Uploaded Media ({mediaList.length} items):
                </Text>
                <View style={styles.mediaThumbnailsRow}>
                  {mediaList.map((item, idx) => (
                    <View key={item.url || idx} style={styles.mediaThumbnailBox}>
                      <Image
                        source={{ uri: item.url }}
                        style={styles.mediaThumbnailImg}
                        contentFit="cover"
                      />
                      {item.isVideo ? (
                        <View style={styles.videoBadgeTag}>
                          <MaterialIcons name="videocam" size={13} color="#FFFFFF" />
                          <Text style={styles.videoBadgeTagText}>VIDEO</Text>
                        </View>
                      ) : null}
                      <PressableScale
                        onPress={() => handleRemoveMedia(idx)}
                        style={styles.deleteMediaCircleBtn}
                        accessibilityLabel="Delete media"
                      >
                        <MaterialIcons name="close" size={14} color="#FFFFFF" />
                      </PressableScale>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noMediaPlaceholder}>
                <MaterialIcons name="add-photo-alternate" size={38} color={colors.accentGold} />
                <Text style={styles.noMediaPlaceholderTitle}>No photos attached yet</Text>
                <Text style={styles.noMediaPlaceholderSubtitle}>
                  Capture or choose at least 1 image showing the outfit clearly.
                </Text>
              </View>
            )}
          </View>

          {/* FINAL PUBLISH CTA BUTTON */}
          <PressableScale
            onPress={handlePublish}
            disabled={loading || uploadingMedia}
            style={[
              styles.bigPublishBtn,
              (loading || uploadingMedia) && styles.bigPublishBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Publish Product to Catalog"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="cloud-upload" size={26} color="#FFFFFF" />
                <Text style={styles.bigPublishBtnText}>Publish Product to Catalog</Text>
              </>
            )}
          </PressableScale>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(217, 119, 6, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  headerTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textObsidian,
    letterSpacing: 0.2,
  },
  modalSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSlate,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.md,
    gap: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.xs,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textObsidian,
    letterSpacing: 0.3,
  },
  sectionHelperText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginVertical: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textObsidian,
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: '#FAFAF8',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14.5,
    color: colors.textObsidian,
    fontWeight: '600',
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 2,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    backgroundColor: '#FAFAF8',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  categoryPillActive: {
    backgroundColor: colors.textObsidian,
    borderColor: colors.textObsidian,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSlate,
    letterSpacing: 0.5,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  subCategoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: '#FAFAF8',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  subCategoryPillActive: {
    backgroundColor: colors.accentCrimson,
    borderColor: colors.accentCrimson,
  },
  subCategoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSlate,
  },
  subCategoryPillTextActive: {
    color: '#FFFFFF',
  },
  priceContainer: {
    backgroundColor: '#FDFBF7',
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rupeeSymbol: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.accentCrimson,
  },
  priceInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: colors.accentCrimson,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  adminMrpBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    padding: 10,
    borderRadius: radii.md,
  },
  adminMrpBannerTextCol: {
    flex: 1,
  },
  adminMrpBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.accentGoldDeep,
  },
  adminMrpBannerDesc: {
    fontSize: 11.5,
    color: colors.textSlate,
    lineHeight: 16,
    marginTop: 2,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  columnItem: {
    flex: 1,
  },
  sizeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  sizeTile: {
    minWidth: 46,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: '#FAFAF8',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sizeTileActive: {
    backgroundColor: colors.textObsidian,
    borderColor: colors.textObsidian,
  },
  sizeTileText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSlate,
  },
  sizeTileTextActive: {
    color: '#FFFFFF',
  },
  stockCountersContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: 8,
    gap: 8,
  },
  stockCountersHeader: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  stockCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9F7F2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.md,
  },
  stockSizePill: {
    minWidth: 36,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.textObsidian,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  stockSizePillText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12.5,
  },
  stockCounterLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSlate,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    width: 44,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: colors.textObsidian,
    padding: 0,
  },
  selectedColorsBox: {
    backgroundColor: '#FDFBF7',
    borderRadius: radii.lg,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    marginVertical: 6,
  },
  selectedColorsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentGoldDeep,
    marginBottom: 6,
  },
  selectedColorsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeColorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingLeft: 7,
    paddingRight: 8,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  activeColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  activeColorPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  removeColorIconBtn: {
    marginLeft: 2,
  },
  subSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textObsidian,
    marginTop: 6,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paletteColorCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFAF8',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  paletteColorCardSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.accentGoldDeep,
  },
  paletteSwatchCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteColorName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  paletteColorNameSelected: {
    color: colors.textObsidian,
    fontWeight: '800',
  },
  specPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: '#FAFAF8',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  specPillActive: {
    backgroundColor: colors.textObsidian,
    borderColor: colors.textObsidian,
  },
  specPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSlate,
  },
  specPillTextActive: {
    color: '#FFFFFF',
  },
  mediaUploadButtonsCol: {
    gap: 10,
    marginTop: 6,
  },
  mediaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1.5,
  },
  cameraBtn: {
    backgroundColor: colors.accentCrimson,
    borderColor: colors.accentCrimson,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  galleryBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mediaActionBtnTextWhite: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mediaActionBtnTextDark: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  uploadingProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(196, 36, 58, 0.2)',
    marginTop: 10,
  },
  uploadingProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentCrimson,
  },
  mediaGallerySection: {
    marginTop: 12,
  },
  mediaGalleryHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textObsidian,
    marginBottom: 8,
  },
  mediaThumbnailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaThumbnailBox: {
    width: 88,
    height: 98,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  mediaThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  videoBadgeTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  deleteMediaCircleBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: '#FDFBF7',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    gap: 6,
    marginTop: 8,
  },
  noMediaPlaceholderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textObsidian,
    marginTop: 2,
  },
  noMediaPlaceholderSubtitle: {
    fontSize: 12,
    color: colors.textSlate,
    textAlign: 'center',
  },
  bigPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accentCrimson,
    paddingVertical: 16,
    borderRadius: radii.lg,
    marginTop: spacing.sm,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  bigPublishBtnDisabled: {
    opacity: 0.6,
  },
  bigPublishBtnText: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
