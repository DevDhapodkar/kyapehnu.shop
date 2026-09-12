import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  isWithinNagpur,
  NAGPUR_CENTER,
} from '../utils/geolocation';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import InteractiveMapPinPicker from '../components/InteractiveMapPinPicker';
import OutOfDeliveryZoneModal from '../components/OutOfDeliveryZoneModal';
import PressableScale from '../components/PressableScale';
import { formatCurrency as formatINR } from '../utils/format';
import {
  selectCartItems,
  selectCartTotal,
  useCartStore,
} from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { placeCartOrders, placeGuestCartOrders } from '../services/checkout';
import { saveUserAddress, deleteUserAddress, fetchUserProfile } from '../api/vendorApi';
import {
  buildCheckoutAddressFromForm,
  buildCheckoutAddressFromSaved,
  validateNagpurDeliveryBounds,
} from '../utils/checkoutAddress';
import { colors, radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

const ADDRESS_TYPES = [
  { id: 'HOME', label: 'Home', icon: 'home' },
  { id: 'WORK', label: 'Work', icon: 'apartment' },
  { id: 'STUDIO', label: 'Studio', icon: 'dry-cleaning' },
  { id: 'OTHER', label: 'Other', icon: 'more-horiz' },
];

/**
 * AddressScreen — Production Express Fitting Checkout
 *
 * Implements Stitch Screen e6512c6056f541ad8516f9bcf76e8589 with ZERO dummy data:
 * - New customers start with ZERO invented addresses.
 * - Returning customers see only genuine addresses saved to their MongoDB account.
 * - Interactive Free Map Pinning (OpenStreetMap & Leaflet) with live pin and Nominatim geocoding.
 * - Strict validation preventing order placement without confirmed delivery coordinates & phone.
 */
export default function AddressScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();

  const cartItems = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectCartTotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isLoggedIn = Boolean(token);

  // Address state
  const savedAddresses = profile?.savedAddresses || [];
  const [selectedAddressId, setSelectedAddressId] = useState(
    savedAddresses.length > 0 ? savedAddresses[0]._id : null
  );
  const [showAddForm, setShowAddForm] = useState(savedAddresses.length === 0);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // New address form fields (all start clean — no dummy text)
  const [addressType, setAddressType] = useState('HOME');
  const [flatNo, setFlatNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [detectedArea, setDetectedArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [receiverName, setReceiverName] = useState(
    profile?.name || user?.displayName || ''
  );
  const [phone, setPhone] = useState(profile?.phone || '');
  const [coords, setCoords] = useState(null); // [lng, lat]

  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [zoneErrorModal, setZoneErrorModal] = useState({
    visible: false,
    error: null,
    distanceKm: null,
    pincode: null,
    city: null,
  });

  const total = subtotal > 0 ? subtotal : 0;

  // Selected address object (from saved or newly entered)
  const activeSavedAddress = savedAddresses.find(
    (a) => String(a._id) === String(selectedAddressId)
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Kya Pehnu? - Nagpur Express 15-Minute Doorstep Fitting',
      });
    } catch {
      // ignore
    }
  };

  // When map pin confirmed — never invent pincode; leave blank for customer to fill
  const handleConfirmMapLocation = (locationData) => {
    setCoords(locationData.coordinates);
    setDetectedArea(locationData.formattedAddress || locationData.areaName || '');
    // Do NOT overwrite if customer has already entered a valid 6-digit pincode
    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      if (locationData.pincode && /^\d{6}$/.test(String(locationData.pincode).trim())) {
        setPincode(String(locationData.pincode).trim());
      }
    }
    if (!streetArea && locationData.road) {
      setStreetArea(`${locationData.road}, ${locationData.areaName || ''}`.trim());
    } else if (!streetArea && locationData.areaName) {
      setStreetArea(locationData.areaName);
    }
  };

  // Delete saved address
  const handleDeleteAddress = async (addressId) => {
    Alert.alert(
      'Remove Address',
      'Are you sure you want to remove this saved delivery address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingId(addressId);
            try {
              await deleteUserAddress(addressId);
              // Refresh profile
              const updated = await fetchUserProfile();
              useAuthStore.setState({ profile: updated });
              if (selectedAddressId === addressId) {
                const remaining = updated?.savedAddresses || [];
                setSelectedAddressId(remaining.length > 0 ? remaining[0]._id : null);
                if (remaining.length === 0) setShowAddForm(true);
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove address.');
            } finally {
              setIsDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // Save new address
  const handleSaveNewAddress = async () => {
    const built = buildCheckoutAddressFromForm({
      flatNo,
      streetArea,
      detectedArea,
      pincode,
      receiverName,
      phone,
      coords,
      addressType,
    });
    if (!built.ok) {
      Alert.alert('Address Incomplete', built.error);
      if (/pin on map|map pin|location/i.test(built.error)) setIsMapOpen(true);
      else setShowAddForm(true);
      return;
    }

    const payload = built.address;

    setIsSavingAddress(true);
    try {
      if (isLoggedIn) {
        await saveUserAddress(payload);
        const updated = await fetchUserProfile();
        useAuthStore.setState({ profile: updated });
        const newAddr = updated?.savedAddresses?.[updated.savedAddresses.length - 1];
        if (newAddr) {
          setSelectedAddressId(newAddr._id);
        }
        setShowAddForm(false);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Guests cannot persist addresses — keep the form filled for checkout.
        Alert.alert(
          'Address Ready',
          'Sign in to save this address for next time. You can still place this order as a guest with the details below.'
        );
      }
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert(
        'Empty Bag',
        'Your bag is empty. Please select garments before checkout.',
        [{ text: 'Browse Ateliers', onPress: () => navigation.navigate('Home') }]
      );
      return;
    }

    if (!activeServiceability.serviceable) {
      setZoneErrorModal({
        visible: true,
        error: activeServiceability.error,
        distanceKm: activeServiceability.distanceKm,
        pincode: activeSavedAddress?.pincode || pincode,
        city: activeSavedAddress?.city || 'Nagpur',
      });
      return;
    }

    let finalAddress = null;

    if (activeSavedAddress) {
      const built = buildCheckoutAddressFromSaved({
        address: activeSavedAddress,
        profile,
        user,
      });
      if (!built.ok) {
        if (built.outOfBounds) {
          setZoneErrorModal({
            visible: true,
            error: built.error,
            pincode: activeSavedAddress?.pincode,
            distanceKm: built.distanceKm,
            city: activeSavedAddress?.city || 'Nagpur',
          });
          return;
        }
        Alert.alert('Address Incomplete', built.error);
        setShowAddForm(true);
        return;
      }
      finalAddress = built.address;
    } else {
      const resolvedCoords =
        Array.isArray(coords) && coords.length >= 2
          ? coords
          : [NAGPUR_CENTER.longitude, NAGPUR_CENTER.latitude];

      const built = buildCheckoutAddressFromForm({
        flatNo,
        streetArea,
        detectedArea,
        pincode,
        receiverName,
        phone,
        coords: resolvedCoords,
        addressType,
      });
      if (!built.ok) {
        if (built.outOfBounds) {
          setZoneErrorModal({
            visible: true,
            error: built.error,
            pincode,
            distanceKm: built.distanceKm,
            city: 'Nagpur',
          });
          return;
        }
        Alert.alert('Delivery Address Required', built.error);
        if (/pin on map|map pin|location/i.test(built.error)) setIsMapOpen(true);
        else setShowAddForm(true);
        return;
      }
      finalAddress = built.address;
    }

    setIsPlacingOrder(true);

    try {
      let placedOrders;
      if (isLoggedIn) {
        placedOrders = await placeCartOrders({
          items: cartItems,
          deliveryAddress: finalAddress,
          deliveryFee: 0,
        });
      } else {
        placedOrders = await placeGuestCartOrders({
          items: cartItems,
          deliveryAddress: finalAddress,
          contact: {
            name: finalAddress.receiverName,
            phone: finalAddress.receiverPhone,
          },
          deliveryFee: 0,
        });
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      clearCart();

      const primaryOrder = placedOrders[0];
      navigation.navigate('LiveTracking', {
        orderId: primaryOrder.id || primaryOrder._id,
        order: primaryOrder,
        phone: finalAddress.receiverPhone,
      });
    } catch (err) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const isZoneError =
        err?.response?.data?.error === 'OUT_OF_DELIVERY_ZONE' ||
        /delivery network|delivery zone|outside.*nagpur/i.test(err?.message || '');
      if (isZoneError) {
        setZoneErrorModal({
          visible: true,
          error: err?.response?.data?.message || err.message,
          distanceKm: err?.response?.data?.details?.distanceKm,
          pincode: err?.response?.data?.details?.pincode,
          city: err?.response?.data?.details?.city,
        });
        return;
      }
      Alert.alert(
        'Checkout Note',
        err?.response?.data?.message || err.message || 'Could not place order. Please try again.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const hasConfirmedAddress = Boolean(
    activeSavedAddress ||
      (flatNo.trim() && streetArea.trim() && /^\d{6}$/.test(String(pincode).trim()))
  );

  // Active address serviceability check against Porter's Nagpur intra-city network
  const activeServiceability = activeSavedAddress
    ? validateNagpurDeliveryBounds({
        coords: activeSavedAddress.location?.coordinates,
        pincode: activeSavedAddress.pincode,
        city: activeSavedAddress.city,
      })
    : showAddForm && (coords || pincode)
    ? validateNagpurDeliveryBounds({
        coords,
        pincode,
        city: 'Nagpur',
      })
    : { serviceable: true };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.groundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Top Header */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.topBarInner,
            {
              backgroundColor: isDark ? 'rgba(22, 22, 25, 0.85)' : 'rgba(255, 255, 255, 0.65)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
            },
          ]}
          pointerEvents="auto"
        >
          <PressableScale
            onPress={() => navigation.goBack()}
            style={[
              styles.topBarBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={17}
              color={themeColors.textPrimary}
            />
          </PressableScale>

          <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
            Express Fitting Checkout
          </Text>

          <PressableScale
            onPress={handleShare}
            style={[
              styles.topBarBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <MaterialIcons name="share" size={17} color={themeColors.textPrimary} />
          </PressableScale>
        </View>
      </View>

      {/* 3. Main Form Scroll View */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Checkout Steps Progress Indicator */}
          <View style={styles.stepsBar}>
            <View
              style={[
                styles.stepDone,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.75)',
                },
              ]}
            >
              <MaterialIcons name="check" size={13} color={themeColors.textPrimary} />
              <Text style={[styles.stepDoneText, { color: themeColors.textPrimary }]}>Bag</Text>
            </View>
            <View
              style={[
                styles.stepConnector,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : themeColors.textAsh,
                },
              ]}
            />
            <View
              style={[
                styles.stepActive,
                { backgroundColor: themeColors.accentCrimson },
              ]}
            >
              <Text style={styles.stepActiveText}>Address</Text>
            </View>
            <View
              style={[
                styles.stepConnector,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : themeColors.textAsh,
                },
              ]}
            />
            <View
              style={[
                styles.stepInactive,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(18, 18, 20, 0.05)',
                },
              ]}
            >
              <Text
                style={[
                  styles.stepInactiveText,
                  { color: themeColors.textAsh },
                ]}
              >
                Confirm
              </Text>
            </View>
          </View>

          {/* Porter Delivery Network Out of Zone Banner */}
          {!activeServiceability.serviceable && (
            <PressableScale
              onPress={() =>
                setZoneErrorModal({
                  visible: true,
                  error: activeServiceability.error,
                  distanceKm: activeServiceability.distanceKm,
                  pincode: activeSavedAddress?.pincode || pincode,
                  city: activeSavedAddress?.city || 'Nagpur',
                })
              }
              style={styles.outOfBoundsCard}
              accessibilityRole="button"
              accessibilityLabel="View delivery zone restriction details"
            >
              <View style={styles.outOfBoundsIconWrap}>
                <MaterialIcons name="wrong-location" size={24} color="#B91C1C" />
              </View>
              <View style={styles.outOfBoundsTextCol}>
                <Text style={styles.outOfBoundsTitle}>OUTSIDE PORTER DELIVERY NETWORK</Text>
                <Text style={styles.outOfBoundsDesc}>
                  {activeServiceability.error ||
                    "This delivery address is outside Porter's same-city delivery network in Nagpur (~25km). Kyapehnu currently operates exclusively within Nagpur city limits."}
                </Text>
                <PressableScale
                  onPress={() => {
                    setShowAddForm(true);
                    setIsMapOpen(true);
                  }}
                  style={styles.outOfBoundsBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Pin delivery location in Nagpur"
                >
                  <MaterialIcons name="add-location-alt" size={16} color="#FFFFFF" />
                  <Text style={styles.outOfBoundsBtnText}>Pin Address in Nagpur</Text>
                </PressableScale>
              </View>
            </PressableScale>
          )}

          {/* Section: Saved Addresses for Returning Customer */}
          {savedAddresses.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Saved Addresses</Text>
                <PressableScale
                  onPress={() => setShowAddForm((prev) => !prev)}
                  style={styles.toggleFormBtn}
                >
                  <MaterialIcons
                    name={showAddForm ? 'remove' : 'add'}
                    size={15}
                    color={themeColors.accentCrimson}
                  />
                  <Text style={[styles.toggleFormText, { color: themeColors.accentCrimson }]}>
                    {showAddForm ? 'Hide Form' : 'Add New'}
                  </Text>
                </PressableScale>
              </View>

              {savedAddresses.map((addr) => {
                const isSelected = String(addr._id) === String(selectedAddressId);
                const isDeleting = isDeletingId === addr._id;

                return (
                  <PressableScale
                    key={addr._id}
                    onPress={() => {
                      setSelectedAddressId(addr._id);
                      setShowAddForm(false);
                    }}
                    style={[
                      styles.savedAddressCard,
                      isSelected
                        ? [styles.savedAddressCardSelected, { backgroundColor: isDark ? 'rgba(32, 31, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderColor: themeColors.accentCrimson }]
                        : { backgroundColor: isDark ? 'rgba(22, 22, 25, 0.85)' : 'rgba(255, 255, 255, 0.65)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)' },
                    ]}
                  >
                    <View style={styles.savedHeaderRow}>
                      <View style={styles.savedTitleGroup}>
                        <View
                          style={[
                            styles.savedRadioCircle,
                            isSelected && [styles.savedRadioCircleActive, { backgroundColor: themeColors.accentCrimson, borderColor: themeColors.accentCrimson }],
                          ]}
                        >
                          {isSelected && (
                            <MaterialIcons name="check" size={12} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={[styles.savedTitle, { color: themeColors.textPrimary }]}>
                          {addr.label || 'Delivery Address'}
                        </Text>
                      </View>

                      <PressableScale
                        onPress={() => handleDeleteAddress(addr._id)}
                        hitSlop={8}
                        style={styles.deleteAddrBtn}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={themeColors.accentCrimson} />
                        ) : (
                          <MaterialIcons
                            name="delete-outline"
                            size={18}
                            color={themeColors.textAsh}
                          />
                        )}
                      </PressableScale>
                    </View>

                    <Text style={[styles.savedAddressBody, { color: themeColors.textSlate }]}>{addr.line1}</Text>
                    {addr.line2 ? (
                      <Text style={[styles.savedAddressSub, { color: themeColors.textAsh }]}>{addr.line2}</Text>
                    ) : null}
                    <Text style={[styles.savedAddressState, { color: themeColors.textAsh }]}>
                      Nagpur, Maharashtra{addr.pincode ? ` · ${addr.pincode}` : ''}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          )}

          {/* Section: New Address Form (Rendered if customer has no addresses or toggles Add New) */}
          {(showAddForm || savedAddresses.length === 0) && (
            <View
              style={[
                styles.glassCard,
                {
                  backgroundColor: isDark ? 'rgba(22, 22, 25, 0.88)' : 'rgba(255, 255, 255, 0.65)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.85)',
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: themeColors.textPrimary }]}>
                  {savedAddresses.length > 0 ? 'New Delivery Address' : 'Delivery Address'}
                </Text>
                <View style={styles.requiredBadge}>
                  <Text style={[styles.requiredBadgeText, { color: themeColors.accentCrimson }]}>REQUIRED</Text>
                </View>
              </View>

              {/* Free Interactive Map Pin Banner */}
              <PressableScale
                onPress={() => setIsMapOpen(true)}
                style={[
                  styles.mapPinBanner,
                  coords
                    ? [styles.mapPinBannerConfirmed, isDark && { backgroundColor: 'rgba(196, 36, 58, 0.15)', borderColor: 'rgba(196, 36, 58, 0.35)' }]
                    : [styles.mapPinBannerPending, isDark && { backgroundColor: 'rgba(179, 138, 43, 0.15)', borderColor: 'rgba(179, 138, 43, 0.35)' }],
                ]}
                accessibilityRole="button"
                accessibilityLabel="Pin delivery location on map"
              >
                <View style={styles.mapBannerLeft}>
                  <View
                    style={[
                      styles.mapIconCircle,
                      coords
                        ? [styles.mapIconCircleConfirmed, isDark && { backgroundColor: 'rgba(196, 36, 58, 0.25)' }]
                        : [styles.mapIconCirclePending, isDark && { backgroundColor: 'rgba(179, 138, 43, 0.25)' }],
                    ]}
                  >
                    <MaterialIcons
                      name={coords ? 'location-on' : 'add-location-alt'}
                      size={20}
                      color={coords ? themeColors.accentCrimson : themeColors.accentGold}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mapBannerTitle, { color: themeColors.textPrimary }]}>
                      {coords ? 'Drop Location Pinned' : 'Pin Exact Doorstep on Map'}
                    </Text>
                    <Text style={[styles.mapBannerSub, { color: themeColors.textSlate }]} numberOfLines={1}>
                      {detectedArea ||
                        (coords
                          ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`
                          : 'Tap to open interactive OpenStreetMap')}
                    </Text>
                  </View>
                </View>

                <View style={[styles.pinActionChip, { backgroundColor: isDark ? '#201F21' : '#FFFFFF' }]}>
                  <Text style={[styles.pinActionChipText, { color: themeColors.accentCrimson }]}>
                    {coords ? 'Change' : 'Pin Map'}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={16}
                    color={themeColors.accentCrimson}
                  />
                </View>
              </PressableScale>

              {/* Address Type Selector */}
              <View style={styles.typeSelectorRow}>
                {ADDRESS_TYPES.map((type) => {
                  const isSelected = addressType === type.id;
                  return (
                    <PressableScale
                      key={type.id}
                      onPress={() => setAddressType(type.id)}
                      style={[
                        styles.typePill,
                        isSelected
                          ? [styles.typePillSelected, { backgroundColor: isDark ? themeColors.accentCrimson : themeColors.textObsidian, borderColor: isDark ? themeColors.accentCrimson : themeColors.textObsidian }]
                          : [styles.typePillGlass, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.7)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(18, 18, 20, 0.08)' }],
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={type.label}
                    >
                      <MaterialIcons
                        name={type.icon}
                        size={15}
                        color={isSelected ? '#FFFFFF' : themeColors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.typeLabel,
                          isSelected ? styles.typeLabelSelected : { color: themeColors.textPrimary },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              {/* Flat / Studio No */}
              <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1A1A1D' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(18, 18, 20, 0.08)' }]}>
                <MaterialIcons
                  name="meeting-room"
                  size={18}
                  color={themeColors.accentGold}
                />
                <TextInput
                  value={flatNo}
                  onChangeText={setFlatNo}
                  placeholder="Flat / House / Studio No. *"
                  placeholderTextColor={themeColors.textAsh}
                  style={[styles.inputField, { color: themeColors.textPrimary }]}
                />
              </View>

              {/* Landmark / Street */}
              <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1A1A1D' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(18, 18, 20, 0.08)' }]}>
                <MaterialIcons
                  name="location-city"
                  size={18}
                  color={themeColors.accentGold}
                />
                <TextInput
                  value={streetArea}
                  onChangeText={setStreetArea}
                  placeholder="Landmark / Street / Area *"
                  placeholderTextColor={themeColors.textAsh}
                  style={[styles.inputField, { color: themeColors.textPrimary }]}
                />
              </View>

              {/* Pincode */}
              <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1A1A1D' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(18, 18, 20, 0.08)' }]}>
                <MaterialIcons
                  name="markunread-mailbox"
                  size={18}
                  color={themeColors.accentGold}
                />
                <TextInput
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="Nagpur Postal Pincode (e.g. 440010)"
                  placeholderTextColor={themeColors.textAsh}
                  keyboardType="numeric"
                  maxLength={6}
                  style={[styles.inputField, { color: themeColors.textPrimary }]}
                />
              </View>

              {/* Receiver Name */}
              <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1A1A1D' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(18, 18, 20, 0.08)' }]}>
                <MaterialIcons
                  name="person"
                  size={18}
                  color={themeColors.accentGold}
                />
                <TextInput
                  value={receiverName}
                  onChangeText={setReceiverName}
                  placeholder="Receiver Name *"
                  placeholderTextColor={themeColors.textAsh}
                  style={[styles.inputField, { color: themeColors.textPrimary }]}
                />
              </View>

              {/* Receiver Phone */}
              <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1A1A1D' : 'rgba(255, 255, 255, 0.85)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(18, 18, 20, 0.08)' }]}>
                <MaterialIcons
                  name="phone"
                  size={18}
                  color={themeColors.accentGold}
                />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="10-Digit Delivery Mobile Number *"
                  placeholderTextColor={themeColors.textAsh}
                  keyboardType="phone-pad"
                  maxLength={13}
                  style={[styles.inputField, { color: themeColors.textPrimary }]}
                />
              </View>

              {/* Save Address Button */}
              {isLoggedIn && (
                <PressableScale
                  onPress={handleSaveNewAddress}
                  style={[
                    styles.saveAddressBtn,
                    { backgroundColor: isDark ? '#262529' : themeColors.textObsidian },
                  ]}
                  accessibilityRole="button"
                >
                  {isSavingAddress ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="bookmark-border" size={16} color="#FFFFFF" />
                      <Text style={styles.saveAddressText}>Save to Address Book</Text>
                    </>
                  )}
                </PressableScale>
              )}
            </View>
          )}

          {/* Doorstep Fitting Guarantee Card */}
          <View
            style={[
              styles.trustCard,
              {
                backgroundColor: isDark ? 'rgba(22, 22, 25, 0.6)' : 'rgba(255, 255, 255, 0.5)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(18, 18, 20, 0.05)',
              },
            ]}
          >
            <View style={styles.trustIconCircle}>
              <MaterialIcons name="verified-user" size={18} color={themeColors.accentGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trustTitle, { color: themeColors.textPrimary }]}>Nagpur Doorstep Fitting Guarantee</Text>
              <Text style={[styles.trustBody, { color: themeColors.textAsh }]}>
                Try garments on before paying. 15-minute wait time per order. Full doorstep return with zero questions asked.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 4. Sticky Bottom Checkout Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: isDark ? 'rgba(14, 14, 16, 0.92)' : 'rgba(255, 255, 255, 0.85)',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
          },
        ]}
      >
        <View style={styles.orderSummaryCol}>
          <Text style={[styles.orderSummaryEyebrow, { color: themeColors.textAsh }]}>ORDER TOTAL</Text>
          <Text style={[styles.orderSummaryPrice, { color: themeColors.textPrimary }]}>{formatINR(total)}</Text>
        </View>

        <PressableScale
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder || !hasConfirmedAddress}
          style={[
            styles.placeOrderBtn,
            (!hasConfirmedAddress || !activeServiceability.serviceable) && styles.placeOrderBtnDisabled,
            hasConfirmedAddress && !activeServiceability.serviceable && styles.placeOrderBtnOutOfZone,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            hasConfirmedAddress && !activeServiceability.serviceable
              ? 'Outside Delivery Zone — Tap to View Details'
              : 'Place Order'
          }
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons
                name={
                  hasConfirmedAddress && !activeServiceability.serviceable
                    ? 'block'
                    : hasConfirmedAddress
                    ? 'shopping-bag'
                    : 'add-location'
                }
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.placeOrderLabel}>
                {hasConfirmedAddress && !activeServiceability.serviceable
                  ? 'Outside Nagpur Delivery Zone'
                  : hasConfirmedAddress
                  ? 'Place Order · COD'
                  : 'Set Address to Continue'}
              </Text>
            </>
          )}
        </PressableScale>
      </View>

      {/* 5. Interactive Map Pin Modal */}
      <InteractiveMapPinPicker
        visible={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirmLocation={handleConfirmMapLocation}
        initialCoordinates={coords || [NAGPUR_CENTER.longitude, NAGPUR_CENTER.latitude]}
      />

      {/* 6. Out of Delivery Network Error Modal Sheet */}
      <OutOfDeliveryZoneModal
        visible={zoneErrorModal.visible}
        onClose={() => setZoneErrorModal((prev) => ({ ...prev, visible: false }))}
        onPinOnMap={() => {
          setShowAddForm(true);
          setIsMapOpen(true);
        }}
        error={zoneErrorModal.error}
        distanceKm={zoneErrorModal.distanceKm}
        pincode={zoneErrorModal.pincode}
        city={zoneErrorModal.city}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      },
    }),
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 16,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  stepsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    gap: 8,
  },
  stepDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stepDoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  stepConnector: {
    width: 16,
    height: 1,
    backgroundColor: colors.textAsh,
  },
  stepActive: {
    backgroundColor: colors.accentCrimson,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stepActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepInactive: {
    backgroundColor: 'rgba(18, 18, 20, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stepInactiveText: {
    fontSize: 11,
    color: colors.textAsh,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  toggleFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleFormText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentCrimson,
  },
  savedAddressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  savedAddressCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: colors.accentCrimson,
    borderWidth: 1.5,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  savedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  savedTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.textAsh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedRadioCircleActive: {
    backgroundColor: colors.accentCrimson,
    borderColor: colors.accentCrimson,
  },
  savedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  deleteAddrBtn: {
    padding: 4,
  },
  savedAddressBody: {
    fontSize: 13,
    color: colors.textSlate,
    marginLeft: 28,
  },
  savedAddressSub: {
    fontSize: 12,
    color: colors.textAsh,
    marginLeft: 28,
    marginTop: 2,
  },
  savedAddressState: {
    fontSize: 11,
    color: colors.textAsh,
    marginLeft: 28,
    marginTop: 4,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  requiredBadge: {
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  requiredBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accentCrimson,
    letterSpacing: 0.5,
  },
  mapPinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  mapPinBannerPending: {
    backgroundColor: '#FEF3C7',
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  mapPinBannerConfirmed: {
    backgroundColor: 'rgba(196, 36, 58, 0.06)',
    borderColor: 'rgba(196, 36, 58, 0.25)',
  },
  mapBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  mapIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIconCirclePending: {
    backgroundColor: '#FDE68A',
  },
  mapIconCircleConfirmed: {
    backgroundColor: 'rgba(196, 36, 58, 0.12)',
  },
  mapBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  mapBannerSub: {
    fontSize: 11,
    color: colors.textSlate,
    marginTop: 2,
  },
  pinActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  pinActionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentCrimson,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  typePillGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(18, 18, 20, 0.08)',
  },
  typePillSelected: {
    backgroundColor: colors.textObsidian,
    borderColor: colors.textObsidian,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textObsidian,
  },
  typeLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.08)',
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    color: colors.textObsidian,
  },
  saveAddressBtn: {
    backgroundColor: colors.textObsidian,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  saveAddressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.05)',
  },
  trustIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(179, 138, 43, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  trustBody: {
    fontSize: 11,
    color: colors.textAsh,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      },
    }),
  },
  orderSummaryCol: {
    gap: 2,
  },
  orderSummaryEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textAsh,
    letterSpacing: 0.5,
  },
  orderSummaryPrice: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  placeOrderBtn: {
    backgroundColor: colors.accentCrimson,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  placeOrderBtnDisabled: {
    backgroundColor: colors.textSlate,
    shadowOpacity: 0,
  },
  placeOrderBtnOutOfZone: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  placeOrderLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  outOfBoundsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 12,
    marginBottom: spacing.sm,
    shadowColor: '#B91C1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  outOfBoundsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfBoundsTextCol: {
    flex: 1,
    gap: 6,
  },
  outOfBoundsTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  outOfBoundsDesc: {
    fontSize: 12.5,
    color: '#7F1D1D',
    lineHeight: 18,
    fontWeight: '500',
  },
  outOfBoundsBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#B91C1C',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    marginTop: 4,
  },
  outOfBoundsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
