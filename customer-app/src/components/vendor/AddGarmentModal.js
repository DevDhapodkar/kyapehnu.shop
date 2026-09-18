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
import BrandLogo from '../BrandLogo';
import ColorWheelPicker from './ColorWheelPicker';
import { uploadProductImages } from '../../api/vendorApi';
import { COLOR_PALETTE, normalizeColor } from '../../constants/colorPalette';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';

/**
 * Modern contemporary & Western apparel taxonomy
 */
export const MODERN_SUB_CATEGORIES = {
  WOMEN: [
    'Chanderi Silk Angrakha',
    'Tussar Silk Kurta',
    'Banarasi Saree',
    'Mulmul Anarkali',
    'One-Piece Dress',
    'Maxi Dress',
    'Midi Dress',
    'Crop Top',
    'Blouse',
    'T-Shirt',
    'Casual Shirt',
    'Wide Leg Jeans',
    'Straight Fit Jeans',
    'Cargo Pants',
    'Co-ord Set',
    'Blazer',
    'Dupatta',
  ],
  MEN: [
    'T-Shirt',
    'Oversized T-Shirt',
    'Polo T-Shirt',
    'Linen Shirt',
    'Formal Shirt',
    'Straight Fit Jeans',
    'Cargo Pants',
    'Trousers',
    'Blazer',
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
    'Ethnic Wear',
    'Jacket',
  ],
  UNISEX: [
    'Oversized T-Shirt',
    'Graphic Tee',
    'Hoodie',
    'Casual Shirt',
    'Cargo Pants',
    'Wide Leg Jeans',
    'Denim Jacket',
  ],
};

const FABRIC_PRESETS = [
  'Pure Chanderi Silk',
  'Tussar Silk',
  'Mulmul Cotton',
  '100% Pure Cotton',
  'Banarasi Brocade',
  'Raw Silk',
  'Georgette',
  'Chiffon',
  'Linen Blend',
  'Denim',
  'Velvet',
  'French Terry',
];

const PATTERN_PRESETS = [
  'Solid / Plain',
  'Handblock Printed',
  'Zardozi & Antique Zari',
  'Marodi Needlework',
  'Embroidered',
  'Tie-Dye / Ombre',
  'Floral Weave',
  'Striped',
  'Plaid / Checked',
];

const FIT_PRESETS = [
  'Regular Fit',
  'Relaxed / Flowing',
  'Oversized',
  'Tailored / Slim',
  'A-Line Flared',
  'Straight Fit',
];

const OCCASION_PRESETS = [
  'Festive & Wedding',
  'Casual / Daily Wear',
  'Boutique Special',
  'Work & Formal',
  'Party & Night Out',
  'Vacation & Resort',
];

const SLEEVE_PRESETS = [
  'Full Sleeves',
  'Three-Quarter',
  'Half Sleeves',
  'Sleeveless',
  'Cap Sleeves',
  'Spaghetti Straps',
];

const NECK_PRESETS = [
  'Crew Neck / Round',
  'Angrakha Wrap',
  'V-Neck',
  'Square Neck',
  'Sweetheart',
  'Mandarin / Bandhgala',
  'Polo Collar',
];

const CARE_PRESETS = [
  'Dry Clean Only',
  'Hand Wash Cold',
  'Machine Wash Cold',
  'Gentle Cycle',
];

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE', '38', '40', '42'];

const STEP_TITLES = [
  'Garment Identity',
  'Pricing & Packaging',
  'Inventory & Sizing',
  'Color Palette',
  'Specifications',
  'Editorial Media',
];

/**
 * AddGarmentModal — 6-Step Ingestion Studio
 * Implements Stitch Screen:
 * - final_light_theme Product Ingestion — 6-Step Vendor Studio
 * - final_theme_dark Product Ingestion & Catalog Listing Form — 6-Step Vendor Studio
 * - Dynamic theme tokens via useTheme()
 * - Progressive workflow stepper (1. Identity, 2. Pricing, 3. Inventory, 4. Color, 5. Specifications, 6. Media)
 * - BrandLogo squircle emblem and QC Fast-Track indicator
 * - Full photo/video upload, color swatches & size matrix
 */
