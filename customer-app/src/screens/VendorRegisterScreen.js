import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { getCurrentCoordinates, reverseGeocodeLocation } from '../utils/geolocation';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import BrandLogo from '../components/BrandLogo';
import PressableScale from '../components/PressableScale';
import { colors, radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/useTheme';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { registerVendor } from '../api/vendorApi';

const NAGPUR_AREAS = [
  'Dharampeth',
  'Civil Lines',
  'Sadar Bazar',
  'Gandhibagh',
  'Ramdaspeth',
];

/**
 * VendorRegisterScreen — Register Your Shop (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen eba3920c8b6b4e43be4c600109968434:
 * - Animated drifting ambient background blobs
 * - Frosted glass top header with close button
 * - Clean input cards for boutique details: Shop Name, Owner, Phone, Area, Address
 * - GPS location quick-pin banner
 * - Nagpur boutique area chips
 * - Sticky bottom glass CTA: "Register Boutique · Free Onboarding"
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function VendorRegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setRole = useAuthStore((state) => state.setRole);
  const setVendorProfile = useAuthStore((state) => state.setVendorProfile);

  const [shopName, setShopName] = useState('Studio Anamika Handlooms');
  const [ownerName, setOwnerName] = useState('Anamika Joshi');
  const [phone, setPhone] = useState('98220 12345');
  const [selectedArea, setSelectedArea] = useState(NAGPUR_AREAS[0]);
  const [addressLine, setAddressLine] = useState('Shop 4, Ground Floor, Opposite Traffic Park, West High Court Rd, Dharampeth');
  const [selectedSpecialties, setSelectedSpecialties] = useState([
    'Paithani & Silks',
    'Designer Prêt',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState([79.0882, 21.1458]);
  const [pincode, setPincode] = useState('440010');
  const [expressOptIn, setExpressOptIn] = useState(true);

  const SPECIALTIES = [
    'Paithani & Silks',
    'Designer Prêt',
    'Bridal Couture',
    'Occasion Wear',
    'Contemporary Streetwear',
    'Handloom Cottons',
  ];

  const toggleSpecialty = (spec) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleUseMyLocation = async () => {
    try {
      setLocating(true);
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      const pos = await getCurrentCoordinates();
      setCoords([pos.longitude, pos.latitude]);

      const geo = await reverseGeocodeLocation(pos);
      if (geo?.formattedAddress && !addressLine.trim()) {
        setAddressLine(geo.formattedAddress);
      }
      if (geo?.pincode && /^\d{6}$/.test(String(geo.pincode))) {
        setPincode(String(geo.pincode));
      }
      if (geo?.areaName && NAGPUR_AREAS.includes(geo.areaName)) {
        setSelectedArea(geo.areaName);
      }

      Alert.alert(
        'GPS Pin Updated',
        `Location captured: ${geo?.areaLabel || 'pin set'} [${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}]`
      );
    } catch (err) {
      const isDenied = err?.message?.includes('denied') || err?.code === 1;
      Alert.alert(
        'Location Access',
        isDenied
          ? 'Allow location access so nearby shoppers in Nagpur can find your atelier.'
          : 'Could not acquire accurate GPS coordinates.'
      );
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!shopName.trim() || !ownerName.trim() || !phone.trim()) {
      Alert.alert(
        'Incomplete Details',
        'Please provide boutique name, owner name, and contact phone.'
      );
      return;
    }
    if (!/^\d{6}$/.test(String(pincode).trim())) {
      Alert.alert(
        'Pincode Required',
        'Enter your boutique’s 6-digit Nagpur pincode (use GPS pin to auto-fill when available).'
      );
      return;
    }

    if (!token) {
      Alert.alert(
        'Account Required',
        'Please sign in or create an account before registering your boutique so your catalog is securely saved.',
        [
          { text: 'Sign In', onPress: () => navigation.navigate('Auth', { mode: 'register' }) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setSubmitting(true);
    const userEmail = user?.email || `${shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@kyapehnu.local`;
    const payload = {
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: userEmail,
      address: {
        line1: addressLine.trim() || `${selectedArea}, Nagpur`,
        area: selectedArea,
        city: 'Nagpur',
        pincode: String(pincode).trim(),
      },
      location: {
        type: 'Point',
        coordinates: coords || [79.0882, 21.1458],
      },
    };

    try {
      const savedVendor = await registerVendor(payload);
      setRole(ROLES.VENDOR);
      setVendorProfile(savedVendor || payload);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Welcome to Kya Pehnu Partner Hub',
        `${payload.shopName} is now registered on Nagpur 45-min corridor!`
      );
      // No manual navigation here: setRole(VENDOR) above re-keys the
      // NavigationContainer, which tears down the customer stack and mounts the
      // vendor flow at its initial route (VendorOrders). Dispatching a REPLACE
      // on the outgoing customer navigator only threw an "unhandled action /
      // no screen named VendorOrderList" console error on every registration.
    } catch (err) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        'Registration Failed',
        err.message || 'Could not register boutique. Please check connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: colors.groundBase }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Ambient Background Glow Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Frosted Glass Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 4,
            backgroundColor: isDark ? 'rgba(14, 14, 16, 0.88)' : 'rgba(250, 249, 245, 0.88)',
            borderBottomColor: colors.borderHairline,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarInner} pointerEvents="auto">
          <View style={styles.topBarLeft}>
            <PressableScale
              onPress={() => navigation.goBack()}
              style={[
                styles.backCircleBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={16}
                color={colors.textObsidian}
              />
            </PressableScale>

            <BrandLogo size="sm" showEmblem={true} />

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: colors.textObsidian }]}>
                Register Shop
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.accentCrimson }]}>
                Nagpur Atelier Onboarding
              </Text>
            </View>
          </View>

          {/* Express Live status indicator badge */}
          <View
            style={[
              styles.liveStatusPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                borderColor: colors.borderHairline,
              },
            ]}
          >
            <View style={styles.liveGreenDot} />
            <Text style={[styles.liveStatusText, { color: colors.textSlate }]}>
              Express Live
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Main Form Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimalist 3-Step Indicator */}
        <View style={styles.stepIndicatorContainer}>
          <View style={styles.stepHeaderRow}>
            <View style={styles.stepTitleGroup}>
              <Text style={[styles.stepEyebrow, { color: colors.accentCrimson }]}>
                STEP 1
              </Text>
              <Text style={[styles.stepOfText, { color: colors.textAsh }]}>
                of 3
              </Text>
              <Text style={[styles.stepNameText, { color: colors.textObsidian }]}>
                Atelier Profile & Details
              </Text>
            </View>
            <View
              style={[
                styles.inProgressBadge,
                { backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : '#FBF7ED' },
              ]}
            >
              <Text style={[styles.inProgressText, { color: colors.accentGoldDeep || '#B38A2B' }]}>
                In Progress
              </Text>
            </View>
          </View>

          {/* 3 Progress Bars */}
          <View style={styles.progressBarRow}>
            <View
              style={[styles.progressBarActive, { backgroundColor: colors.accentCrimson }]}
            />
            <View
              style={[
                styles.progressBarInactive,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 20, 0.08)' },
              ]}
            />
            <View
              style={[
                styles.progressBarInactive,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 20, 0.08)' },
              ]}
            />
          </View>

          <View style={styles.stepLabelsRow}>
            <Text style={[styles.stepLabelText, { color: colors.accentCrimson, fontWeight: '700' }]}>
              1. Profile
            </Text>
            <Text style={[styles.stepLabelText, { color: colors.textAsh }]}>
              2. Location
            </Text>
            <Text style={[styles.stepLabelText, { color: colors.textAsh }]}>
              3. Verify
            </Text>
          </View>
        </View>

        {/* Hero & Value Pitch: Stitch Luxury Header */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.guildBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                borderColor: colors.borderHairline,
              },
            ]}
          >
            <MaterialIcons
              name="verified"
              size={14}
              color={colors.accentGold || '#B38A2B'}
            />
            <Text style={[styles.guildBadgeText, { color: colors.textObsidian }]}>
              NAGPUR COUTURE GUILD
            </Text>
          </View>

          <Text style={[styles.heroHeadline, { color: colors.textObsidian }]}>
            Turn your boutique into an instant{' '}
            <Text style={[styles.heroHeadlineAccent, { color: colors.accentCrimson }]}>
              45-minute
            </Text>{' '}
            dressing room.
          </Text>

          {/* Value Pill Ribbon */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.valuePillRow}
          >
            <View
              style={[
                styles.valuePill,
                {
                  backgroundColor: isDark ? 'rgba(24, 24, 28, 0.85)' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <MaterialIcons
                name="inventory-2"
                size={15}
                color={colors.accentGold || '#B38A2B'}
              />
              <Text style={[styles.valuePillText, { color: colors.textObsidian }]}>
                Zero inventory lock-in
              </Text>
            </View>

            <View
              style={[
                styles.valuePill,
                {
                  backgroundColor: isDark ? 'rgba(24, 24, 28, 0.85)' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <MaterialIcons
                name="two-wheeler"
                size={15}
                color={colors.accentCrimson}
              />
              <Text style={[styles.valuePillText, { color: colors.textObsidian }]}>
                45-min White Glove Porters
              </Text>
            </View>

            <View
              style={[
                styles.valuePill,
                {
                  backgroundColor: isDark ? 'rgba(24, 24, 28, 0.85)' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <MaterialIcons
                name="account-balance-wallet"
                size={15}
                color="#10B981"
              />
              <Text style={[styles.valuePillText, { color: colors.textObsidian }]}>
                Instant UPI payout upon try-on
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Group 1: Boutique Identity Card */}
        <View
          style={[
            styles.stitchCard,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
              borderColor: colors.borderHairline,
            },
          ]}
        >
          <View style={[styles.cardTopHeader, { borderBottomColor: colors.borderHairline }]}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.cardTitle, { color: colors.textObsidian }]}>
                Boutique Identity
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSlate }]}>
                Official atelier & artisan leadership credentials
              </Text>
            </View>
            <View
              style={[
                styles.iconRoundBadge,
                { backgroundColor: isDark ? 'rgba(196, 36, 58, 0.18)' : 'rgba(196, 36, 58, 0.08)' },
              ]}
            >
              <MaterialIcons
                name="storefront"
                size={18}
                color={colors.accentCrimson}
              />
            </View>
          </View>

          {/* Shop Name */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSlate }]}>
              BOUTIQUE / BRAND NAME
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <MaterialIcons name="store" size={18} color={colors.textAsh} />
              <TextInput
                value={shopName}
                onChangeText={setShopName}
                placeholder="e.g. Studio Anamika Handlooms"
                placeholderTextColor={colors.textAsh}
                style={[styles.inputText, { color: colors.textObsidian }]}
              />
            </View>
          </View>

          {/* Proprietor Name */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSlate }]}>
              LEAD DESIGNER / PROPRIETOR
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <MaterialIcons name="person" size={18} color={colors.textAsh} />
              <TextInput
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="e.g. Anamika Joshi"
                placeholderTextColor={colors.textAsh}
                style={[styles.inputText, { color: colors.textObsidian }]}
              />
            </View>
          </View>

          {/* WhatsApp Hotline */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelWithBadgeRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSlate }]}>
                WHATSAPP BUSINESS DISPATCH LINE
              </Text>
              <View
                style={[
                  styles.autoAlertsPill,
                  { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' },
                ]}
              >
                <MaterialIcons name="check-circle" size={11} color="#059669" />
                <Text style={styles.autoAlertsText}>Auto-Alerts Ready</Text>
              </View>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Text style={[styles.countryCodeText, { color: colors.accentCrimson }]}>
                +91
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="98220 12345"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textAsh}
                style={[styles.inputText, { color: colors.textObsidian }]}
              />
              <MaterialIcons name="chat" size={17} color={colors.textAsh} />
            </View>
            <Text style={[styles.fieldHint, { color: colors.textAsh }]}>
              Instant rider arrival pins, OTP confirmations, and booking alerts are dispatched here.
            </Text>
          </View>
        </View>

        {/* Group 2: Atelier Specialties */}
        <View
          style={[
            styles.stitchCard,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
              borderColor: colors.borderHairline,
            },
          ]}
        >
          <View style={styles.cardTopHeaderNoBorder}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.cardTitle, { color: colors.textObsidian }]}>
                Atelier Specialties
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSlate }]}>
                Garment lines available for 45-min doorstep delivery
              </Text>
            </View>
            <View
              style={[
                styles.iconRoundBadge,
                { backgroundColor: isDark ? 'rgba(200, 162, 74, 0.18)' : 'rgba(200, 162, 74, 0.12)' },
              ]}
            >
              <MaterialIcons
                name="checkroom"
                size={18}
                color={colors.accentGold || '#B38A2B'}
              />
            </View>
          </View>

          {/* Specialties Chips */}
          <View style={styles.specialtiesWrap}>
            {SPECIALTIES.map((spec) => {
              const active = selectedSpecialties.includes(spec);
              return (
                <PressableScale
                  key={spec}
                  onPress={() => toggleSpecialty(spec)}
                  style={[
                    styles.specChip,
                    active
                      ? [styles.specChipActive, { backgroundColor: colors.accentCrimson }]
                      : [
                          styles.specChipInactive,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.inputBg,
                            borderColor: colors.borderHairline,
                          },
                        ],
                  ]}
                >
                  <MaterialIcons
                    name={active ? 'check' : 'add'}
                    size={14}
                    color={active ? '#FFFFFF' : colors.textAsh}
                  />
                  <Text
                    style={[
                      styles.specChipText,
                      { color: active ? '#FFFFFF' : colors.textObsidian },
                    ]}
                  >
                    {spec}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Group 3: Nagpur Hub & Storefront Verification */}
        <View
          style={[
            styles.stitchCard,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
              borderColor: colors.borderHairline,
            },
          ]}
        >
          <View style={[styles.cardTopHeader, { borderBottomColor: colors.borderHairline }]}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.cardTitle, { color: colors.textObsidian }]}>
                Nagpur Hub & Storefront
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSlate }]}>
                Dedicated Porter courier routing node
              </Text>
            </View>
            <View
              style={[
                styles.iconRoundBadge,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5' },
              ]}
            >
              <MaterialIcons name="location-on" size={18} color="#059669" />
            </View>
          </View>

          {/* Commercial Cluster Zone Selector */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSlate }]}>
              COMMERCIAL CLUSTER ZONE
            </Text>
            <View style={styles.clustersGrid}>
              {NAGPUR_AREAS.map((area) => {
                const isSelected = selectedArea === area;
                return (
                  <PressableScale
                    key={area}
                    onPress={() => setSelectedArea(area)}
                    style={[
                      styles.clusterBtn,
                      isSelected
                        ? [styles.clusterBtnActive, { backgroundColor: isDark ? '#FFFFFF' : colors.textObsidian }]
                        : [
                            styles.clusterBtnInactive,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                              borderColor: colors.borderHairline,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.clusterBtnText,
                        {
                          color: isSelected
                            ? (isDark ? '#121215' : '#FFFFFF')
                            : colors.textObsidian,
                        },
                      ]}
                    >
                      {area}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Storefront Landmark Address */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSlate }]}>
              STOREFRONT LANDMARK ADDRESS
            </Text>
            <View
              style={[
                styles.inputWrapperMulti,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <MaterialIcons
                name="pin-drop"
                size={18}
                color={colors.accentCrimson}
                style={{ marginTop: 2 }}
              />
              <TextInput
                value={addressLine}
                onChangeText={setAddressLine}
                placeholder="Shop 4, Ground Floor, WHC Rd, Dharampeth"
                placeholderTextColor={colors.textAsh}
                multiline
                numberOfLines={2}
                style={[styles.inputMultiText, { color: colors.textObsidian }]}
              />
            </View>
          </View>

          {/* Pincode & GPS */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSlate }]}>
              PINCODE & GPS COORDINATES
            </Text>
            <View style={styles.pincodeRow}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    flex: 1,
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <MaterialIcons name="local-post-office" size={17} color={colors.textAsh} />
                <TextInput
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="6-digit pincode"
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={colors.textAsh}
                  style={[styles.inputText, { color: colors.textObsidian }]}
                />
              </View>

              <PressableScale
                onPress={handleUseMyLocation}
                disabled={locating}
                style={[
                  styles.recalibrateGpsBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                    borderColor: colors.borderHairline,
                  },
                ]}
              >
                <MaterialIcons
                  name="my-location"
                  size={15}
                  color={colors.accentCrimson}
                />
                <Text style={[styles.recalibrateText, { color: colors.accentCrimson }]}>
                  {locating ? 'Locating…' : 'GPS Pin'}
                </Text>
              </PressableScale>
            </View>
          </View>

          {/* Stylized Map Preview Card */}
          <View
            style={[
              styles.mapPreviewCard,
              {
                backgroundColor: isDark ? '#1C1C20' : '#EDEAE3',
                borderColor: colors.borderHairline,
              },
            ]}
          >
            {/* Top Badge: 45-Min Express Porter Radius */}
            <View style={styles.mapTopBadgesRow}>
              <View
                style={[
                  styles.radiusPill,
                  {
                    backgroundColor: isDark ? 'rgba(14, 14, 16, 0.90)' : 'rgba(255, 255, 255, 0.92)',
                    borderColor: colors.borderHairline,
                  },
                ]}
              >
                <View style={styles.pulseDotCrimson} />
                <Text style={[styles.radiusPillText, { color: colors.textObsidian }]}>
                  45-Min Express Porter Radius
                </Text>
              </View>

              <View style={styles.zoneTag}>
                <Text style={styles.zoneTagText}>Zone 4 (Active)</Text>
              </View>
            </View>

            {/* Bottom Pinpoint Callout */}
            <View
              style={[
                styles.mapBottomCallout,
                {
                  backgroundColor: isDark ? 'rgba(14, 14, 16, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <View style={styles.mapCalloutLeft}>
                <View style={styles.greenPulseDot} />
                <Text style={[styles.mapCalloutTitle, { color: colors.textObsidian }]} numberOfLines={1}>
                  {selectedArea} Dispatch Hub Locked
                </Text>
              </View>

              <PressableScale
                onPress={handleUseMyLocation}
                style={styles.recalibrateLink}
              >
                <MaterialIcons name="my-location" size={13} color={colors.accentCrimson} />
                <Text style={[styles.recalibrateLinkText, { color: colors.accentCrimson }]}>
                  Recalibrate
                </Text>
              </PressableScale>
            </View>
          </View>

          {/* Storefront Visual Confirmation Card */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSlate }]}>
              STOREFRONT VISUAL CONFIRMATION
            </Text>
            <View
              style={[
                styles.facadeCard,
                {
                  backgroundColor: isDark ? '#1C1C20' : '#F4F3EE',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <View style={styles.facadeInnerContent}>
                <MaterialIcons
                  name="store"
                  size={38}
                  color={colors.accentGold || '#B38A2B'}
                />
                <Text style={[styles.facadeTitle, { color: colors.textObsidian }]}>
                  {shopName || 'Nagpur Boutique'}
                </Text>
                <Text style={[styles.facadeSub, { color: colors.textSlate }]}>
                  {addressLine}
                </Text>

                <View
                  style={[
                    styles.aiVerifiedPill,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                      borderColor: '#10B981',
                    },
                  ]}
                >
                  <MaterialIcons name="verified" size={13} color="#059669" />
                  <Text style={styles.aiVerifiedText}>Facade Verified by AI</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Section 4: 45-Min Express Corridor Opt-in */}
        <View
          style={[
            styles.stitchCard,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
              borderColor: colors.borderHairline,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.expressTitleRow}>
              <MaterialIcons
                name="bolt"
                size={18}
                color={colors.accentCrimson}
              />
              <Text style={[styles.cardTitle, { color: colors.textObsidian }]}>
                Express Dispatch Guarantee
              </Text>
            </View>
            <Switch
              value={expressOptIn}
              onValueChange={setExpressOptIn}
              trackColor={{
                false: 'rgba(0,0,0,0.1)',
                true: colors.accentCrimson,
              }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={[styles.expressDescription, { color: colors.textSlate }]}>
            Orders in Dharampeth, Civil Lines & Sadar corridor dispatched via dedicated Porter trial riders in &lt;18 mins.
          </Text>
        </View>
      </ScrollView>

      {/* 4. Docked Bottom Floating Glass Primary CTA */}
      <View
        style={[
          styles.bottomBarWrap,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: isDark ? 'rgba(14, 14, 16, 0.94)' : 'rgba(250, 249, 245, 0.94)',
            borderTopColor: colors.borderHairline,
          },
        ]}
      >
        <View style={styles.bottomBarInner}>
          <PressableScale
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitBtn, { backgroundColor: colors.accentCrimson }]}
            accessibilityRole="button"
            accessibilityLabel="Complete Atelier Registration"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitLabel}>
                  Complete Atelier Registration
                </Text>
                <MaterialIcons name="arrow-forward" size={17} color="#FFFFFF" />
              </>
            )}
          </PressableScale>

          {/* Trust Subtext */}
          <View style={styles.trustSubtextRow}>
            <MaterialIcons
              name="verified-user"
              size={14}
              color={colors.accentGoldDeep || '#946C18'}
            />
            <Text style={[styles.trustSubtext, { color: colors.textAsh }]}>
              Verified Nagpur partner boutiques go live within 24 hours.
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  topBarInner: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  stepIndicatorContainer: {
    paddingTop: 6,
    gap: 8,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  stepEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepOfText: {
    fontSize: 12,
  },
  stepNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  inProgressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressBarActive: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  progressBarInactive: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  stepLabelText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  heroSection: {
    gap: 8,
    paddingTop: 2,
  },
  guildBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  guildBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroHeadline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    letterSpacing: -0.3,
  },
  heroHeadlineAccent: {
    fontStyle: 'italic',
    fontWeight: '600',
  },
  valuePillRow: {
    gap: 8,
    paddingVertical: 4,
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  valuePillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  stitchCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm + 2,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  cardTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  cardTopHeaderNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  cardDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  iconRoundBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoAlertsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  autoAlertsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputWrapperMulti: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  inputMultiText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
    paddingRight: 6,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  fieldHint: {
    fontSize: 11,
    lineHeight: 15,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.lg,
  },
  specChipActive: {
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  specChipInactive: {
    borderWidth: 1,
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clustersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clusterBtn: {
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterBtnActive: {
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  clusterBtnInactive: {
    borderWidth: 1,
  },
  clusterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pincodeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  recalibrateGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  recalibrateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mapPreviewCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    height: 124,
    justifyContent: 'space-between',
    padding: 10,
    marginTop: 4,
  },
  mapTopBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radiusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  pulseDotCrimson: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C4243A',
  },
  radiusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  zoneTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  zoneTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapBottomCallout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  mapCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  mapCalloutTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  recalibrateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  recalibrateLinkText: {
    fontSize: 11,
    fontWeight: '800',
  },
  facadeCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  facadeInnerContent: {
    alignItems: 'center',
    gap: 4,
  },
  facadeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  facadeSub: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 240,
  },
  aiVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    marginTop: 6,
  },
  aiVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expressDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  bottomBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  bottomBarInner: {
    gap: 8,
  },
  submitBtn: {
    height: 48,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  trustSubtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingBottom: 2,
  },
  trustSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
});
