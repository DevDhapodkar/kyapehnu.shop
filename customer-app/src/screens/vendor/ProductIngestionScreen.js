import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Image,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import PressableScale from '../../components/PressableScale';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useVendorStore } from '../../store/useVendorStore';
import { useStorefrontStore } from '../../store/useStorefrontStore';
import { createProduct } from '../../api/vendorApi';
import { LOGO_DATA_URI } from '../../constants/logoDataUri';

const DRAFT_STORAGE_KEY = 'kyapehnu_vendor_listing_draft_v2';

const DEPARTMENTS = [
  { id: 'MEN', label: "Men's Wear", code: 'MEN' },
  { id: 'WOMEN', label: "Women's Wear", code: 'WMN' },
  { id: 'UNISEX', label: 'Unisex / Streetwear', code: 'UNI' },
  { id: 'ETHNIC', label: 'Ethnic & Festive', code: 'ETH' },
];

const CATEGORIES_BY_DEPT = {
  MEN: [
    { id: 'CASUAL_SHIRTS', label: 'Casual Shirts & Polos', skuCode: 'SHIRT' },
    { id: 'TEES_HOODIES', label: 'Tees & Hoodies', skuCode: 'TEE' },
    { id: 'DENIMS_CARGOS', label: 'Denims & Cargos', skuCode: 'DENIM' },
    { id: 'JACKETS', label: 'Jackets & Layering', skuCode: 'JKT' },
    { id: 'COORDS', label: 'Co-ords & Tracksets', skuCode: 'CORD' },
    { id: 'ETHNIC_MEN', label: 'Kurtas & Festive', skuCode: 'KRTA' },
  ],
  WOMEN: [
    { id: 'TOPS_TEES', label: 'Tops & Graphic Tees', skuCode: 'TOP' },
    { id: 'DRESSES', label: 'Dresses & Jumpsuits', skuCode: 'DRSS' },
    { id: 'COORDS_DRESSES', label: 'Co-ord Sets', skuCode: 'CORD' },
    { id: 'CASUAL_SHIRTS', label: 'Shirts & Blouses', skuCode: 'SHIRT' },
    { id: 'DENIMS_CARGOS', label: 'Denims & Trousers', skuCode: 'DENIM' },
    { id: 'ETHNIC_WOMEN', label: 'Kurtis & Ethnic Sets', skuCode: 'KRTI' },
  ],
  UNISEX: [
    { id: 'TEES_HOODIES', label: 'Oversized Tees & Hoodies', skuCode: 'TEE' },
    { id: 'DENIMS_CARGOS', label: 'Baggy Denims & Cargos', skuCode: 'CARGO' },
    { id: 'CASUAL_SHIRTS', label: 'Boxy Streetwear Shirts', skuCode: 'SHIRT' },
    { id: 'JACKETS', label: 'Varsity & Bomber Jackets', skuCode: 'JKT' },
    { id: 'COORDS_DRESSES', label: 'Streetwear Co-ord Sets', skuCode: 'CORD' },
  ],
  ETHNIC: [
    { id: 'KURTA_SETS', label: 'Kurtas & Kurta Sets', skuCode: 'KRTA' },
    { id: 'SAREES', label: 'Sarees & Silk Drapes', skuCode: 'SARE' },
    { id: 'FESTIVE_COORDS', label: 'Indo-Western Co-ords', skuCode: 'INDW' },
    { id: 'LEHENGAS', label: 'Anarkalis & Lehengas', skuCode: 'ANRK' },
    { id: 'SHERWANIS', label: 'Nehru Jackets & Bandhgalas', skuCode: 'NHRU' },
  ],
};

const FIT_OPTIONS = [
  'Oversized / Boxy',
  'Relaxed Fit',
  'Regular Fit',
  'Slim / Tailored',
  'Cropped Fit',
];

const SIZE_SCALES = {
  APPAREL: [
    { size: 'XS', hint: 'Chest 36"' },
    { size: 'S', hint: 'Chest 38"' },
    { size: 'M', hint: 'Chest 40"' },
    { size: 'L', hint: 'Chest 42"' },
    { size: 'XL', hint: 'Chest 44"' },
    { size: 'XXL', hint: 'Chest 46"' },
  ],
  WAIST: [
    { size: '28', hint: 'Waist 28"' },
    { size: '30', hint: 'Waist 30"' },
    { size: '32', hint: 'Waist 32"' },
    { size: '34', hint: 'Waist 34"' },
    { size: '36', hint: 'Waist 36"' },
  ],
  FREE: [
    { size: 'FS', hint: 'One Size Fits All' },
  ],
};

const COLOR_SWATCHES = [
  { name: 'Jet Black', hex: '#141416', tone: 'Core' },
  { name: 'Crisp White', hex: '#FFFFFF', tone: 'Core' },
  { name: 'Ivory Cream', hex: '#F5F0E6', tone: 'Warm' },
  { name: 'Navy Blue', hex: '#1E293B', tone: 'Classic' },
  { name: 'Olive Green', hex: '#3F4E3A', tone: 'Earth' },
  { name: 'Charcoal Grey', hex: '#374151', tone: 'Neutral' },
  { name: 'Beige Khaki', hex: '#D6C5B3', tone: 'Earth' },
  { name: 'Sindhoor Crimson', hex: '#C4243A', tone: 'Statement' },
  { name: 'Powder Blue', hex: '#93C5FD', tone: 'Pastel' },
  { name: 'Sage Green', hex: '#84A98C', tone: 'Pastel' },
  { name: 'Chocolate Brown', hex: '#4A2C2A', tone: 'Deep' },
  { name: 'Mustard Gold', hex: '#D97706', tone: 'Vibrant' },
];

const FABRIC_OPTIONS = [
  '100% Combed Cotton',
  'Heavyweight 240 GSM',
  'Oxford Cotton',
  'Linen Blend',
  'Stretch Denim',
  'Cotton Twill',
  'Rayon / Viscose',
  'Pure Silk / Handloom',
];

const OCCASION_OPTIONS = [
  'Everyday Casual',
  'Streetwear',
  'Smart / Office',
  'Party & Evening',
  'Festive Wear',
];

const CARE_OPTIONS = [
  'Machine Wash Cold',
  'Gentle Hand Wash',
  'Dry Clean Only',
];

const SAMPLE_LOOKBOOK_PRESETS = [
  {
    id: 'preset-black-shirt',
    label: 'Black Shirt',
    title: 'Jet Black Relaxed Oxford Shirt',
    dept: 'MEN',
    category: 'CASUAL_SHIRTS',
    fit: 'Relaxed Fit',
    price: '1299',
    color: 'Jet Black',
    fabric: 'Oxford Cotton',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-graphic-tee',
    label: 'Oversized Tee',
    title: 'Heavyweight Boxy Drop-Shoulder Tee',
    dept: 'UNISEX',
    category: 'TEES_HOODIES',
    fit: 'Oversized / Boxy',
    price: '999',
    color: 'Jet Black',
    fabric: 'Heavyweight 240 GSM',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-cargo-denim',
    label: 'Cargo / Denim',
    title: 'Straight-Leg Utility Cargo Pants',
    dept: 'UNISEX',
    category: 'DENIMS_CARGOS',
    fit: 'Relaxed Fit',
    price: '1699',
    color: 'Olive Green',
    fabric: 'Cotton Twill',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-coord-set',
    label: 'Co-ord Set',
    title: 'Linen Relaxed Summer Co-ord Set',
    dept: 'WOMEN',
    category: 'COORDS_DRESSES',
    fit: 'Relaxed Fit',
    price: '1899',
    color: 'Ivory Cream',
    fabric: 'Linen Blend',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-ethnic',
    label: 'Festive Kurta',
    title: 'Handloom Silk Embroidered Kurta Set',
    dept: 'ETHNIC',
    category: 'KURTA_SETS',
    fit: 'Regular Fit',
    price: '2499',
    color: 'Sindhoor Crimson',
    fabric: 'Pure Silk / Handloom',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80',
  },
];

const QUICK_PRICES = [599, 799, 999, 1299, 1499, 1999, 2499];
const DISCOUNT_PRESETS = [
  { label: 'No Discount', pct: 0 },
  { label: '15% OFF', pct: 15 },
  { label: '25% OFF', pct: 25 },
  { label: '35% OFF', pct: 35 },
  { label: '50% OFF', pct: 50 },
];

