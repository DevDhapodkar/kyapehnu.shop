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
import { uploadProductImages } from '../../api/vendorApi';
import { COLOR_PALETTE, normalizeColor } from '../../constants/colorPalette';
import { colors, radii, spacing } from '../../theme/colors';

const FABRIC_PRESETS = [
  'Pure Chanderi Silk',
  'Mulmul Cotton',
  'Raw Silk',
  'Organic Linen',
  'Banarasi Brocade',
  'Tussar Silk',
  'Khadi Cotton',
  'Georgette',
];

const PATTERN_PRESETS = [
  'Solid',
  'Handblock Printed',
  'Zardozi Embroidered',
  'Chikankari',
  'Bandhani',
  'Woven Jacquard',
  'Striped',
  'Floral',
];

const FIT_PRESETS = [
  'Regular Fit',
  'Slim Fit',
  'A-Line Flared',
  'Relaxed Fit',
  'Oversized',
  'Tailored',
];

const OCCASION_PRESETS = [
  'Festive & Wedding',
  'Evening Soirée',
  'Casual Daywear',
  'Formal / Office',
  'Ceremonial',
];

const SLEEVE_PRESETS = [
  'Full Sleeves',
  'Three-Quarter',
  'Half Sleeves',
  'Sleeveless',
];

const NECK_PRESETS = [
  'Angrakha V-Neck',
  'Mandarin / Bandhgala',
  'Round Neck',
  'Sweetheart',
  'Collar',
];

const CARE_PRESETS = [
  'Dry Clean Only',
  'Gentle Hand Wash Cold',
  'Machine Wash Cold',
];