export default function AddGarmentModal({
  visible,
  onClose,
  onSubmit,
  shopName = 'Nagpur Boutique',
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [brand, setBrand] = useState(shopName);
  const [category, setCategory] = useState('WOMEN');
  const [subCategory, setSubCategory] = useState('Chanderi Silk Angrakha');
  const [description, setDescription] = useState('');

  // Step 2: Pricing
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [netQuantity, setNetQuantity] = useState('1');
  const [countryOfOrigin, setCountryOfOrigin] = useState('India');

  // Step 3: Sizing & Stock
  const [selectedSizes, setSelectedSizes] = useState([
    { size: 'S', stock: 4 },
    { size: 'M', stock: 6 },
    { size: 'L', stock: 3 },
  ]);

  // Step 4: Colors & Swatches
  const [selectedColors, setSelectedColors] = useState([
    { name: 'Blush Ivory', hex: '#FAF3E8' },
    { name: 'Heritage Gold', hex: '#D4AF37' },
  ]);

  // Step 5: Specifications
  const [material, setMaterial] = useState('Pure Chanderi Silk');
  const [pattern, setPattern] = useState('Zardozi & Antique Zari');
  const [fit, setFit] = useState('Relaxed / Flowing');
  const [occasion, setOccasion] = useState('Festive & Wedding');
  const [sleeve, setSleeve] = useState('Half Sleeves');
  const [neck, setNeck] = useState('Angrakha Wrap');
  const [careInstructions, setCareInstructions] = useState('Dry Clean Only');

  // Step 6: Media Uploads
  const [mediaList, setMediaList] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(false);

  // Category switch
  const handleCategoryChange = (newCat) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setCategory(newCat);
    const available = MODERN_SUB_CATEGORIES[newCat] || [];
    if (!available.includes(subCategory) && available.length > 0) {
      setSubCategory(available[0]);
    }
  };

  // Sizing management
  const handleToggleSize = (sizeStr) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
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
    if (Platform.OS !== 'web') Haptics.selectionAsync();
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

  // Color selection
  const handleToggleColor = (paletteItem) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
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
    if (Platform.OS !== 'web') Haptics.selectionAsync();
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

  // Media pickers
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
          Alert.alert('Gallery Permission', 'Please grant photo library access.');
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
        isVideo: img.resourceType === 'video' || img.url?.endsWith('.mp4'),
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

  const handleRemoveMedia = (idxToRemove) => {
    setMediaList((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (activeStep === 1) {
      if (!name.trim()) {
        Alert.alert('Product Name Required', 'Please enter a name for this handcrafted piece.');
        return;
      }
    } else if (activeStep === 2) {
      const cleanPrice = parseInt(String(price).replace(/[^0-9]/g, ''), 10);
      if (isNaN(cleanPrice) || cleanPrice <= 0) {
        Alert.alert('Price Required', 'Please enter a valid selling price in INR.');
        return;
      }
    } else if (activeStep === 3) {
      if (selectedSizes.length === 0) {
        Alert.alert('Size Required', 'Please select at least one available size.');
        return;
      }
    } else if (activeStep === 4) {
      if (selectedColors.length === 0) {
        Alert.alert('Color Required', 'Please select at least one color swatch.');
        return;
      }
    }

    if (activeStep < 6) {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setActiveStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setActiveStep((prev) => prev - 1);
    }
  };

  const handlePublish = async () => {
    if (!name.trim()) {
      setActiveStep(1);
      Alert.alert('Product Name Required', 'Please enter a name for this piece.');
      return;
    }
    const cleanPrice = parseInt(String(price).replace(/[^0-9]/g, ''), 10);
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      setActiveStep(2);
      Alert.alert('Price Required', 'Please enter a valid selling price in INR.');
      return;
    }

    let finalMedia = mediaList;
    if (finalMedia.length === 0) {
      finalMedia = [
        {
          url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
          publicId: `sample_${Date.now()}`,
          isVideo: false,
        },
      ];
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim() || shopName,
      category: category.toUpperCase(),
      subCategory: subCategory.trim(),
      description: description.trim(),
      price: cleanPrice,
      mrp: mrp ? parseInt(String(mrp).replace(/[^0-9]/g, ''), 10) : Math.round(cleanPrice * 1.25),
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

    setLoading(true);
    try {
      await onSubmit(payload);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onClose();
    } catch (err) {
      Alert.alert('Publish Failed', err.message || 'Could not add product to catalog.');
    } finally {
      setLoading(false);
    }
  };

  const activeSubCategories = MODERN_SUB_CATEGORIES[category] || MODERN_SUB_CATEGORIES.WOMEN;
  const totalStockUnits = selectedSizes.reduce((sum, s) => sum + (s.stock || 0), 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalRoot,
          {
            backgroundColor: colors.groundBase,
            paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8,
          },
        ]}
      >
        {/* TOP APP BAR / HEADER (Stitch Matched) */}
        <View
          style={[
            styles.modalHeader,
            {
              backgroundColor: isDark ? 'rgba(19, 19, 21, 0.95)' : 'rgba(250, 249, 245, 0.95)',
              borderBottomColor: colors.borderHairline,
            },
          ]}
        >
          <View style={styles.headerLeftCol}>
            <PressableScale
              onPress={onClose}
              style={[
                styles.headerBackBtn,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityLabel="Close"
            >
              <MaterialIcons name="chevron-left" size={20} color={colors.textObsidian} />
            </PressableScale>

            <BrandLogo size="sm" showEmblem={true} />

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitleText, { color: colors.textObsidian }]}>
                NEW LISTING
              </Text>
              <View style={styles.headerSubRow}>
                <View style={[styles.headerStatusDot, { backgroundColor: colors.accentCrimson }]} />
                <Text style={[styles.headerSubtitleText, { color: colors.accentCrimson }]} numberOfLines={1}>
                  Studio {brand || shopName} · QC Fast-Track
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRightRow}>
            <View
              style={[
                styles.draftsPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <Text style={[styles.draftsPillText, { color: colors.textSlate }]}>Drafts</Text>
              <View style={[styles.draftsCountBadge, { backgroundColor: colors.accentCrimson }]}>
                <Text style={styles.draftsCountText}>2</Text>
              </View>
            </View>

            <PressableScale
              onPress={onClose}
              style={[
                styles.headerCloseCircle,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityLabel="Dismiss"
            >
              <MaterialIcons name="close" size={16} color={colors.textAsh} />
            </PressableScale>
          </View>
        </View>

        {/* PROGRESSIVE WORKFLOW STEPPER */}
        <View
          style={[
            styles.stepperContainer,
            {
              backgroundColor: isDark ? 'rgba(14, 14, 16, 0.96)' : 'rgba(250, 249, 245, 0.96)',
              borderBottomColor: colors.borderHairline,
            },
          ]}
        >
          {/* Stepper Status Bar */}
          <View style={styles.stepperStatusRow}>
            <View style={styles.stepperLabelGroup}>
              <Text style={[styles.stepNumberBadgeText, { color: colors.accentCrimson }]}>
                STEP {activeStep} OF 6
              </Text>
              <Text style={[styles.stepDotSeparator, { color: colors.textAsh }]}>·</Text>
              <Text style={[styles.stepNameTitle, { color: colors.textObsidian }]}>
                {STEP_TITLES[activeStep - 1]}
              </Text>
            </View>

            <View style={styles.fastDispatchBadge}>
              <MaterialIcons name="bolt" size={12} color="#059669" />
              <Text style={styles.fastDispatchText}>45-Min Dispatch Ready</Text>
            </View>
          </View>

          {/* 6-Segment Progress Bar */}
          <View style={styles.segmentBarRow}>
            {[1, 2, 3, 4, 5, 6].map((st) => (
              <PressableScale
                key={st}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  setActiveStep(st);
                }}
                style={[
                  styles.segmentPill,
                  {
                    backgroundColor:
                      st <= activeStep
                        ? colors.accentCrimson
                        : isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : (colors.surfaceContainerHighest || '#E3E2DF'),
                  },
                ]}
              />
            ))}
          </View>

          {/* Step Pill Horizontal Scroller */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepTabsScrollRow}
          >
            {[
              '1. Identity',
              '2. Pricing',
              '3. Inventory',
              '4. Color',
              '5. Specs',
              '6. Media',
            ].map((tabLabel, idx) => {
              const stepIdx = idx + 1;
              const isCurrent = activeStep === stepIdx;
              return (
                <PressableScale
                  key={tabLabel}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setActiveStep(stepIdx);
                  }}
                  style={[
                    styles.stepTabPill,
                    isCurrent
                      ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                      : {
                          backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                          borderColor: colors.borderHairline,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepTabPillText,
                      { color: isCurrent ? '#FFFFFF' : colors.textSlate },
                    ]}
                  >
                    {tabLabel}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>

        {/* FORM BODY FOR ACTIVE STEP */}
        <ScrollView
          style={styles.modalBodyScroll}
          contentContainerStyle={[styles.modalBodyContent, { paddingBottom: insets.bottom + 96 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: IDENTITY */}
          {activeStep === 1 && (
            <View
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <Text style={[styles.fieldHeaderEyebrow, { color: colors.accentGold || '#B38A2B' }]}>
                GARMENT IDENTITY
              </Text>
              <Text style={[styles.fieldSectionTitle, { color: colors.textObsidian }]}>
                Garment Silhouette & Details
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Product / Piece Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Chanderi Silk Angrakha, Zari Banarasi Saree, Tussar Kurta"
                placeholderTextColor={colors.textAsh}
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.groundSubtle || '#F4F3EE'),
                    borderColor: colors.borderHairline,
                    color: colors.textObsidian,
                  },
                ]}
              />

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Boutique Brand / Store Label
              </Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder={shopName}
                placeholderTextColor={colors.textAsh}
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.groundSubtle || '#F4F3EE'),
                    borderColor: colors.borderHairline,
                    color: colors.textObsidian,
                  },
                ]}
              />

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Department (Category) *
              </Text>
              <View style={styles.chipsFlowRow}>
                {['WOMEN', 'MEN', 'KIDS', 'UNISEX'].map((cat) => {
                  const isSel = category === cat;
                  return (
                    <PressableScale
                      key={cat}
                      onPress={() => handleCategoryChange(cat)}
                      style={[
                        styles.selectChip,
                        isSel
                          ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                              borderColor: colors.borderHairline,
                            },
                      ]}
                    >
                      <Text style={[styles.selectChipText, { color: isSel ? '#FFFFFF' : colors.textObsidian }]}>
                        {cat}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Silhouette / Craft Cut *
              </Text>
              <View style={styles.chipsFlowRow}>
                {activeSubCategories.map((sub) => {
                  const isSel = subCategory === sub;
                  return (
                    <PressableScale
                      key={sub}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        setSubCategory(sub);
                      }}
                      style={[
                        styles.selectChip,
                        isSel
                          ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                              borderColor: colors.borderHairline,
                            },
                      ]}
                    >
                      <Text style={[styles.selectChipText, { color: isSel ? '#FFFFFF' : colors.textObsidian }]}>
                        {sub}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Garment Notes & Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe weave, zari work, embroidery style, lining, or drape..."
                placeholderTextColor={colors.textAsh}
                multiline
                numberOfLines={3}
                style={[
                  styles.formInput,
                  styles.formTextArea,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.groundSubtle || '#F4F3EE'),
                    borderColor: colors.borderHairline,
                    color: colors.textObsidian,
                  },
                ]}
              />
            </View>
          )}

          {/* STEP 2: PRICING */}
          {activeStep === 2 && (
            <View
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <Text style={[styles.fieldHeaderEyebrow, { color: colors.accentGold || '#B38A2B' }]}>
                RETAIL & PACKAGING
              </Text>
              <Text style={[styles.fieldSectionTitle, { color: colors.textObsidian }]}>
                Pricing & Valuation Ledger
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Selling Price (INR) *
              </Text>
              <View
                style={[
                  styles.currencyInputRow,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.groundSubtle || '#F4F3EE'),
                    borderColor: colors.borderHairline,
                  },
                ]}
              >
                <Text style={[styles.rupeeSymbol, { color: colors.accentCrimson }]}>₹</Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="4800"
                  placeholderTextColor={colors.textAsh}
                  keyboardType="numeric"
                  style={[styles.currencyTextInput, { color: colors.textObsidian }]}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Retail Price / MRP (Optional)
              </Text>
              <View
                style={[
                  styles.currencyInputRow,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.groundSubtle || '#F4F3EE'),
                    borderColor: colors.borderHairline,
                  },
                ]}
              >
                <Text style={[styles.rupeeSymbol, { color: colors.textAsh }]}>₹</Text>
                <TextInput
                  value={mrp}
                  onChangeText={setMrp}
                  placeholder="6499"
                  placeholderTextColor={colors.textAsh}
                  keyboardType="numeric"
                  style={[styles.currencyTextInput, { color: colors.textObsidian }]}
                />
              </View>

              {price && mrp && Number(mrp) > Number(price) ? (
                <View style={styles.discountCalcCallout}>
                  <MaterialIcons name="local-offer" size={14} color={colors.accentGold || '#B38A2B'} />
                  <Text style={[styles.discountCalcText, { color: colors.accentGold || '#B38A2B' }]}>
                    Displaying {Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)}% discount to shoppers
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Net Quantity Units
              </Text>
              <TextInput
                value={netQuantity}
                onChangeText={setNetQuantity}
                placeholder="1"
                placeholderTextColor={colors.textAsh}
                keyboardType="numeric"
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.groundSubtle || '#F4F3EE'),
                    borderColor: colors.borderHairline,
                    color: colors.textObsidian,
                  },
                ]}
              />

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Country of Origin
              </Text>
              <TextInput
                value={countryOfOrigin}
                onChangeText={setCountryOfOrigin}
                placeholder="India"
                placeholderTextColor={colors.textAsh}
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.groundSubtle || '#F4F3EE'),
                    borderColor: colors.borderHairline,
                    color: colors.textObsidian,
                  },
                ]}
              />
            </View>
          )}

          {/* STEP 3: INVENTORY */}
          {activeStep === 3 && (
            <View
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <Text style={[styles.fieldHeaderEyebrow, { color: colors.accentGold || '#B38A2B' }]}>
                SIZING & MATRIX
              </Text>
              <Text style={[styles.fieldSectionTitle, { color: colors.textObsidian }]}>
                Size & Stock Guide ({totalStockUnits} Total Units)
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Toggle Available Sizes
              </Text>
              <View style={styles.chipsFlowRow}>
                {DEFAULT_SIZES.map((sz) => {
                  const isSelected = selectedSizes.some((s) => s.size === sz);
                  return (
                    <PressableScale
                      key={sz}
                      onPress={() => handleToggleSize(sz)}
                      style={[
                        styles.sizeTogglePill,
                        isSelected
                          ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                              borderColor: colors.borderHairline,
                            },
                      ]}
                    >
                      <Text style={[styles.sizeToggleText, { color: isSelected ? '#FFFFFF' : colors.textObsidian }]}>
                        {sz}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian, marginTop: 16 }]}>
                Units in Stock per Size
              </Text>
              <View style={styles.steppersStack}>
                {selectedSizes.map((item) => (
                  <View
                    key={item.size}
                    style={[
                      styles.stockStepperRow,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : (colors.groundSubtle || '#F4F3EE'),
                        borderColor: colors.borderHairline,
                      },
                    ]}
                  >
                    <View style={styles.stepperSizeLabelCol}>
                      <Text style={[styles.stepperSizeName, { color: colors.textObsidian }]}>
                        Size {item.size}
                      </Text>
                      <Text style={[styles.stepperSizeSub, { color: colors.textAsh }]}>
                        {item.stock > 0 ? `${item.stock} pieces ready` : 'Out of stock'}
                      </Text>
                    </View>

                    <View style={styles.stepperControlsGroup}>
                      <PressableScale
                        onPress={() => handleUpdateStock(item.size, -1)}
                        style={[
                          styles.stepperBtn,
                          {
                            backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                            borderColor: colors.borderHairline,
                          },
                        ]}
                      >
                        <MaterialIcons name="remove" size={16} color={colors.textObsidian} />
                      </PressableScale>

                      <Text style={[styles.stepperNumberDisplay, { color: colors.textObsidian }]}>
                        {item.stock}
                      </Text>

                      <PressableScale
                        onPress={() => handleUpdateStock(item.size, 1)}
                        style={[
                          styles.stepperBtn,
                          {
                            backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                            borderColor: colors.borderHairline,
                          },
                        ]}
                      >
                        <MaterialIcons name="add" size={16} color={colors.textObsidian} />
                      </PressableScale>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* STEP 4: COLOR */}
          {activeStep === 4 && (
            <View
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <Text style={[styles.fieldHeaderEyebrow, { color: colors.accentGold || '#B38A2B' }]}>
                SWATCHES & SHADES
              </Text>
              <Text style={[styles.fieldSectionTitle, { color: colors.textObsidian }]}>
                Color Palette
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Selected Colors ({selectedColors.length})
              </Text>
              <View style={styles.selectedColorsFlow}>
                {selectedColors.map((col) => (
                  <View
                    key={col.name}
                    style={[
                      styles.selectedColorChip,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.groundSubtle || '#F4F3EE'),
                        borderColor: colors.borderHairline,
                      },
                    ]}
                  >
                    <View style={[styles.colorChipDot, { backgroundColor: col.hex }]} />
                    <Text style={[styles.colorChipName, { color: colors.textObsidian }]}>
                      {col.name}
                    </Text>
                    <PressableScale onPress={() => handleRemoveColor(col)}>
                      <MaterialIcons name="close" size={14} color={colors.textAsh} />
                    </PressableScale>
                  </View>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian, marginTop: 16 }]}>
                Tap to Add from Popular Presets
              </Text>
              <View style={styles.chipsFlowRow}>
                {COLOR_PALETTE.slice(0, 14).map((p) => {
                  const isSel = selectedColors.some(
                    (c) => c.name.toLowerCase() === p.name.toLowerCase()
                  );
                  return (
                    <PressableScale
                      key={p.name}
                      onPress={() => handleToggleColor(p)}
                      style={[
                        styles.palettePresetPill,
                        isSel
                          ? { borderColor: colors.accentCrimson, borderWidth: 1.5 }
                          : { borderColor: colors.borderHairline, borderWidth: 1 },
                        {
                          backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                        },
                      ]}
                    >
                      <View style={[styles.palettePresetDot, { backgroundColor: p.hex }]} />
                      <Text style={[styles.palettePresetText, { color: colors.textObsidian }]}>
                        {p.name}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 5: SPECIFICATIONS */}
          {activeStep === 5 && (
            <View
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <Text style={[styles.fieldHeaderEyebrow, { color: colors.accentGold || '#B38A2B' }]}>
                CRAFT SPECIFICATIONS
              </Text>
              <Text style={[styles.fieldSectionTitle, { color: colors.textObsidian }]}>
                Fabric, Fit & Detailing
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textObsidian }]}>
                Fabric / Weave
              </Text>
              <View style={styles.chipsFlowRow}>
                {FABRIC_PRESETS.map((f) => {
                  const isSel = material === f;
                  return (
                    <PressableScale
                      key={f}
                      onPress={() => setMaterial(f)}
                      style={[
                        styles.selectChip,
                        isSel
                          ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                              borderColor: colors.borderHairline,
                            },
                      ]}
                    >
                      <Text style={[styles.selectChipText, { color: isSel ? '#FFFFFF' : colors.textObsidian }]}>
                        {f}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian, marginTop: 14 }]}>
                Surface Work / Pattern
              </Text>
              <View style={styles.chipsFlowRow}>
                {PATTERN_PRESETS.map((p) => {
                  const isSel = pattern === p;
                  return (
                    <PressableScale
                      key={p}
                      onPress={() => setPattern(p)}
                      style={[
                        styles.selectChip,
                        isSel
                          ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                              borderColor: colors.borderHairline,
                            },
                      ]}
                    >
                      <Text style={[styles.selectChipText, { color: isSel ? '#FFFFFF' : colors.textObsidian }]}>
                        {p}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian, marginTop: 14 }]}>
                Fit / Drape
              </Text>
              <View style={styles.chipsFlowRow}>
                {FIT_PRESETS.map((ft) => {
                  const isSel = fit === ft;
                  return (
                    <PressableScale
                      key={ft}
                      onPress={() => setFit(ft)}
                      style={[
                        styles.selectChip,
                        isSel
                          ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                              borderColor: colors.borderHairline,
                            },
                      ]}
                    >
                      <Text style={[styles.selectChipText, { color: isSel ? '#FFFFFF' : colors.textObsidian }]}>
                        {ft}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian, marginTop: 14 }]}>
                Occasion
              </Text>
              <View style={styles.chipsFlowRow}>
                {OCCASION_PRESETS.map((occ) => {
                  const isSel = occasion === occ;
                  return (
                    <PressableScale
                      key={occ}
                      onPress={() => setOccasion(occ)}
                      style={[
                        styles.selectChip,
                        isSel
                          ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                              borderColor: colors.borderHairline,
                            },
                      ]}
                    >
                      <Text style={[styles.selectChipText, { color: isSel ? '#FFFFFF' : colors.textObsidian }]}>
                        {occ}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textObsidian, marginTop: 14 }]}>
                Wash & Care
              </Text>
              <View style={styles.chipsFlowRow}>
                {CARE_PRESETS.map((c) => {
                  const isSel = careInstructions === c;
                  return (
                    <PressableScale
                      key={c}
                      onPress={() => setCareInstructions(c)}
                      style={[
                        styles.selectChip,
                        isSel
                          ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainer || '#EFEEEA'),
                              borderColor: colors.borderHairline,
                            },
                      ]}
                    >
                      <Text style={[styles.selectChipText, { color: isSel ? '#FFFFFF' : colors.textObsidian }]}>
                        {c}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 6: MEDIA */}
          {activeStep === 6 && (
            <View
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <Text style={[styles.fieldHeaderEyebrow, { color: colors.accentGold || '#B38A2B' }]}>
                LOOKBOOK VISUALS
              </Text>
              <Text style={[styles.fieldSectionTitle, { color: colors.textObsidian }]}>
                Editorial Photos & Videos
              </Text>

              {/* Action Buttons for Media */}
              <View style={styles.mediaButtonsRow}>
                <PressableScale
                  onPress={handlePickCamera}
                  style={[
                    styles.mediaPickerBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.groundSubtle || '#F4F3EE'),
                      borderColor: colors.borderHairline,
                    },
                  ]}
                >
                  <MaterialIcons name="photo-camera" size={20} color={colors.accentCrimson} />
                  <Text style={[styles.mediaPickerBtnText, { color: colors.textObsidian }]}>
                    Take Photo / Video
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={handlePickGallery}
                  style={[
                    styles.mediaPickerBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.groundSubtle || '#F4F3EE'),
                      borderColor: colors.borderHairline,
                    },
                  ]}
                >
                  <MaterialIcons name="collections" size={20} color={colors.accentGold || '#B38A2B'} />
                  <Text style={[styles.mediaPickerBtnText, { color: colors.textObsidian }]}>
                    Choose from Gallery
                  </Text>
                </PressableScale>
              </View>

              {uploadingMedia ? (
                <View style={styles.uploadingWrap}>
                  <ActivityIndicator color={colors.accentCrimson} size="small" />
                  <Text style={[styles.uploadingText, { color: colors.textAsh }]}>
                    Uploading media to secure CDN...
                  </Text>
                </View>
              ) : null}

              {/* Uploaded Gallery Grid */}
              <View style={styles.mediaGrid}>
                {mediaList.map((m, idx) => (
                  <View
                    key={m.publicId || idx}
                    style={[
                      styles.mediaThumbCard,
                      {
                        backgroundColor: isDark ? '#222226' : (colors.surfaceContainerLow || '#F4F4F0'),
                        borderColor: colors.borderHairline,
                      },
                    ]}
                  >
                    <Image source={{ uri: m.url }} style={styles.mediaThumbImage} contentFit="cover" />

                    {idx === 0 ? (
                      <View style={styles.primaryCoverBadge}>
                        <Text style={styles.primaryCoverText}>PRIMARY</Text>
                      </View>
                    ) : null}

                    <PressableScale
                      onPress={() => handleRemoveMedia(idx)}
                      style={styles.mediaRemoveBtn}
                    >
                      <MaterialIcons name="close" size={14} color="#FFFFFF" />
                    </PressableScale>
                  </View>
                ))}
              </View>

              {/* QC Fast-Track Checklist */}
              <View
                style={[
                  styles.qcChecklistCard,
                  {
                    backgroundColor: isDark ? 'rgba(200, 162, 74, 0.08)' : (colors.groundSubtle || '#F4F3EE'),
                    borderColor: colors.borderHairline,
                  },
                ]}
              >
                <View style={styles.qcChecklistTitleRow}>
                  <MaterialIcons name="verified" size={18} color={colors.accentGoldDeep || '#946C18'} />
                  <Text style={[styles.qcChecklistTitle, { color: colors.accentGoldDeep || '#946C18' }]}>
                    Nagpur QC Fast-Track Verification
                  </Text>
                </View>
                <Text style={[styles.qcChecklistText, { color: colors.textSlate }]}>
                  Your piece will be verified by Nagpur QC specialists for fabric purity, sizing ledger accuracy, and high-resolution visuals within 15 minutes of submission.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* BOTTOM STICKY ACTION BAR */}
        <View
          style={[
            styles.bottomStickyBar,
            {
              backgroundColor: isDark ? 'rgba(14, 14, 16, 0.96)' : 'rgba(250, 249, 245, 0.96)',
              borderTopColor: colors.borderHairline,
              paddingBottom: Math.max(insets.bottom, 12) + 6,
            },
          ]}
        >
          {activeStep > 1 ? (
            <PressableScale
              onPress={handlePrevStep}
              style={[
                styles.prevBtn,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityLabel="Previous Step"
            >
              <MaterialIcons name="arrow-back" size={18} color={colors.textObsidian} />
              <Text style={[styles.prevBtnText, { color: colors.textObsidian }]}>Back</Text>
            </PressableScale>
          ) : null}

          {activeStep < 6 ? (
            <PressableScale
              onPress={handleNextStep}
              style={[styles.nextBtn, { backgroundColor: colors.accentCrimson }]}
              accessibilityLabel="Next Step"
            >
              <Text style={styles.nextBtnText}>Continue to Step {activeStep + 1}</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            </PressableScale>
          ) : (
            <PressableScale
              onPress={handlePublish}
              disabled={loading}
              style={[
                styles.publishBtn,
                { backgroundColor: colors.accentCrimson },
                loading && { opacity: 0.7 },
              ]}
              accessibilityLabel="Submit for QC & Ingest Piece"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="verified" size={18} color="#FFFFFF" />
                  <Text style={styles.publishBtnText}>Submit for QC & Ingest Piece</Text>
                </>
              )}
            </PressableScale>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 2,
  },
  headerTitleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  headerStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  headerSubtitleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  draftsPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  draftsCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  draftsCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  headerCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  stepperStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepperLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepNumberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  stepDotSeparator: {
    fontSize: 12,
  },
  stepNameTitle: {
    fontSize: 14,
    fontWeight: '600',
    ...Platform.select({
      web: { fontFamily: '"EB Garamond", serif' },
      ios: { fontFamily: 'Georgia' },
    }),
  },
  fastDispatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  fastDispatchText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  segmentBarRow: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    marginBottom: 8,
  },
  segmentPill: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepTabsScrollRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  stepTabPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  stepTabPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBodyContent: {
    padding: spacing.md,
  },
  stepCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(18, 18, 20, 0.03)',
      },
    }),
  },
  fieldHeaderEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  fieldSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginTop: 2,
    marginBottom: 14,
    ...Platform.select({
      web: { fontFamily: '"EB Garamond", serif' },
      ios: { fontFamily: 'Georgia' },
    }),
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 13,
  },
  formTextArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipsFlowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  selectChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 6,
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '700',
  },
  currencyTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  discountCalcCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  discountCalcText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sizeTogglePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  sizeToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  steppersStack: {
    gap: 8,
    marginTop: 6,
  },
  stockStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  stepperSizeLabelCol: {
    flex: 1,
  },
  stepperSizeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepperSizeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  stepperControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNumberDisplay: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  selectedColorsFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  selectedColorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  colorChipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorChipName: {
    fontSize: 11,
    fontWeight: '600',
  },
  palettePresetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  palettePresetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  palettePresetText: {
    fontSize: 11,
    fontWeight: '500',
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  mediaPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  mediaPickerBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  uploadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  uploadingText: {
    fontSize: 11,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  mediaThumbCard: {
    position: 'relative',
    width: 100,
    height: 130,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mediaThumbImage: {
    width: '100%',
    height: '100%',
  },
  primaryCoverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#C4243A',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  primaryCoverText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mediaRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qcChecklistCard: {
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: 16,
  },
  qcChecklistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  qcChecklistTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  qcChecklistText: {
    fontSize: 11,
    lineHeight: 16,
  },
  bottomStickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.full,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.full,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