export default function ProductIngestionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const vendorProfile = useAuthStore((s) => s.vendorProfile);
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  const shopName =
    vendorProfile?.shopName ||
    vendorProfile?.storeName ||
    profile?.shopName ||
    user?.displayName ||
    'Urban Threads';

  const shopArea =
    vendorProfile?.address?.area ||
    profile?.address?.area ||
    'MIHAN Airport';

  const shopInitials = useMemo(() => {
    const words = shopName.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return shopName.slice(0, 3).toUpperCase();
  }, [shopName]);

  // Form State
  const [activeStep, setActiveStep] = useState(1);
  const [productName, setProductName] = useState('');
  const [department, setDepartment] = useState('MEN');
  const [category, setCategory] = useState('CASUAL_SHIRTS');
  const [fitStyle, setFitStyle] = useState('Relaxed Fit');
  const [skuSuffix, setSkuSuffix] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [customSku, setCustomSku] = useState('');

  // Pricing State
  const [sellingPrice, setSellingPrice] = useState('1299');
  const [discountPct, setDiscountPct] = useState(25);
  const [customMrp, setCustomMrp] = useState('');

  // Size & Stock State
  const [sizeScale, setSizeScale] = useState('APPAREL');
  const [sizeStock, setSizeStock] = useState({
    S: 2,
    M: 3,
    L: 3,
    XL: 2,
  });

  // Colors & Specs State
  const [selectedColors, setSelectedColors] = useState([
    { name: 'Jet Black', hex: '#141416', tone: 'Core' },
  ]);
  const [customColorName, setCustomColorName] = useState('');
  const [fabric, setFabric] = useState('100% Combed Cotton');
  const [occasion, setOccasion] = useState('Everyday Casual');
  const [care, setCare] = useState('Machine Wash Cold');
  const [description, setDescription] = useState('');

  // Photos State (starts clean - no dummy default photo)
  const [photos, setPhotos] = useState([]);

  // UI Feedback State
  const [toastMsg, setToastMsg] = useState('');
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollRef = useRef(null);
  const sectionOffsetsRef = useRef({});
  const fileInputGalleryRef = useRef(null);
  const fileInputCameraRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg('');
    }, 2800);
  };

  // Load saved draft if present
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setHasSavedDraft(true);
          }
        }
      } catch (e) {}
    }
  }, []);

  const currentDeptCategories = useMemo(
    () => CATEGORIES_BY_DEPT[department] || CATEGORIES_BY_DEPT.MEN,
    [department]
  );

  const activeCategoryObj = useMemo(
    () => currentDeptCategories.find((c) => c.id === category) || currentDeptCategories[0],
    [currentDeptCategories, category]
  );

  const computedSku = useMemo(() => {
    if (customSku.trim()) return customSku.trim().toUpperCase();
    const catCode = activeCategoryObj?.skuCode || 'FIT';
    return `${shopInitials}-${catCode}-${skuSuffix}`;
  }, [customSku, shopInitials, activeCategoryObj, skuSuffix]);

  // Pricing Calculations
  const numericPrice = useMemo(() => {
    const n = parseInt(String(sellingPrice).replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [sellingPrice]);

  const numericMrp = useMemo(() => {
    if (customMrp.trim()) {
      const m = parseInt(String(customMrp).replace(/[^0-9]/g, ''), 10);
      if (Number.isFinite(m) && m >= numericPrice) return m;
    }
    if (numericPrice <= 0) return 0;
    if (discountPct <= 0) return numericPrice;
    return Math.round(numericPrice / (1 - discountPct / 100));
  }, [customMrp, numericPrice, discountPct]);

  const effectiveDiscountPct = useMemo(() => {
    if (numericMrp <= numericPrice || numericMrp <= 0) return 0;
    return Math.round(((numericMrp - numericPrice) / numericMrp) * 100);
  }, [numericMrp, numericPrice]);

  const customerSavings = Math.max(0, numericMrp - numericPrice);
  const platformFee = Math.round(numericPrice * 0.05);
  const netVendorPayout = Math.max(0, numericPrice - platformFee);

  // Stock Calculations
  const activeSizeEntries = useMemo(
    () => Object.entries(sizeStock).filter(([, qty]) => qty > 0),
    [sizeStock]
  );

  const totalStockPieces = useMemo(
    () => activeSizeEntries.reduce((sum, [, qty]) => sum + qty, 0),
    [activeSizeEntries]
  );

  // Step Completion Tracking
  const stepCompletion = useMemo(() => {
    const s1 = productName.trim().length >= 2 && Boolean(department) && Boolean(category);
    const s2 = numericPrice >= 99;
    const s3 = activeSizeEntries.length >= 1 && totalStockPieces >= 1;
    const s4 = selectedColors.length >= 1 && Boolean(fabric);
    const s5 = photos.length >= 1;
    return {
      1: s1,
      2: s2,
      3: s3,
      4: s4,
      5: s5,
      completedCount: [s1, s2, s3, s4, s5].filter(Boolean).length,
      isReady: s1 && s2 && s3 && s4 && s5,
    };
  }, [productName, department, category, numericPrice, activeSizeEntries, totalStockPieces, selectedColors, fabric, photos]);

  // Handlers
  const handleSelectDepartment = (deptId) => {
    setDepartment(deptId);
    const nextCats = CATEGORIES_BY_DEPT[deptId] || CATEGORIES_BY_DEPT.MEN;
    if (!nextCats.some((c) => c.id === category)) {
      setCategory(nextCats[0].id);
    }
  };

  const handleSuggestTitle = () => {
    const primaryColor = selectedColors[0]?.name || 'Classic';
    const fitShort = fitStyle.split('/')[0].trim();
    const catClean = (activeCategoryObj?.label || 'Garment')
      .replace(/&.*$/, '')
      .replace(/s$/, '')
      .trim();
    const suggested = `${primaryColor} ${fitShort} ${catClean}`;
    setProductName(suggested);
    showToast(`Suggested name: "${suggested}"`);
  };

  const handleAutoWriteDescription = () => {
    const colorNames = selectedColors.map((c) => c.name).join(', ') || 'Classic shade';
    const sizeList = activeSizeEntries.map(([sz]) => sz).join(', ') || 'S, M, L, XL';
    const generated = `${fitStyle} ${(activeCategoryObj?.label || 'piece').toLowerCase()} crafted in ${fabric.toLowerCase()}. Available in ${colorNames} (${sizeList}). Ideal for ${occasion.toLowerCase()}. ${care}. Ready for 45-minute express doorstep delivery across Nagpur from ${shopName}.`;
    setDescription(generated);
    showToast('Product description generated from your selections.');
  };

  const handleApplyPreset = (preset) => {
    setProductName(preset.title);
    setDepartment(preset.dept);
    setCategory(preset.category);
    setFitStyle(preset.fit);
    setSellingPrice(preset.price);
    setCustomMrp('');
    setDiscountPct(25);
    setFabric(preset.fabric);
    const matchedSwatch = COLOR_SWATCHES.find((c) => c.name === preset.color) || COLOR_SWATCHES[0];
    setSelectedColors([matchedSwatch]);
    setPhotos([
      { id: `preset-${Date.now()}`, uri: preset.image, label: preset.label, isPreset: true },
    ]);
    showToast(`Applied "${preset.label}" template`);
  };

  const handleToggleSize = (sizeKey) => {
    setSizeStock((prev) => {
      const next = { ...prev };
      if (next[sizeKey] && next[sizeKey] > 0) {
        delete next[sizeKey];
      } else {
        next[sizeKey] = 2;
      }
      return next;
    });
  };

  const handleAdjustSizeQty = (sizeKey, delta) => {
    setSizeStock((prev) => {
      const cur = prev[sizeKey] || 0;
      const updated = Math.max(0, Math.min(99, cur + delta));
      const next = { ...prev };
      if (updated === 0) {
        delete next[sizeKey];
      } else {
        next[sizeKey] = updated;
      }
      return next;
    });
  };

  const handleBulkSelectSizes = (mode) => {
    const scaleItems = SIZE_SCALES[sizeScale] || SIZE_SCALES.APPAREL;
    if (mode === 'popular') {
      if (sizeScale === 'APPAREL') {
        setSizeStock({ S: 2, M: 3, L: 3, XL: 2 });
      } else if (sizeScale === 'WAIST') {
        setSizeStock({ '30': 2, '32': 3, '34': 3, '36': 2 });
      } else {
        setSizeStock({ FS: 5 });
      }
      showToast('Selected core sizes with standard boutique stock.');
    } else if (mode === 'set3') {
      const next = {};
      scaleItems.forEach((item) => {
        if (sizeStock[item.size] > 0 || ['S', 'M', 'L', 'XL', '30', '32', '34', 'FS'].includes(item.size)) {
          next[item.size] = 3;
        }
      });
      setSizeStock(next);
      showToast('Set active sizes to 3 pieces each.');
    } else if (mode === 'clear') {
      setSizeStock({});
    }
  };

  const handleToggleColor = (swatch) => {
    setSelectedColors((prev) => {
      const exists = prev.some((c) => c.name === swatch.name);
      if (exists) {
        if (prev.length === 1) {
          showToast('At least 1 color stays selected.');
          return prev;
        }
        return prev.filter((c) => c.name !== swatch.name);
      }
      return [...prev, swatch];
    });
  };

  const handleAddCustomColor = () => {
    const trimmed = customColorName.trim();
    if (!trimmed) {
      showToast('Type a custom shade name first.');
      return;
    }
    if (selectedColors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`${trimmed} is already added.`);
      return;
    }
    setSelectedColors((prev) => [
      ...prev,
      { name: trimmed, hex: '#C4243A', tone: 'Custom' },
    ]);
    setCustomColorName('');
    showToast(`Added custom shade: ${trimmed}`);
  };

  const handleWebFileSelect = (event) => {
    const files = Array.from(event?.target?.files || []);
    if (!files.length) return;

    Promise.all(
      files.slice(0, 5).map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const resultUri = e?.target?.result;
            if (typeof resultUri === 'string') {
              resolve({
                id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                uri: resultUri,
                label: file.name ? file.name.slice(0, 14) : 'Uploaded Photo',
              });
            } else {
              resolve(null);
            }
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      })
    ).then((newItems) => {
      const validNew = newItems.filter(Boolean);
      if (!validNew.length) return;
      setPhotos((prev) => {
        // Strip any sample/preset/default photos as soon as real photos are uploaded
        const cleanPrev = prev.filter(
          (p) => !p.isPreset && !p.id?.startsWith('preset-') && p.id !== 'default-cover'
        );
        return [...cleanPrev, ...validNew].slice(0, 5);
      });
      showToast(`${validNew.length} photo${validNew.length > 1 ? 's' : ''} added to listing.`);
    });

    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemovePhoto = (photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleMakeCoverPhoto = (index) => {
    if (index <= 0) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      return [chosen, ...copy];
    });
    showToast('Updated cover photo.');
  };

  const handleSaveDraft = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const draftPayload = {
          productName,
          department,
          category,
          fitStyle,
          sellingPrice,
          discountPct,
          customMrp,
          sizeStock,
          selectedColors,
          fabric,
          occasion,
          care,
          description,
          savedAt: Date.now(),
        };
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
        setHasSavedDraft(true);
        showToast('Draft saved locally for your store.');
      } catch (e) {
        showToast('Draft saved.');
      }
    } else {
      setHasSavedDraft(true);
      showToast('Draft saved.');
    }
  };

  const handleLoadDraft = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) {
          showToast('No saved draft found. Use "Save Draft" below to save your progress.');
          return;
        }
        const d = JSON.parse(raw);
        if (d.productName !== undefined) setProductName(d.productName);
        if (d.department) setDepartment(d.department);
        if (d.category) setCategory(d.category);
        if (d.fitStyle) setFitStyle(d.fitStyle);
        if (d.sellingPrice) setSellingPrice(d.sellingPrice);
        if (d.discountPct !== undefined) setDiscountPct(d.discountPct);
        if (d.customMrp !== undefined) setCustomMrp(d.customMrp);
        if (d.sizeStock) setSizeStock(d.sizeStock);
        if (Array.isArray(d.selectedColors) && d.selectedColors.length) setSelectedColors(d.selectedColors);
        if (d.fabric) setFabric(d.fabric);
        if (d.occasion) setOccasion(d.occasion);
        if (d.care) setCare(d.care);
        if (d.description !== undefined) setDescription(d.description);
        showToast('Restored your saved listing draft.');
      } catch (e) {
        showToast('Could not restore draft.');
      }
    }
  };

  const scrollToStep = (stepNumber) => {
    setActiveStep(stepNumber);
    const y = sectionOffsetsRef.current[stepNumber];
    if (scrollRef.current && typeof y === 'number') {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  };

  const handlePublishProduct = async () => {
    if (isSubmitting) return;

    const cleanTitle = productName.trim();
    if (cleanTitle.length < 2) {
      scrollToStep(1);
      showToast('Please enter a Product Name (e.g., Black Oxford Shirt) in Step 1.');
      return;
    }
    if (numericPrice < 99) {
      scrollToStep(2);
      showToast('Please enter a valid Selling Price (₹99 or above) in Step 2.');
      return;
    }
    if (activeSizeEntries.length === 0 || totalStockPieces <= 0) {
      scrollToStep(3);
      showToast('Please select at least 1 size with stock in Step 3.');
      return;
    }
    if (photos.length === 0) {
      scrollToStep(5);
      showToast('Please snap or upload at least 1 photo of your garment in Step 5.');
      return;
    }

    setIsSubmitting(true);

    const coverUri =
      photos[0]?.uri ||
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80';
    const imageList = photos.length > 0 ? photos.map((p) => p.uri) : [coverUri];
    const sizeNames = activeSizeEntries.map(([sz]) => sz);
    const sizeObjects = activeSizeEntries.map(([sz, stock]) => ({ size: sz, stock }));
    const finalDesc =
      description.trim() ||
      `${fitStyle} · ${fabric} · ${selectedColors.map((c) => c.name).join(', ')} · ${care}`;

    const newProductItem = {
      _id: `prod-ngp-${Date.now()}`,
      id: `prod-ngp-${Date.now()}`,
      name: cleanTitle,
      title: cleanTitle,
      department,
      category: activeCategoryObj?.label || category,
      categoryId: category,
      fit: fitStyle,
      price: numericPrice,
      mrp: numericMrp,
      discountPct: effectiveDiscountPct,
      brand: shopName,
      storeName: shopName,
      storeArea: shopArea,
      images: imageList,
      image: coverUri,
      isAvailable: true,
      stock: totalStockPieces,
      sizes: sizeNames,
      sizeInventory: sizeObjects,
      colors: selectedColors.map((c) => c.name),
      colorSwatches: selectedColors,
      fabric,
      occasion,
      care,
      description: finalDesc,
      sku: computedSku,
      createdAt: new Date().toISOString(),
    };

    // 1. Immediately update Vendor Catalog Store so Catalogue tab shows the new piece live
    useVendorStore.setState((state) => ({
      products: [newProductItem, ...(Array.isArray(state.products) ? state.products : [])],
    }));

    // 2. Immediately update Customer Storefront Store
    useStorefrontStore.setState((state) => ({
      products: [newProductItem, ...(Array.isArray(state.products) ? state.products : [])],
    }));

    // 3. Best-effort backend sync
    try {
      await createProduct({
        name: cleanTitle,
        category: activeCategoryObj?.label || category,
        price: numericPrice,
        mrp: numericMrp,
        sizes: sizeObjects,
        images: imageList,
        description: finalDesc,
        sku: computedSku,
        isAvailable: true,
      });
    } catch (err) {
      // Optimistic local state is already updated
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}
    }

    showToast(`Published "${cleanTitle}" (${totalStockPieces} pcs) to ${shopName}!`);
    setTimeout(() => {
      setIsSubmitting(false);
      if (navigation) {
        navigation.navigate('CatalogManager');
      }
    }, 450);
  };

  // Theme Palette (matching Queue, Catalogue, Analytics, and Store 1:1)
  const bgColor = isDark ? '#131315' : '#FAF9F5';
  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E3DC';
  const elevatedBg = isDark ? '#202024' : '#F4F4F0';
  const inputBg = isDark ? '#141417' : '#F8F7F3';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#DFDDD4';
  const textPrimary = isDark ? '#F5F5F4' : '#121215';
  const textSecondary = isDark ? '#A8A29E' : '#4A4950';
  const textMuted = isDark ? '#78716C' : '#7E7C85';
  const crimson = '#C4243A';
  const gold = isDark ? '#C8A24A' : '#946C18';
  const emerald = isDark ? '#34D399' : '#059669';

  const STEPS = [
    { num: 1, label: '1. Identity', title: 'Garment Identity', done: stepCompletion[1] },
    { num: 2, label: '2. Pricing', title: 'Pricing & Payout', done: stepCompletion[2] },
    { num: 3, label: '3. Sizes & Stock', title: 'Sizes & Stock', done: stepCompletion[3] },
    { num: 4, label: '4. Colors & Specs', title: 'Colors & Details', done: stepCompletion[4] },
    { num: 5, label: '5. Photos', title: 'Product Photos', done: stepCompletion[5] },
  ];

  const activeStepObj = STEPS.find((s) => s.num === activeStep) || STEPS[0];

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Hidden Web File Inputs for Real Camera & Gallery Upload */}
      {Platform.OS === 'web' && (
        <>
          <input
            ref={fileInputGalleryRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleWebFileSelect}
          />
          <input
            ref={fileInputCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleWebFileSelect}
          />
        </>
      )}

      {/* 1. Unified Top Header */}
      <View
        style={[
          styles.headerRoot,
          {
            paddingTop: Platform.OS === 'web' ? 0 : Math.max(insets.top, 8),
            backgroundColor: isDark ? 'rgba(19, 19, 21, 0.92)' : 'rgba(250, 249, 245, 0.92)',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E5E3DC',
          },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <PressableScale
              onPress={() => {
                if (navigation?.canGoBack?.()) {
                  navigation.goBack();
                } else if (navigation) {
                  navigation.navigate('CatalogManager');
                }
              }}
              style={[
                styles.backBtn,
                {
                  backgroundColor: elevatedBg,
                  borderColor: cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Back to Catalogue"
            >
              <Feather name="chevron-left" size={18} color={textPrimary} />
            </PressableScale>

            <View
              style={[
                styles.emblemBox,
                {
                  backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(200, 162, 74, 0.30)' : 'rgba(179, 138, 43, 0.35)',
                },
              ]}
            >
              <Image
                source={
                  Platform.OS === 'web'
                    ? { uri: LOGO_DATA_URI }
                    : require('../../../assets/images/brand-emblem.png')
                }
                style={styles.emblemImg}
                resizeMode="cover"
              />
            </View>

            <View style={styles.headerTitleCol}>
              <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>
                Add Product
              </Text>
              <View style={styles.headerSubRow}>
                <View style={[styles.liveDot, { backgroundColor: emerald }]} />
                <Text style={[styles.headerSubtitle, { color: textSecondary }]} numberOfLines={1}>
                  {shopName} · {shopArea}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <PressableScale
              onPress={hasSavedDraft ? handleLoadDraft : handleSaveDraft}
              style={[
                styles.draftBtn,
                {
                  backgroundColor: elevatedBg,
                  borderColor: hasSavedDraft ? 'rgba(200, 162, 74, 0.45)' : cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save or restore draft"
            >
              <Feather name="bookmark" size={12} color={gold} />
              <Text style={[styles.draftBtnText, { color: textPrimary }]}>
                {hasSavedDraft ? 'Restore' : 'Draft'}
              </Text>
              <View
                style={[
                  styles.draftCountBadge,
                  { backgroundColor: isDark ? 'rgba(200, 162, 74, 0.20)' : 'rgba(148, 108, 24, 0.12)' },
                ]}
              >
                <Text style={[styles.draftCountText, { color: gold }]}>
                  {hasSavedDraft ? '1' : '0'}
                </Text>
              </View>
            </PressableScale>

            <PressableScale
              onPress={() => setIsHelpOpen(true)}
              style={[
                styles.helpBtn,
                {
                  backgroundColor: elevatedBg,
                  borderColor: cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Listing guide"
            >
              <Feather name="help-circle" size={15} color={textSecondary} />
            </PressableScale>
          </View>
        </View>
      </View>

      {/* 2. Sticky Stepper & Progress Bar */}
      <View
        style={[
          styles.stepperBar,
          {
            backgroundColor: isDark ? 'rgba(19, 19, 21, 0.95)' : 'rgba(250, 249, 245, 0.95)',
            borderBottomColor: cardBorder,
          },
        ]}
      >
        <View style={styles.stepperInner}>
          <View style={styles.stepperTopRow}>
            <View style={styles.stepTitleGroup}>
              <Text style={[styles.stepCounterText, { color: crimson }]}>
                STEP {activeStep} OF 5
              </Text>
              <Text style={[styles.stepDot, { color: textMuted }]}>·</Text>
              <Text style={[styles.stepActiveName, { color: gold }]}>
                {activeStepObj.title}
              </Text>
            </View>
            <View
              style={[
                styles.dispatchBadge,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.30)' : '#A7F3D0',
                },
              ]}
            >
              <Feather name="zap" size={10} color={emerald} />
              <Text style={[styles.dispatchBadgeText, { color: emerald }]}>
                45-Min Express Ready
              </Text>
            </View>
          </View>

          {/* 5 Segmented Progress Bars */}
          <View style={styles.progressSegmentsRow}>
            {STEPS.map((st) => {
              const isCurrent = st.num === activeStep;
              const isDone = st.done;
              return (
                <PressableScale
                  key={st.num}
                  onPress={() => scrollToStep(st.num)}
                  wrapperStyle={{ flex: 1 }}
                  style={[
                    styles.progressSegment,
                    {
                      backgroundColor: isCurrent
                        ? crimson
                        : isDone
                        ? emerald
                        : isDark
                        ? '#2A2A2E'
                        : '#E5E3DC',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* High-Contrast Step Pills (Fixed Dark & Light Mode Contrast) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepPillsScroll}
          >
            {STEPS.map((st) => {
              const isCurrent = st.num === activeStep;
              const isDone = st.done;
              return (
                <PressableScale
                  key={st.num}
                  onPress={() => scrollToStep(st.num)}
                  style={[
                    styles.stepPill,
                    isCurrent
                      ? {
                          backgroundColor: crimson,
                          borderColor: crimson,
                        }
                      : isDone
                      ? {
                          backgroundColor: isDark ? '#1C2420' : '#F0FDF4',
                          borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : '#BBF7D0',
                        }
                      : {
                          backgroundColor: elevatedBg,
                          borderColor: cardBorder,
                        },
                  ]}
                >
                  {isDone && !isCurrent && (
                    <Feather name="check" size={11} color={emerald} />
                  )}
                  <Text
                    style={[
                      styles.stepPillText,
                      {
                        color: isCurrent
                          ? '#FFFFFF'
                          : isDone
                          ? isDark
                            ? '#D1FAE5'
                            : '#065F46'
                          : textSecondary,
                        fontWeight: isCurrent || isDone ? '600' : '500',
                      },
                    ]}
                  >
                    {st.label}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* 3. Main Scrollable Form Content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainColumn}>
          {/* Quick Preset Strip for 1-Tap Testing / Fast Template Fill */}
          <View
            style={[
              styles.quickTemplateBar,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={styles.quickTemplateHeader}>
              <View style={styles.quickTemplateTitleRow}>
                <Feather name="zap" size={13} color={gold} />
                <Text style={[styles.quickTemplateTitle, { color: textPrimary }]}>
                  1-Tap Quick Templates
                </Text>
              </View>
              <Text style={[styles.quickTemplateHint, { color: textMuted }]}>
                Tap to pre-fill sample garment
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickTemplateScroll}
            >
              {SAMPLE_LOOKBOOK_PRESETS.map((preset) => (
                <PressableScale
                  key={preset.id}
                  onPress={() => handleApplyPreset(preset)}
                  style={[
                    styles.templateChip,
                    {
                      backgroundColor: elevatedBg,
                      borderColor: cardBorder,
                    },
                  ]}
                >
                  <Image source={{ uri: preset.image }} style={styles.templateThumb} />
                  <View>
                    <Text style={[styles.templateChipLabel, { color: textPrimary }]}>
                      {preset.label}
                    </Text>
                    <Text style={[styles.templateChipPrice, { color: gold }]}>
                      ₹{preset.price}
                    </Text>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          </View>

          {/* ================================================================
              SECTION 1: GARMENT IDENTITY (Department, Category, Fit, Name)
          ================================================================ */}
          <View
            onLayout={(e) => {
              sectionOffsetsRef.current[1] = e.nativeEvent.layout.y;
            }}
            style={[
              styles.sectionCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.sectionHeaderLeft}>
                <View
                  style={[
                    styles.sectionNumCircle,
                    {
                      backgroundColor: isDark ? 'rgba(196, 36, 58, 0.20)' : '#FFF1F2',
                      borderColor: isDark ? 'rgba(196, 36, 58, 0.40)' : '#FECDD3',
                    },
                  ]}
                >
                  <Text style={[styles.sectionNumText, { color: isDark ? '#FDA4AF' : crimson }]}>
                    1
                  </Text>
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                    Garment Identity
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                    Product name, department &amp; category
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.sectionBadge,
                  {
                    backgroundColor: stepCompletion[1]
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : '#ECFDF5'
                      : isDark
                      ? 'rgba(200, 162, 74, 0.15)'
                      : '#FEF3C7',
                    borderColor: stepCompletion[1]
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.35)'
                        : '#A7F3D0'
                      : isDark
                      ? 'rgba(200, 162, 74, 0.35)'
                      : '#FDE68A',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionBadgeText,
                    { color: stepCompletion[1] ? emerald : gold },
                  ]}
                >
                  {stepCompletion[1] ? '✓ COMPLETE' : 'REQUIRED'}
                </Text>
              </View>
            </View>

            {/* Product Name Input + Smart Suggest */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Product Name <Text style={{ color: crimson }}>*</Text>
                </Text>
                <PressableScale onPress={handleSuggestTitle} style={styles.inlineActionBtn}>
                  <Feather name="zap" size={11} color={gold} />
                  <Text style={[styles.inlineActionText, { color: gold }]}>
                    Auto-Suggest Name
                  </Text>
                </PressableScale>
              </View>

              <View
                style={[
                  styles.textInputWrap,
                  {
                    backgroundColor: inputBg,
                    borderColor: productName.trim() ? crimson : inputBorder,
                  },
                ]}
              >
                <TextInput
                  value={productName}
                  onChangeText={(t) => {
                    setProductName(t);
                    setActiveStep(1);
                  }}
                  placeholder="e.g. Black Oversized Oxford Shirt, Baggy Cargo Jeans"
                  placeholderTextColor={textMuted}
                  style={[styles.textInput, { color: textPrimary }]}
                />
                {productName.length > 0 ? (
                  <PressableScale
                    onPress={() => setProductName('')}
                    style={styles.clearInputBtn}
                    accessibilityLabel="Clear product name"
                  >
                    <Feather name="x-circle" size={16} color={textMuted} />
                  </PressableScale>
                ) : (
                  <Feather name="edit-2" size={14} color={textMuted} />
                )}
              </View>
            </View>

            {/* Boutique Name (Real Logged-in Store) & Auto-SKU */}
            <View style={styles.twoColRow}>
              <View style={styles.halfCol}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Nagpur Boutique
                </Text>
                <View
                  style={[
                    styles.readOnlyBox,
                    {
                      backgroundColor: elevatedBg,
                      borderColor: cardBorder,
                    },
                  ]}
                >
                  <MaterialIcons name="storefront" size={15} color={gold} />
                  <Text
                    style={[styles.readOnlyText, { color: textPrimary }]}
                    numberOfLines={1}
                  >
                    {shopName}
                  </Text>
                </View>
              </View>

              <View style={styles.halfCol}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    SKU / Style Code
                  </Text>
                  <PressableScale
                    onPress={() => {
                      setCustomSku('');
                      setSkuSuffix(String(Math.floor(1000 + Math.random() * 9000)));
                      showToast('Generated new SKU code.');
                    }}
                  >
                    <Feather name="refresh-cw" size={12} color={gold} />
                  </PressableScale>
                </View>
                <View
                  style={[
                    styles.skuInputBox,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    value={customSku || computedSku}
                    onChangeText={setCustomSku}
                    placeholder={computedSku}
                    placeholderTextColor={textMuted}
                    style={[styles.skuInput, { color: textPrimary }]}
                  />
                </View>
              </View>
            </View>

            {/* Department / Audience (High-Contrast Chips) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Department / Audience <Text style={{ color: crimson }}>*</Text>
              </Text>
              <View style={styles.chipGrid}>
                {DEPARTMENTS.map((dept) => {
                  const isSelected = department === dept.id;
                  return (
                    <PressableScale
                      key={dept.id}
                      onPress={() => {
                        handleSelectDepartment(dept.id);
                        setActiveStep(1);
                      }}
                      style={[
                        styles.choiceChip,
                        isSelected
                          ? {
                              backgroundColor: crimson,
                              borderColor: crimson,
                            }
                          : {
                              backgroundColor: elevatedBg,
                              borderColor: inputBorder,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          {
                            color: isSelected ? '#FFFFFF' : textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {dept.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* Contextual Category Selector */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Category <Text style={{ color: crimson }}>*</Text>
                </Text>
                <Text style={[styles.contextHint, { color: textSecondary }]}>
                  Showing for {DEPARTMENTS.find((d) => d.id === department)?.label}
                </Text>
              </View>
              <View style={styles.chipGrid}>
                {currentDeptCategories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <PressableScale
                      key={cat.id}
                      onPress={() => {
                        setCategory(cat.id);
                        setActiveStep(1);
                      }}
                      style={[
                        styles.choiceChip,
                        isSelected
                          ? {
                              backgroundColor: crimson,
                              borderColor: crimson,
                            }
                          : {
                              backgroundColor: elevatedBg,
                              borderColor: inputBorder,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          {
                            color: isSelected ? '#FFFFFF' : textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* Fit / Silhouette Cut */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Fit / Silhouette Cut
              </Text>
              <View style={styles.chipGrid}>
                {FIT_OPTIONS.map((fit) => {
                  const isSelected = fitStyle === fit;
                  return (
                    <PressableScale
                      key={fit}
                      onPress={() => setFitStyle(fit)}
                      style={[
                        styles.choiceChipSm,
                        isSelected
                          ? {
                              backgroundColor: isDark ? 'rgba(200, 162, 74, 0.22)' : '#FEF3C7',
                              borderColor: gold,
                            }
                          : {
                              backgroundColor: elevatedBg,
                              borderColor: cardBorder,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipSmText,
                          {
                            color: isSelected ? (isDark ? '#FDE68A' : '#78350F') : textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {fit}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ================================================================
              SECTION 2: SMART PRICING & LIVE PAYOUT CALCULATOR
          ================================================================ */}
          <View
            onLayout={(e) => {
              sectionOffsetsRef.current[2] = e.nativeEvent.layout.y;
            }}
            style={[
              styles.sectionCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.sectionHeaderLeft}>
                <View
                  style={[
                    styles.sectionNumCircle,
                    {
                      backgroundColor: isDark ? 'rgba(196, 36, 58, 0.20)' : '#FFF1F2',
                      borderColor: isDark ? 'rgba(196, 36, 58, 0.40)' : '#FECDD3',
                    },
                  ]}
                >
                  <Text style={[styles.sectionNumText, { color: isDark ? '#FDA4AF' : crimson }]}>
                    2
                  </Text>
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                    Pricing &amp; Net Payout
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: textSecondary }]} numberOfLines={1}>
                    Customer price, MRP &amp; instant payout
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.sectionBadge,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
                  },
                ]}
              >
                <Text style={[styles.sectionBadgeText, { color: emerald }]}>
                  0% RIDER FEE
                </Text>
              </View>
            </View>

            {/* Quick Price Preset Pills */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Quick Price Presets
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPriceRow}
              >
                {QUICK_PRICES.map((qp) => {
                  const isAct = numericPrice === qp;
                  return (
                    <PressableScale
                      key={qp}
                      onPress={() => {
                        setSellingPrice(String(qp));
                        setCustomMrp('');
                        setActiveStep(2);
                      }}
                      style={[
                        styles.quickPricePill,
                        isAct
                          ? { backgroundColor: crimson, borderColor: crimson }
                          : { backgroundColor: elevatedBg, borderColor: inputBorder },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickPriceText,
                          {
                            color: isAct ? '#FFFFFF' : textPrimary,
                            fontWeight: isAct ? '700' : '600',
                          },
                        ]}
                      >
                        ₹{qp.toLocaleString('en-IN')}
                      </Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            </View>

            {/* Selling Price & MRP Side-by-Side */}
            <View style={styles.twoColRow}>
              <View style={styles.halfCol}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Selling Price (Customer Pays) <Text style={{ color: crimson }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.priceInputWrap,
                    {
                      backgroundColor: inputBg,
                      borderColor: crimson,
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: gold }]}>₹</Text>
                  <TextInput
                    value={sellingPrice}
                    onChangeText={(val) => {
                      setSellingPrice(val.replace(/[^0-9]/g, ''));
                      setActiveStep(2);
                    }}
                    keyboardType="numeric"
                    placeholder="1299"
                    placeholderTextColor={textMuted}
                    style={[styles.priceInput, { color: textPrimary }]}
                  />
                </View>
              </View>

              <View style={styles.halfCol}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Printed Tag MRP (₹)
                </Text>
                <View
                  style={[
                    styles.priceInputWrap,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: textSecondary }]}>₹</Text>
                  <TextInput
                    value={customMrp || (numericMrp > 0 ? String(numericMrp) : '')}
                    onChangeText={(val) => {
                      setCustomMrp(val.replace(/[^0-9]/g, ''));
                      setActiveStep(2);
                    }}
                    keyboardType="numeric"
                    placeholder={String(numericMrp || 1699)}
                    placeholderTextColor={textMuted}
                    style={[styles.priceInput, { color: textPrimary }]}
                  />
                </View>
              </View>
            </View>

            {/* Discount Preset Chips */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Tag Discount Preset
              </Text>
              <View style={styles.chipGrid}>
                {DISCOUNT_PRESETS.map((dp) => {
                  const isAct = !customMrp && discountPct === dp.pct;
                  return (
                    <PressableScale
                      key={dp.label}
                      onPress={() => {
                        setCustomMrp('');
                        setDiscountPct(dp.pct);
                        setActiveStep(2);
                      }}
                      style={[
                        styles.choiceChipSm,
                        isAct
                          ? {
                              backgroundColor: isDark ? 'rgba(200, 162, 74, 0.22)' : '#FEF3C7',
                              borderColor: gold,
                            }
                          : {
                              backgroundColor: elevatedBg,
                              borderColor: cardBorder,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipSmText,
                          {
                            color: isAct ? (isDark ? '#FDE68A' : '#78350F') : textSecondary,
                            fontWeight: isAct ? '700' : '500',
                          },
                        ]}
                      >
                        {dp.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* Live Payout & Margin Breakdown Box */}
            <View
              style={[
                styles.payoutCard,
                {
                  backgroundColor: elevatedBg,
                  borderColor: isDark ? 'rgba(200, 162, 74, 0.30)' : 'rgba(179, 138, 43, 0.30)',
                },
              ]}
            >
              <View style={styles.payoutTopRow}>
                <View style={styles.payoutTitleGroup}>
                  <Feather name="trending-up" size={14} color={gold} />
                  <Text style={[styles.payoutTitle, { color: textPrimary }]}>
                    LIVE EARNINGS &amp; SETTLEMENT BREAKDOWN
                  </Text>
                </View>
                {effectiveDiscountPct > 0 && (
                  <View style={[styles.discountTag, { backgroundColor: crimson }]}>
                    <Text style={styles.discountTagText}>{effectiveDiscountPct}% OFF</Text>
                  </View>
                )}
              </View>

              <View style={styles.payoutMetricsRow}>
                <View
                  style={[
                    styles.payoutMetricBox,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                >
                  <Text style={[styles.payoutMetricLabel, { color: textSecondary }]}>
                    Tag MRP
                  </Text>
                  <Text style={[styles.payoutMetricValStrike, { color: textMuted }]}>
                    ₹{numericMrp.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View
                  style={[
                    styles.payoutMetricBox,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                >
                  <Text style={[styles.payoutMetricLabel, { color: textSecondary }]}>
                    Buyer Saves
                  </Text>
                  <Text style={[styles.payoutMetricVal, { color: emerald }]}>
                    ₹{customerSavings.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View
                  style={[
                    styles.payoutMetricBox,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.10)' : '#ECFDF5',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.30)' : '#A7F3D0',
                    },
                  ]}
                >
                  <Text style={[styles.payoutMetricLabel, { color: emerald }]}>
                    Your Net Payout
                  </Text>
                  <Text style={[styles.payoutMetricValBold, { color: emerald }]}>
                    ₹{netVendorPayout.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={[styles.feeNoteRow, { borderTopColor: cardBorder }]}>
                <Text style={[styles.feeNoteText, { color: textSecondary }]}>
                  Platform Fee (5%): ₹{platformFee} · 45-Min Express Rider: ₹0 (Free for {shopName})
                </Text>
              </View>
            </View>
          </View>

          {/* ================================================================
              SECTION 3: SIZE & INVENTORY MATRIX
          ================================================================ */}
          <View
            onLayout={(e) => {
              sectionOffsetsRef.current[3] = e.nativeEvent.layout.y;
            }}
            style={[
              styles.sectionCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.sectionHeaderLeft}>
                <View
                  style={[
                    styles.sectionNumCircle,
                    {
                      backgroundColor: isDark ? 'rgba(196, 36, 58, 0.20)' : '#FFF1F2',
                      borderColor: isDark ? 'rgba(196, 36, 58, 0.40)' : '#FECDD3',
                    },
                  ]}
                >
                  <Text style={[styles.sectionNumText, { color: isDark ? '#FDA4AF' : crimson }]}>
                    3
                  </Text>
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                    Sizes &amp; Stock Matrix
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                    Tap sizes in stock and adjust quantities
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.sectionBadge,
                  {
                    backgroundColor:
                      totalStockPieces > 0
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.15)'
                          : '#ECFDF5'
                        : elevatedBg,
                    borderColor:
                      totalStockPieces > 0
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.35)'
                          : '#A7F3D0'
                        : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionBadgeText,
                    { color: totalStockPieces > 0 ? emerald : textSecondary },
                  ]}
                >
                  {totalStockPieces} PCS · {activeSizeEntries.length} SIZES
                </Text>
              </View>
            </View>

            {/* Size Scale Switcher */}
            <View style={styles.scaleTabRow}>
              {[
                { id: 'APPAREL', label: 'Apparel (XS–XXL)' },
                { id: 'WAIST', label: 'Waist (28–36)' },
                { id: 'FREE', label: 'Free Size' },
              ].map((sc) => {
                const isAct = sizeScale === sc.id;
                return (
                  <PressableScale
                    key={sc.id}
                    onPress={() => {
                      setSizeScale(sc.id);
                      if (sc.id === 'FREE') {
                        setSizeStock({ FS: 5 });
                      } else if (sc.id === 'WAIST') {
                        setSizeStock({ '30': 2, '32': 3, '34': 3 });
                      } else {
                        setSizeStock({ S: 2, M: 3, L: 3, XL: 2 });
                      }
                      setActiveStep(3);
                    }}
                    wrapperStyle={{ flex: 1 }}
                    style={[
                      styles.scaleTabBtn,
                      isAct
                        ? { backgroundColor: crimson, borderColor: crimson }
                        : { backgroundColor: elevatedBg, borderColor: cardBorder },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scaleTabText,
                        {
                          color: isAct ? '#FFFFFF' : textSecondary,
                          fontWeight: isAct ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {sc.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {/* Bulk Quick Actions */}
            <View style={styles.bulkActionsRow}>
              <PressableScale
                onPress={() => handleBulkSelectSizes('popular')}
                style={[styles.bulkBtn, { backgroundColor: elevatedBg, borderColor: cardBorder }]}
              >
                <Feather name="check-circle" size={11} color={gold} />
                <Text style={[styles.bulkBtnText, { color: textPrimary }]}>
                  Select Core Sizes
                </Text>
              </PressableScale>
              <PressableScale
                onPress={() => handleBulkSelectSizes('set3')}
                style={[styles.bulkBtn, { backgroundColor: elevatedBg, borderColor: cardBorder }]}
              >
                <Feather name="layers" size={11} color={gold} />
                <Text style={[styles.bulkBtnText, { color: textPrimary }]}>
                  Set All = 3 pcs
                </Text>
              </PressableScale>
              <PressableScale
                onPress={() => handleBulkSelectSizes('clear')}
                style={[styles.bulkBtn, { backgroundColor: elevatedBg, borderColor: cardBorder }]}
              >
                <Text style={[styles.bulkBtnText, { color: textMuted }]}>Clear</Text>
              </PressableScale>
            </View>

            {/* Size Pill Toggles */}
            <View style={styles.sizePillRow}>
              {(SIZE_SCALES[sizeScale] || SIZE_SCALES.APPAREL).map((item) => {
                const qty = sizeStock[item.size] || 0;
                const isSelected = qty > 0;
                return (
                  <PressableScale
                    key={item.size}
                    onPress={() => {
                      handleToggleSize(item.size);
                      setActiveStep(3);
                    }}
                    style={[
                      styles.sizeTogglePill,
                      isSelected
                        ? { backgroundColor: crimson, borderColor: crimson }
                        : { backgroundColor: elevatedBg, borderColor: inputBorder },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sizeToggleText,
                        { color: isSelected ? '#FFFFFF' : textPrimary },
                      ]}
                    >
                      {item.size}
                    </Text>
                    <Text
                      style={[
                        styles.sizeToggleSub,
                        { color: isSelected ? 'rgba(255,255,255,0.85)' : textMuted },
                      ]}
                    >
                      {isSelected ? `${qty} pcs` : 'Off'}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {/* Active Size Stepper Rows */}
            <View style={styles.sizeRowsList}>
              {(SIZE_SCALES[sizeScale] || SIZE_SCALES.APPAREL)
                .filter((item) => (sizeStock[item.size] || 0) > 0)
                .map((item) => {
                  const qty = sizeStock[item.size] || 0;
                  return (
                    <View
                      key={item.size}
                      style={[
                        styles.sizeStepperRow,
                        {
                          backgroundColor: elevatedBg,
                          borderColor: cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.sizeRowLeft}>
                        <View style={[styles.sizeBadgeBox, { backgroundColor: crimson }]}>
                          <Text style={styles.sizeBadgeText}>{item.size}</Text>
                        </View>
                        <View>
                          <Text style={[styles.sizeRowTitle, { color: textPrimary }]}>
                            Size {item.size} · {item.hint}
                          </Text>
                          <Text style={[styles.sizeRowReady, { color: emerald }]}>
                            ✓ Ready for 45-min dispatch
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.stepperControls,
                          {
                            backgroundColor: cardBg,
                            borderColor: inputBorder,
                          },
                        ]}
                      >
                        <PressableScale
                          onPress={() => handleAdjustSizeQty(item.size, -1)}
                          style={[styles.stepperBtn, { backgroundColor: elevatedBg }]}
                          accessibilityLabel={`Decrease size ${item.size}`}
                        >
                          <Feather name="minus" size={13} color={textPrimary} />
                        </PressableScale>
                        <Text style={[styles.stepperQtyText, { color: textPrimary }]}>
                          {qty}
                        </Text>
                        <PressableScale
                          onPress={() => handleAdjustSizeQty(item.size, 1)}
                          style={[styles.stepperBtn, { backgroundColor: elevatedBg }]}
                          accessibilityLabel={`Increase size ${item.size}`}
                        >
                          <Feather name="plus" size={13} color={textPrimary} />
                        </PressableScale>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>

          {/* ================================================================
              SECTION 4: COLORS, FABRIC & SPECIFICATIONS
          ================================================================ */}
          <View
            onLayout={(e) => {
              sectionOffsetsRef.current[4] = e.nativeEvent.layout.y;
            }}
            style={[
              styles.sectionCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.sectionHeaderLeft}>
                <View
                  style={[
                    styles.sectionNumCircle,
                    {
                      backgroundColor: isDark ? 'rgba(196, 36, 58, 0.20)' : '#FFF1F2',
                      borderColor: isDark ? 'rgba(196, 36, 58, 0.40)' : '#FECDD3',
                    },
                  ]}
                >
                  <Text style={[styles.sectionNumText, { color: isDark ? '#FDA4AF' : crimson }]}>
                    4
                  </Text>
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                    Colors &amp; Specifications
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                    Color swatches, fabric, occasion &amp; care
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.sectionBadge,
                  {
                    backgroundColor: elevatedBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Text style={[styles.sectionBadgeText, { color: gold }]}>
                  {selectedColors.length} {selectedColors.length === 1 ? 'COLOR' : 'COLORS'}
                </Text>
              </View>
            </View>

            {/* Color Swatches Grid */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Select Garment Colors <Text style={{ color: crimson }}>*</Text>
              </Text>
              <View style={styles.swatchGrid}>
                {COLOR_SWATCHES.map((sw) => {
                  const isSelected = selectedColors.some((c) => c.name === sw.name);
                  return (
                    <PressableScale
                      key={sw.name}
                      onPress={() => {
                        handleToggleColor(sw);
                        setActiveStep(4);
                      }}
                      wrapperStyle={{ width: '48%', flexGrow: 1 }}
                      style={[
                        styles.swatchCard,
                        isSelected
                          ? {
                              backgroundColor: isDark ? 'rgba(196, 36, 58, 0.16)' : '#FFF1F2',
                              borderColor: crimson,
                            }
                          : {
                              backgroundColor: elevatedBg,
                              borderColor: cardBorder,
                            },
                      ]}
                    >
                      <View
                        style={[
                          styles.swatchCircle,
                          {
                            backgroundColor: sw.hex,
                            borderColor:
                              sw.hex === '#FFFFFF' || sw.hex === '#F5F0E6'
                                ? '#D6D3D1'
                                : 'rgba(255,255,255,0.2)',
                          },
                        ]}
                      >
                        {isSelected && (
                          <Feather
                            name="check"
                            size={11}
                            color={
                              sw.hex === '#FFFFFF' || sw.hex === '#F5F0E6' || sw.hex === '#D6C5B3'
                                ? '#121215'
                                : '#FFFFFF'
                            }
                          />
                        )}
                      </View>
                      <View style={styles.swatchTextCol}>
                        <Text
                          style={[
                            styles.swatchName,
                            {
                              color: textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {sw.name}
                        </Text>
                        <Text style={[styles.swatchTone, { color: textMuted }]}>
                          {sw.tone}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>

              {/* Custom Color Input */}
              <View style={styles.customColorRow}>
                <TextInput
                  value={customColorName}
                  onChangeText={setCustomColorName}
                  placeholder="Or type custom shade (e.g. Washed Indigo)..."
                  placeholderTextColor={textMuted}
                  style={[
                    styles.customColorInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: textPrimary,
                    },
                  ]}
                />
                <PressableScale
                  onPress={handleAddCustomColor}
                  style={[styles.customColorAddBtn, { backgroundColor: crimson }]}
                >
                  <Feather name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.customColorAddText}>Add</Text>
                </PressableScale>
              </View>
            </View>

            {/* Fabric & Material */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Fabric &amp; Material <Text style={{ color: crimson }}>*</Text>
              </Text>
              <View style={styles.chipGrid}>
                {FABRIC_OPTIONS.map((fab) => {
                  const isAct = fabric === fab;
                  return (
                    <PressableScale
                      key={fab}
                      onPress={() => {
                        setFabric(fab);
                        setActiveStep(4);
                      }}
                      style={[
                        styles.choiceChip,
                        isAct
                          ? { backgroundColor: crimson, borderColor: crimson }
                          : { backgroundColor: elevatedBg, borderColor: inputBorder },
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          {
                            color: isAct ? '#FFFFFF' : textPrimary,
                            fontWeight: isAct ? '700' : '500',
                          },
                        ]}
                      >
                        {fab}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* Occasion */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Occasion / Style Tag
              </Text>
              <View style={styles.chipGrid}>
                {OCCASION_OPTIONS.map((occ) => {
                  const isAct = occasion === occ;
                  return (
                    <PressableScale
                      key={occ}
                      onPress={() => setOccasion(occ)}
                      style={[
                        styles.choiceChipSm,
                        isAct
                          ? {
                              backgroundColor: isDark ? 'rgba(200, 162, 74, 0.22)' : '#FEF3C7',
                              borderColor: gold,
                            }
                          : { backgroundColor: elevatedBg, borderColor: cardBorder },
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipSmText,
                          {
                            color: isAct ? (isDark ? '#FDE68A' : '#78350F') : textSecondary,
                            fontWeight: isAct ? '700' : '500',
                          },
                        ]}
                      >
                        {occ}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* Wash Care */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Wash &amp; Garment Care
              </Text>
              <View style={styles.chipGrid}>
                {CARE_OPTIONS.map((c) => {
                  const isAct = care === c;
                  return (
                    <PressableScale
                      key={c}
                      onPress={() => setCare(c)}
                      style={[
                        styles.choiceChipSm,
                        isAct
                          ? {
                              backgroundColor: isDark ? 'rgba(200, 162, 74, 0.22)' : '#FEF3C7',
                              borderColor: gold,
                            }
                          : { backgroundColor: elevatedBg, borderColor: cardBorder },
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipSmText,
                          {
                            color: isAct ? (isDark ? '#FDE68A' : '#78350F') : textSecondary,
                            fontWeight: isAct ? '700' : '500',
                          },
                        ]}
                      >
                        {c}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* Product Description + Auto-Write */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Styling &amp; Fabric Notes (Optional)
                </Text>
                <PressableScale onPress={handleAutoWriteDescription} style={styles.inlineActionBtn}>
                  <Feather name="zap" size={11} color={gold} />
                  <Text style={[styles.inlineActionText, { color: gold }]}>
                    Auto-Write Description
                  </Text>
                </PressableScale>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Highlight fabric weight (GSM), fit drape, or styling notes..."
                placeholderTextColor={textMuted}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: textPrimary,
                  },
                ]}
              />
            </View>
          </View>

          {/* ================================================================
              SECTION 5: PRODUCT PHOTOS & MEDIA UPLOAD
          ================================================================ */}
          <View
            onLayout={(e) => {
              sectionOffsetsRef.current[5] = e.nativeEvent.layout.y;
            }}
            style={[
              styles.sectionCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.sectionHeaderLeft}>
                <View
                  style={[
                    styles.sectionNumCircle,
                    {
                      backgroundColor: isDark ? 'rgba(196, 36, 58, 0.20)' : '#FFF1F2',
                      borderColor: isDark ? 'rgba(196, 36, 58, 0.40)' : '#FECDD3',
                    },
                  ]}
                >
                  <Text style={[styles.sectionNumText, { color: isDark ? '#FDA4AF' : crimson }]}>
                    5
                  </Text>
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                    Product Photos
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: textSecondary }]} numberOfLines={1}>
                    Camera or gallery lookbook photos
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.sectionBadge,
                  {
                    backgroundColor: elevatedBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Text style={[styles.sectionBadgeText, { color: gold }]}>
                  {photos.length} OF 5 PHOTOS
                </Text>
              </View>
            </View>

            {/* Camera & Gallery Upload Buttons */}
            <View style={styles.twoColRow}>
              <PressableScale
                onPress={() => {
                  setActiveStep(5);
                  if (Platform.OS === 'web' && fileInputCameraRef.current) {
                    fileInputCameraRef.current.click();
                  } else {
                    showToast('Camera capture ready.');
                  }
                }}
                wrapperStyle={{ flex: 1 }}
                style={[
                  styles.uploadActionBox,
                  {
                    backgroundColor: isDark ? 'rgba(196, 36, 58, 0.10)' : '#FFF1F2',
                    borderColor: isDark ? 'rgba(196, 36, 58, 0.45)' : '#FDA4AF',
                  },
                ]}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: crimson }]}>
                  <Feather name="camera" size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.uploadActionTitle, { color: textPrimary }]}>
                  Snap with Camera
                </Text>
                <Text style={[styles.uploadActionSub, { color: textSecondary }]}>
                  Daylight boutique shot
                </Text>
              </PressableScale>

              <PressableScale
                onPress={() => {
                  setActiveStep(5);
                  if (Platform.OS === 'web' && fileInputGalleryRef.current) {
                    fileInputGalleryRef.current.click();
                  } else {
                    showToast('Gallery picker ready.');
                  }
                }}
                wrapperStyle={{ flex: 1 }}
                style={[
                  styles.uploadActionBox,
                  {
                    backgroundColor: elevatedBg,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.uploadIconCircle,
                    { backgroundColor: isDark ? '#2C2C32' : '#E5E3DC' },
                  ]}
                >
                  <Feather name="image" size={16} color={gold} />
                </View>
                <Text style={[styles.uploadActionTitle, { color: textPrimary }]}>
                  Choose from Gallery
                </Text>
                <Text style={[styles.uploadActionSub, { color: textSecondary }]}>
                  JPG, PNG, WEBP
                </Text>
              </PressableScale>
            </View>

            {/* Photo Preview Grid or Empty Helper */}
            {photos.length > 0 ? (
              <View style={styles.photoGridWrap}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Uploaded Lookbook Previews
                  </Text>
                  <Text style={[styles.contextHint, { color: textMuted }]}>
                    Tap any photo to set as Cover
                  </Text>
                </View>
                <View style={styles.photoGrid}>
                  {photos.map((ph, idx) => {
                    const isCover = idx === 0;
                    return (
                      <PressableScale
                        key={ph.id}
                        onPress={() => handleMakeCoverPhoto(idx)}
                        style={[
                          styles.photoTile,
                          {
                            borderColor: isCover ? crimson : cardBorder,
                            borderWidth: isCover ? 2 : 1,
                          },
                        ]}
                      >
                        <Image source={{ uri: ph.uri }} style={styles.photoTileImg} />
                        {isCover && (
                          <View style={[styles.coverBadge, { backgroundColor: crimson }]}>
                            <Text style={styles.coverBadgeText}>COVER</Text>
                          </View>
                        )}
                        <PressableScale
                          onPress={() => handleRemovePhoto(ph.id)}
                          style={styles.removePhotoBtn}
                          accessibilityLabel="Remove photo"
                        >
                          <Feather name="x" size={11} color="#FFFFFF" />
                        </PressableScale>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.emptyPhotoHintBox,
                  {
                    backgroundColor: elevatedBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Feather name="image" size={15} color={gold} />
                <Text style={[styles.emptyPhotoHintText, { color: textSecondary }]}>
                  No photos added yet. Snap with your phone camera or select up to 5 boutique photos.
                </Text>
              </View>
            )}
          </View>

          {/* Express Dispatch Assurance Card */}
          <View
            style={[
              styles.assuranceCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={styles.assuranceRow}>
              <View style={[styles.liveDot, { backgroundColor: emerald }]} />
              <Text style={[styles.assuranceTitle, { color: textPrimary }]}>
                INSTANT NAGPUR 45-MIN DISPATCH READY
              </Text>
            </View>
            <Text style={[styles.assuranceDesc, { color: textSecondary }]}>
              Once published, this piece goes live immediately under{' '}
              <Text style={{ fontWeight: '700', color: textPrimary }}>{shopName}</Text> ({shopArea}).
              Express delivery riders arrive at your boutique within 12–15 minutes of order confirmation.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 4. Sticky Bottom Publish Bar (Honest Live Completion & Price Summary) */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Platform.OS === 'web' ? 14 : Math.max(insets.bottom, 12),
            backgroundColor: isDark ? 'rgba(19, 19, 21, 0.96)' : 'rgba(250, 249, 245, 0.96)',
            borderTopColor: cardBorder,
          },
        ]}
      >
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomSummaryRow}>
            <View style={styles.completionGroup}>
              <Feather
                name={stepCompletion.isReady ? 'check-circle' : 'info'}
                size={13}
                color={stepCompletion.isReady ? emerald : gold}
              />
              <Text style={[styles.completionText, { color: textPrimary }]}>
                {stepCompletion.completedCount} of 5 Sections Complete
              </Text>
            </View>

            <View style={styles.priceSummaryGroup}>
              {numericMrp > numericPrice && (
                <Text style={[styles.summaryMrpText, { color: textMuted }]}>
                  MRP: ₹{numericMrp.toLocaleString('en-IN')}
                </Text>
              )}
              <Text style={[styles.summaryPriceText, { color: isDark ? '#FDA4AF' : crimson }]}>
                ₹{numericPrice.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <PressableScale
            onPress={handlePublishProduct}
            style={[
              styles.publishBtn,
              {
                backgroundColor: crimson,
                opacity: isSubmitting ? 0.75 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Publish Product to Catalog"
          >
            <Feather name="upload-cloud" size={17} color="#FFFFFF" />
            <Text style={styles.publishBtnText}>
              {isSubmitting ? 'Publishing to Catalog...' : 'Publish Product to Catalog'}
            </Text>
            <Feather name="arrow-right" size={15} color="#FFFFFF" />
          </PressableScale>

          <Text style={[styles.bottomSubNote, { color: textMuted }]}>
            Goes live on {shopName} catalog immediately · Zero inventory lock-in
          </Text>
        </View>
      </View>

      {/* Toast Banner */}
      {toastMsg ? (
        <View
          style={[
            styles.toastBanner,
            {
              backgroundColor: isDark ? '#202024' : '#121215',
              borderColor: 'rgba(200, 162, 74, 0.45)',
            },
          ]}
        >
          <Feather name="check-circle" size={14} color="#34D399" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      {/* Help Guide Modal */}
      <Modal
        visible={isHelpOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsHelpOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Quick Product Listing Guide
              </Text>
              <PressableScale onPress={() => setIsHelpOpen(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color={textSecondary} />
              </PressableScale>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.guideItem, { backgroundColor: elevatedBg }]}>
                <Text style={[styles.guideItemTitle, { color: textPrimary }]}>
                  1. Clear Naming &amp; Category
                </Text>
                <Text style={[styles.guideItemDesc, { color: textSecondary }]}>
                  Include color, fit, and garment type (e.g. &ldquo;Jet Black Oversized Oxford Shirt&rdquo;) so Nagpur shoppers find your piece faster.
                </Text>
              </View>

              <View style={[styles.guideItem, { backgroundColor: elevatedBg }]}>
                <Text style={[styles.guideItemTitle, { color: textPrimary }]}>
                  2. Transparent 95% Partner Payout
                </Text>
                <Text style={[styles.guideItemDesc, { color: textSecondary }]}>
                  You keep 95% of the selling price. 45-minute express courier pickup &amp; delivery across Nagpur is ₹0 for partner boutiques.
                </Text>
              </View>

              <View style={[styles.guideItem, { backgroundColor: elevatedBg }]}>
                <Text style={[styles.guideItemTitle, { color: textPrimary }]}>
                  3. Live Stock Sync
                </Text>
                <Text style={[styles.guideItemDesc, { color: textSecondary }]}>
                  Only enable sizes physically on your boutique rack today so orders can be packed within 10 minutes of confirmation.
                </Text>
              </View>
            </View>

            <PressableScale
              onPress={() => setIsHelpOpen(false)}
              style={[styles.modalDoneBtn, { backgroundColor: crimson }]}
            >
              <Text style={styles.modalDoneText}>Got It</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const serifFont = Platform.OS === 'web' ? 'ebGaramond, "EB Garamond", Georgia, serif' : 'serif';
const sansFont = Platform.OS === 'web' ? 'plusJakartaSans, "Plus Jakarta Sans", sans-serif' : undefined;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerRoot: {
    width: '100%',
    zIndex: 50,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  headerInner: {
    height: 60,
    maxWidth: 512,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemImg: {
    width: '100%',
    height: '100%',
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 19,
    fontFamily: serifFont,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    fontFamily: sansFont,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  draftBtnText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  draftCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  draftCountText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  helpBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBar: {
    width: '100%',
    zIndex: 40,
    borderBottomWidth: 1,
    paddingVertical: 10,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 60,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  stepperInner: {
    maxWidth: 512,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 14,
    gap: 8,
  },
  stepperTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: sansFont,
  },
  stepDot: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepActiveName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: serifFont,
  },
  dispatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  dispatchBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  progressSegmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  stepPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  stepPillText: {
    fontSize: 11.5,
    fontFamily: sansFont,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 150,
  },
  mainColumn: {
    maxWidth: 512,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 14,
    gap: 14,
  },
  quickTemplateBar: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  quickTemplateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickTemplateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickTemplateTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  quickTemplateHint: {
    fontSize: 11,
    fontFamily: sansFont,
  },
  quickTemplateScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  templateThumb: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },
  templateChipLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  templateChipPrice: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    fontFamily: serifFont,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    lineHeight: 15,
    fontFamily: sansFont,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: sansFont,
  },
  fieldGroup: {
    gap: 7,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  contextHint: {
    fontSize: 11,
    fontFamily: sansFont,
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineActionText: {
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  textInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    fontFamily: sansFont,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  clearInputBtn: {
    padding: 4,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCol: {
    flex: 1,
    gap: 6,
  },
  readOnlyBox: {
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  readOnlyText: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: sansFont,
    flex: 1,
  },
  skuInputBox: {
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 11,
    justifyContent: 'center',
  },
  skuInput: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  choiceChipText: {
    fontSize: 12.5,
    fontFamily: sansFont,
  },
  choiceChipSm: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
  },
  choiceChipSmText: {
    fontSize: 12,
    fontFamily: sansFont,
  },
  quickPriceRow: {
    flexDirection: 'row',
    gap: 7,
  },
  quickPricePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
  },
  quickPriceText: {
    fontSize: 12,
    fontFamily: sansFont,
  },
  priceInputWrap: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: serifFont,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: sansFont,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  payoutCard: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  payoutTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payoutTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payoutTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: sansFont,
  },
  discountTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  discountTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  payoutMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  payoutMetricBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  payoutMetricLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    fontFamily: sansFont,
  },
  payoutMetricValStrike: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'line-through',
    fontFamily: sansFont,
  },
  payoutMetricVal: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  payoutMetricValBold: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: sansFont,
  },
  feeNoteRow: {
    paddingTop: 8,
    borderTopWidth: 1,
  },
  feeNoteText: {
    fontSize: 11,
    fontFamily: sansFont,
    textAlign: 'center',
  },
  scaleTabRow: {
    flexDirection: 'row',
    gap: 7,
  },
  scaleTabBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
  },
  scaleTabText: {
    fontSize: 11.5,
    fontFamily: sansFont,
  },
  bulkActionsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  bulkBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  sizePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeTogglePill: {
    minWidth: 52,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  sizeToggleSub: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: sansFont,
    marginTop: 1,
  },
  sizeRowsList: {
    gap: 8,
  },
  sizeStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sizeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sizeBadgeBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  sizeRowTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  sizeRowReady: {
    fontSize: 10.5,
    fontWeight: '500',
    fontFamily: sansFont,
    marginTop: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    minWidth: 22,
    textAlign: 'center',
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatchCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 9,
    borderRadius: 11,
    borderWidth: 1,
  },
  swatchCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchTextCol: {
    flex: 1,
    minWidth: 0,
  },
  swatchName: {
    fontSize: 12,
    fontFamily: sansFont,
  },
  swatchTone: {
    fontSize: 10,
    fontFamily: sansFont,
  },
  customColorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  customColorInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontFamily: sansFont,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  customColorAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
  },
  customColorAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  textArea: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    lineHeight: 18,
    textAlignVertical: 'top',
    fontFamily: sansFont,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  uploadActionBox: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  uploadActionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  uploadActionSub: {
    fontSize: 10.5,
    fontFamily: sansFont,
  },
  photoGridWrap: {
    gap: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: 96,
    height: 112,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoTileImg: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  coverBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: sansFont,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotoHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 11,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyPhotoHintText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: sansFont,
    flex: 1,
  },
  assuranceCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  assuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  assuranceTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: sansFont,
  },
  assuranceDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: sansFont,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 10,
    zIndex: 50,
    ...Platform.select({
      web: {
        position: 'fixed',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  bottomBarInner: {
    maxWidth: 512,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 14,
    gap: 8,
  },
  bottomSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  priceSummaryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryMrpText: {
    fontSize: 11.5,
    textDecorationLine: 'line-through',
    fontFamily: sansFont,
  },
  summaryPriceText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: sansFont,
  },
  publishBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  bottomSubNote: {
    fontSize: 10.5,
    textAlign: 'center',
    fontFamily: sansFont,
  },
  toastBanner: {
    position: 'absolute',
    bottom: 118,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 99,
    ...Platform.select({
      web: {
        position: 'fixed',
      },
    }),
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: serifFont,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 10,
  },
  guideItem: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  guideItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: sansFont,
  },
  guideItemDesc: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: sansFont,
  },
  modalDoneBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: sansFont,
  },
});