const SUB_CATEGORIES = [
  'Kurta',
  'Sari',
  'Lehenga',
  'Dress',
  'Co-ord',
  'Shirt',
  'Trousers',
  'Jacket',
  'Sherwani',
  'Dupatta',
];

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE'];

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
  const [subCategory, setSubCategory] = useState('Kurta');
  const [description, setDescription] = useState('');

  // Pricing (Selling Price only — MRP set by Admin on approval)
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
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#');

  // Specifications
  const [material, setMaterial] = useState('Pure Chanderi Silk');
  const [pattern, setPattern] = useState('Zardozi Embroidered');
  const [fit, setFit] = useState('Regular Fit');
  const [occasion, setOccasion] = useState('Festive & Wedding');
  const [sleeve, setSleeve] = useState('Full Sleeves');
  const [neck, setNeck] = useState('Angrakha V-Neck');
  const [careInstructions, setCareInstructions] = useState('Dry Clean Only');

  // Direct Media Uploads (Photos & Videos only - Cloudinary backend)
  const [mediaList, setMediaList] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toggle size selection
  const handleToggleSize = (sizeStr) => {
    setSelectedSizes((prev) => {
      const exists = prev.find((s) => s.size === sizeStr);
      if (exists) {
        if (prev.length <= 1) {
          Alert.alert('Size Zaroori Hai', 'Kam se kam ek size chuni hui honi chahiye.');
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

  // Toggle color from palette
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
          Alert.alert('Rang Zaroori Hai', 'Kam se kam ek rang chuna hua hona chahiye.');
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
        Alert.alert('Rang Zaroori Hai', 'Kam se kam ek rang chuna hua hona chahiye.');
        return prev;
      }
      return prev.filter(
        (c) => c.name.toLowerCase() !== colToRemove.name.toLowerCase()
      );
    });
  };

  const handleAddCustomColor = () => {
    if (!customColorName.trim()) {
      Alert.alert('Rang Ka Naam', 'Rang ka naam likhein (Jaise: Haldi Peela, Saffron, Rani Pink).');
      return;
    }
    const cleanHex = customColorHex.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      Alert.alert('Galat Hex Code', 'Sahi 6-digit hex code likhein (Jaise: #FF9933).');
      return;
    }

    const newCol = { name: customColorName.trim(), hex: cleanHex };
    setSelectedColors((prev) => [...prev, newCol]);
    setCustomColorName('');
    setCustomColorHex('#');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Direct Media Pickers & Upload Handlers
  const handlePickCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Camera Permission', 'Kapde ki photo kheenchnay ke liye camera permission dein.');
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
      Alert.alert('Camera Error', err.message || 'Kaimra kholne mein samasya aayi.');
    }
  };

  const handlePickGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Gallery Permission', 'Photo ya video chunne ke liye gallery permission dein.');
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
      Alert.alert('Gallery Error', err.message || 'Gallery kholne mein samasya aayi.');
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
      Alert.alert('Upload Failed', err.message || 'Photo/video upload nahi ho paayi. Dobara koshish karein.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = (indexToRemove) => {
    setMediaList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublish = async () => {
    if (!name.trim()) {
      Alert.alert('Kapde Ka Naam', 'Kripya kapde ya saree ka naam likhein.');
      return;
    }
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Bikri Kimat', 'Kripya dukan ki sahi bikri kimat (₹ INR) darj karein.');
      return;
    }

    if (selectedColors.length === 0) {
      Alert.alert('Rang Chunein', 'Kam se kam ek rang chunna zaroori hai.');
      return;
    }

    if (selectedSizes.length === 0) {
      Alert.alert('Size Chunein', 'Kam se kam ek size chunna zaroori hai.');
      return;
    }

    if (mediaList.length === 0) {
      Alert.alert(
        'Photo / Video Zaroori Hai',
        'Kripya kaimra se photo kheenchein ya gallery se upload karein.'
      );
      return;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim() || shopName,
      category,
      subCategory: subCategory.trim(),
      description: description.trim(),
      price: parsedPrice,
      // Official printed MRP decided and set by Kya Pehnu Admin on QC approval portal
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
      images: mediaList.map((m) => m.url),
      isAvailable: true,
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onClose();
    } catch (err) {
      Alert.alert('Publish Failed', err.message || 'Kapda dukan par joda nahi jaa saka.');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.modalTitle}>+ Naya Kapda / Saree Jodein</Text>
            <Text style={styles.modalSubtitle}>
              {shopName} · Nagpur live catalog mein jodne ke liye
            </Text>
          </View>
          <PressableScale onPress={onClose} style={styles.closeBtn} accessibilityLabel="Band Karein">
            <MaterialIcons name="close" size={22} color={colors.textObsidian} />
          </PressableScale>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: ESSENTIAL INFO */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Kapde Ki Pehchan (Garment Identity)</Text>
            </View>

            <Text style={styles.fieldLabel}>Kapde Ka Naam (Garment Title) *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Jaise: Pure Chanderi Silk Kurta Set / Banarasi Saree"
              placeholderTextColor={colors.textAsh}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Dukan Ka Naam / Brand</Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder={shopName}
              placeholderTextColor={colors.textAsh}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Kiske Liye Hai? (Category)</Text>
            <View style={styles.chipRow}>
              {['WOMEN', 'MEN', 'KIDS', 'UNISEX'].map((cat) => {
                const isActive = category === cat;
                return (
                  <PressableScale
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  >
                    <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Kapde Ka Prakar (Sub-Category)</Text>
            <View style={styles.chipRow}>
              {SUB_CATEGORIES.map((sub) => {
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

            <Text style={styles.fieldLabel}>Kapde Ki Khasiyat (Description / Details)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Kapde ka fabric, zari kaam, design ya dukan ki vishesh jankari..."
              placeholderTextColor={colors.textAsh}
              multiline
              numberOfLines={3}
              style={[styles.textInput, styles.textAreaInput]}
            />
          </View>

          {/* SECTION 2: BIKRI KIMAT / SELLING PRICE (ONLY SELLING PRICE - MRP SET BY ADMIN) */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Bikri Kimat (Selling Price)</Text>
            </View>

            <View style={styles.sellingPriceCard}>
              <Text style={styles.sellingPriceLabel}>Aapki Dukan Ki Bikri Kimat (₹ INR) *</Text>
              <View style={styles.priceInputBox}>
                <Text style={styles.rupeePrefix}>₹</Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="2500"
                  placeholderTextColor={colors.textAsh}
                  keyboardType="numeric"
                  style={styles.priceTextInput}
                />
              </View>

              {/* Clear Admin MRP Notice */}
              <View style={styles.adminMrpBanner}>
                <MaterialIcons name="verified-user" size={20} color={colors.accentGoldDeep} />
                <View style={styles.adminMrpBannerTextCol}>
                  <Text style={styles.adminMrpBannerTitle}>Official MRP Admin Set Karega</Text>
                  <Text style={styles.adminMrpBannerDesc}>
                    Aapko MRP likhne ki zaroorat nahi hai. Dukan ka printed MRP Kya Pehnu Admin Team check karke approval ke dauraan set karegi.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.columnItem}>
                <Text style={styles.fieldLabel}>Kitne Piece (Net Qty)</Text>
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
                <Text style={styles.fieldLabel}>Desh (Country of Origin)</Text>
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
              <Text style={styles.cardHeaderTitle}>Available Sizes & Dukan Stock</Text>
            </View>
            <Text style={styles.sectionHelperText}>
              Jo sizes aapke paas dukan mein uplabdh hain unhe chunein aur dukan mein kitne piece hain darj karein:
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
              <Text style={styles.stockCountersHeader}>Dukan Mein Stock (Piece Count):</Text>
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
                      accessibilityLabel="Ghatayein"
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
                      accessibilityLabel="Badhayein"
                    >
                      <MaterialIcons name="add" size={18} color={colors.textObsidian} />
                    </PressableScale>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 4: COLOR PALETTE & SHADE CHART (PERFECT 2-COLUMN ALIGNMENT) */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Kapde Ke Rang (Color Options)</Text>
            </View>
            <Text style={styles.sectionHelperText}>
              Is piece ke jo rang dukan mein uplabdh hain, unpar tap karein:
            </Text>

            {/* Active Selected Colors Bar */}
            <View style={styles.selectedColorsBox}>
              <Text style={styles.selectedColorsTitle}>
                Chune Hue Rang ({selectedColors.length}):
              </Text>
              <View style={styles.selectedColorsPillsRow}>
                {selectedColors.map((col) => {
                  const norm = normalizeColor(col);
                  return (
                    <View key={norm.name} style={styles.activeColorPill}>
                      <View style={[styles.activeColorDot, { backgroundColor: norm.hex }]} />
                      <Text style={styles.activeColorPillName}>{norm.name}</Text>
                      <PressableScale
                        onPress={() => handleRemoveColor(col)}
                        hitSlop={8}
                        style={styles.removeColorIconBtn}
                        accessibilityLabel={`Hataayein ${norm.name}`}
                      >
                        <MaterialIcons name="close" size={14} color={colors.textSlate} />
                      </PressableScale>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Perfectly Aligned 2-Column Color Chart Grid */}
            <Text style={styles.subSectionTitle}>Popular Shades (Tap To Select):</Text>
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

            {/* Custom Color / Dye (Cleanly Aligned) */}
            <View style={styles.customColorSection}>
              <Text style={styles.subSectionTitle}>Apna Custom Rang Jodein:</Text>
              <View style={styles.customColorAlignedRow}>
                <TextInput
                  value={customColorName}
                  onChangeText={setCustomColorName}
                  placeholder="Rang Ka Naam (Jaise: Haldi Peela)"
                  placeholderTextColor={colors.textAsh}
                  style={[styles.textInput, { flex: 1.4 }]}
                />
                <TextInput
                  value={customColorHex}
                  onChangeText={setCustomColorHex}
                  placeholder="#FF9933"
                  placeholderTextColor={colors.textAsh}
                  style={[styles.textInput, { flex: 0.9, textAlign: 'center' }]}
                />
                <View
                  style={[
                    styles.customSwatchPreview,
                    {
                      backgroundColor:
                        /^#[0-9A-Fa-f]{6}$/.test(customColorHex.trim())
                          ? customColorHex.trim()
                          : '#E2E8F0',
                    },
                  ]}
                />
                <PressableScale
                  onPress={handleAddCustomColor}
                  style={styles.addCustomBtn}
                  accessibilityLabel="Add Color"
                >
                  <MaterialIcons name="add" size={22} color="#FFFFFF" />
                </PressableScale>
              </View>
            </View>
          </View>

          {/* SECTION 5: FABRIC & TEXTILE SPECIFICATIONS */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Fabric aur Design Details</Text>
            </View>

            <Text style={styles.fieldLabel}>Kapde Ka Fabric (Material)</Text>
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
              placeholder="Ya fabric ka naam yahan likhein..."
              placeholderTextColor={colors.textAsh}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Pattern / Karigari (Work)</Text>
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

            <Text style={styles.fieldLabel}>Fitting (Fit Style)</Text>
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

            <Text style={styles.fieldLabel}>Kab Pehanne Ke Liye (Occasion)</Text>
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

            <Text style={styles.fieldLabel}>Astin (Sleeve Length)</Text>
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

            <Text style={styles.fieldLabel}>Gala (Neckline)</Text>
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

            <Text style={styles.fieldLabel}>Dhulai Ki Jankari (Care)</Text>
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

          {/* SECTION 6: DIRECT MEDIA UPLOADS ONLY (NO URL INPUTS) */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>6</Text>
              </View>
              <Text style={styles.cardHeaderTitle}>Photo aur Video Upload (Cloudinary)</Text>
            </View>
            <Text style={styles.sectionHelperText}>
              Kapde ki photo kaimra se kheenchein ya gallery se chunein. Koi bhi URL dalne ki zaroorat nahi hai:
            </Text>

            {/* Big Action Buttons */}
            <View style={styles.mediaUploadButtonsCol}>
              <PressableScale
                onPress={handlePickCamera}
                disabled={uploadingMedia}
                style={[styles.mediaActionBtn, styles.cameraBtn]}
                accessibilityRole="button"
                accessibilityLabel="Kaimra se photo kheenchein"
              >
                <MaterialIcons name="photo-camera" size={24} color="#FFFFFF" />
                <Text style={styles.mediaActionBtnTextWhite}>📸 Kaimra Se Photo Kheenchein</Text>
              </PressableScale>

              <PressableScale
                onPress={handlePickGallery}
                disabled={uploadingMedia}
                style={[styles.mediaActionBtn, styles.galleryBtn]}
                accessibilityRole="button"
                accessibilityLabel="Gallery se photo ya video chunein"
              >
                <MaterialIcons name="photo-library" size={24} color={colors.textObsidian} />
                <Text style={styles.mediaActionBtnTextDark}>🖼️ Gallery Se Chunein (Photo / Video)</Text>
              </PressableScale>
            </View>

            {/* Uploading Status Banner */}
            {uploadingMedia ? (
              <View style={styles.uploadingProgressCard}>
                <ActivityIndicator size="small" color={colors.accentCrimson} />
                <Text style={styles.uploadingProgressText}>
                  Cloudinary par photo / video upload ho rahi hai...
                </Text>
              </View>
            ) : null}

            {/* Uploaded Media Previews */}
            {mediaList.length > 0 ? (
              <View style={styles.mediaGallerySection}>
                <Text style={styles.mediaGalleryHeader}>
                  Upload Kiye Hue Media ({mediaList.length} Piece):
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
                <Text style={styles.noMediaPlaceholderTitle}>Abhi tak koi photo nahi jodi gayi hai</Text>
                <Text style={styles.noMediaPlaceholderSubtitle}>
                  Upar diye gaye buttons se seedha phone se photo jodein.
                </Text>
              </View>
            )}
          </View>

          {/* FINAL PUBLISH CTA BUTTON (LARGE & HIGH-CONTRAST) */}
          <PressableScale
            onPress={handlePublish}
            disabled={loading || uploadingMedia}
            style={[
              styles.bigPublishBtn,
              (loading || uploadingMedia) && styles.bigPublishBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Dukan par publish karein"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={26} color="#FFFFFF" />
                <Text style={styles.bigPublishBtnText}>✓ DUKAAN PAR JODEIN (PUBLISH)</Text>
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
    backgroundColor: '#F4EFE7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(217, 119, 6, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  headerTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textObsidian,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSlate,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    marginLeft: 8,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.22)',
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
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    paddingBottom: 8,
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
    fontWeight: '800',
  },
  cardHeaderTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textObsidian,
    letterSpacing: -0.2,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textObsidian,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  sectionHelperText: {
    fontSize: 13,
    color: colors.textSlate,
    lineHeight: 18,
    marginBottom: spacing.xs + 2,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textObsidian,
    marginTop: spacing.sm + 2,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.14)',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.textObsidian,
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.xs,
  },
  columnItem: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  categoryPill: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: colors.textObsidian,
    borderColor: colors.textObsidian,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSlate,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  subCategoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  subCategoryPillActive: {
    backgroundColor: colors.accentCrimson,
    borderColor: colors.accentCrimson,
  },
  subCategoryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSlate,
  },
  subCategoryPillTextActive: {
    color: '#FFFFFF',
  },
  sellingPriceCard: {
    backgroundColor: '#FDFBF7',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'rgba(196, 36, 58, 0.35)',
    marginVertical: 4,
  },
  sellingPriceLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textObsidian,
    marginBottom: 8,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.accentCrimson,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rupeePrefix: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.accentCrimson,
    marginRight: 6,
  },
  priceTextInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: colors.textObsidian,
    paddingVertical: 10,
  },
  adminMrpBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  adminMrpBannerTextCol: {
    flex: 1,
  },
  adminMrpBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.accentGoldDeep,
    marginBottom: 2,
  },
  adminMrpBannerDesc: {
    fontSize: 12.5,
    color: colors.textObsidian,
    lineHeight: 17,
    fontWeight: '500',
  },
  sizeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  sizeTile: {
    width: 48,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeTileActive: {
    backgroundColor: colors.textObsidian,
    borderColor: colors.textObsidian,
  },
  sizeTileText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  sizeTileTextActive: {
    color: '#FFFFFF',
  },
  stockCountersContainer: {
    marginTop: spacing.sm,
    backgroundColor: '#F8F9FA',
    padding: spacing.sm + 2,
    borderRadius: radii.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  stockCountersHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textObsidian,
    marginBottom: 4,
  },
  stockCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gap: 8,
  },
  stockSizePill: {
    width: 38,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.textObsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockSizePillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stockCounterLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSlate,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9ECEF',
  },
  stepperInput: {
    width: 48,
    height: 36,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: colors.textObsidian,
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  selectedColorsBox: {
    backgroundColor: '#F8F9FA',
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: spacing.xs,
  },
  selectedColorsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textObsidian,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  selectedColorsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeColorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  activeColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  activeColorPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  removeColorIconBtn: {
    marginLeft: 2,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 4,
  },
  paletteColorCard: {
    width: '48.5%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  paletteColorCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.accentCrimson,
    borderWidth: 2,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  paletteSwatchCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteColorName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  paletteColorNameSelected: {
    color: colors.accentCrimson,
  },
  customColorSection: {
    marginTop: spacing.sm + 4,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  customColorAlignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customSwatchPreview: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  addCustomBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  specPillActive: {
    backgroundColor: colors.textObsidian,
    borderColor: colors.textObsidian,
  },
  specPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSlate,
  },
  specPillTextActive: {
    color: '#FFFFFF',
  },
  mediaUploadButtonsCol: {
    flexDirection: 'column',
    gap: 12,
    marginVertical: spacing.xs,
  },
  mediaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 15,
    borderRadius: radii.lg,
  },
  cameraBtn: {
    backgroundColor: colors.accentCrimson,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  galleryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.18)',
  },
  mediaActionBtnTextWhite: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mediaActionBtnTextDark: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  uploadingProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(196, 36, 58, 0.25)',
    marginTop: 8,
  },
  uploadingProgressText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentCrimson,
  },
  mediaGallerySection: {
    marginTop: spacing.sm,
  },
  mediaGalleryHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textObsidian,
    marginBottom: 8,
  },
  mediaThumbnailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaThumbnailBox: {
    width: 95,
    height: 95,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  mediaThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  videoBadgeTag: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  deleteMediaCircleBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: '#FDFBF7',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    gap: 6,
    marginTop: 6,
  },
  noMediaPlaceholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textObsidian,
    marginTop: 4,
  },
  noMediaPlaceholderSubtitle: {
    fontSize: 12.5,
    color: colors.textSlate,
    textAlign: 'center',
  },
  bigPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.accentCrimson,
    paddingVertical: 18,
    borderRadius: radii.lg,
    marginTop: spacing.xs,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  bigPublishBtnDisabled: {
    opacity: 0.6,
  },
  bigPublishBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
