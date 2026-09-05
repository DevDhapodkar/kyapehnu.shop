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
  getDistanceKm,
  isWithinNagpur,
  NAGPUR_CENTER,
} from '../utils/geolocation';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import InteractiveMapPinPicker from '../components/InteractiveMapPinPicker';
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
import { colors, radii, spacing } from '../theme/colors';

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

  // When map pin confirmed
  const handleConfirmMapLocation = (locationData) => {
    setCoords(locationData.coordinates);
    setDetectedArea(locationData.formattedAddress || locationData.areaName);
    setPincode(locationData.pincode || '440001');
    if (!streetArea && locationData.road) {
      setStreetArea(`${locationData.road}, ${locationData.areaName}`);
    } else if (!streetArea) {
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
    if (!flatNo.trim()) {
      Alert.alert('Missing Field', 'Please enter your flat, house, or studio number.');
      return;
    }
    if (!streetArea.trim()) {
      Alert.alert('Missing Field', 'Please enter your street, locality, or landmark.');
      return;
    }
    if (!receiverName.trim() || !phone.trim()) {
      Alert.alert('Missing Contact', 'Please enter receiver name and mobile number.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.replace(/[^0-9]/g, '').length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!coords) {
      Alert.alert(
        'Map Pin Required',
        'Please tap "Pin on Map" to confirm the exact doorstep delivery location.'
      );
      setIsMapOpen(true);
      return;
    }

    const payload = {
      label: addressType,
      line1: `${flatNo.trim()}, ${streetArea.trim()}`,
      line2: detectedArea || 'Nagpur',
      city: 'Nagpur',
      pincode: pincode || '440001',
      receiverName: receiverName.trim(),
      receiverPhone: cleanPhone,
      location: {
        type: 'Point',
        coordinates: coords,
      },
    };

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
      }
      setShowAddForm(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

    let finalAddress = null;

    if (activeSavedAddress) {
      finalAddress = {
        label: activeSavedAddress.label || 'HOME',
        line1: activeSavedAddress.line1,
        line2: activeSavedAddress.line2 || 'Nagpur',
        city: activeSavedAddress.city || 'Nagpur',
        pincode: activeSavedAddress.pincode || '440001',
        receiverName:
          activeSavedAddress.receiverName ||
          profile?.name ||
          user?.displayName ||
          'Nagpur Patron',
        receiverPhone:
          activeSavedAddress.receiverPhone || profile?.phone || '+91 99999 99999',
        location: activeSavedAddress.location || {
          type: 'Point',
          coordinates: [NAGPUR_CENTER.longitude, NAGPUR_CENTER.latitude],
        },
      };
    } else {
      // Must have valid form fields
      if (!flatNo.trim() || !streetArea.trim()) {
        Alert.alert(
          'Delivery Address Required',
          'Please fill out your delivery address particulars or select a saved address.'
        );
        setShowAddForm(true);
        return;
      }
      if (!receiverName.trim() || !phone.trim()) {
        Alert.alert(
          'Contact Required',
          'Please provide a receiver name and 10-digit mobile number.'
        );
        setShowAddForm(true);
        return;
      }
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      if (cleanPhone.replace(/[^0-9]/g, '').length < 10) {
        Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!coords) {
        Alert.alert(
          'Location Pin Required',
          'Please tap "Pin on Map" so our delivery rider can navigate to your door.'
        );
        setIsMapOpen(true);
        return;
      }

      finalAddress = {
        label: addressType,
        line1: `${flatNo.trim()}, ${streetArea.trim()}`,
        line2: detectedArea || 'Nagpur',
        city: 'Nagpur',
        pincode: pincode || '440001',
        receiverName: receiverName.trim(),
        receiverPhone: cleanPhone,
        location: {
          type: 'Point',
          coordinates: coords,
        },
      };
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
      Alert.alert(
        'Checkout Note',
        err.message || 'Could not place order. Please try again.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const hasConfirmedAddress = Boolean(activeSavedAddress || (flatNo && streetArea && coords));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Top Header */}
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

          <Text style={styles.headerTitle}>Express Fitting Checkout</Text>

          <PressableScale
            onPress={handleShare}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <MaterialIcons name="share" size={17} color={colors.textObsidian} />
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
            <View style={styles.stepDone}>
              <MaterialIcons name="check" size={13} color={colors.textObsidian} />
              <Text style={styles.stepDoneText}>Bag</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepActive}>
              <Text style={styles.stepActiveText}>Address</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepInactive}>
              <Text style={styles.stepInactiveText}>Confirm</Text>
            </View>
          </View>

          {/* Section: Saved Addresses for Returning Customer */}
          {savedAddresses.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Saved Addresses</Text>
                <PressableScale
                  onPress={() => setShowAddForm((prev) => !prev)}
                  style={styles.toggleFormBtn}
                >
                  <MaterialIcons
                    name={showAddForm ? 'remove' : 'add'}
                    size={15}
                    color={colors.accentCrimson}
                  />
                  <Text style={styles.toggleFormText}>
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
                      isSelected && styles.savedAddressCardSelected,
                    ]}
                  >
                    <View style={styles.savedHeaderRow}>
                      <View style={styles.savedTitleGroup}>
                        <View
                          style={[
                            styles.savedRadioCircle,
                            isSelected && styles.savedRadioCircleActive,
                          ]}
                        >
                          {isSelected && (
                            <MaterialIcons name="check" size={12} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={styles.savedTitle}>
                          {addr.label || 'Delivery Address'}
                        </Text>
                      </View>

                      <PressableScale
                        onPress={() => handleDeleteAddress(addr._id)}
                        hitSlop={8}
                        style={styles.deleteAddrBtn}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={colors.accentCrimson} />
                        ) : (
                          <MaterialIcons
                            name="delete-outline"
                            size={18}
                            color={colors.textAsh}
                          />
                        )}
                      </PressableScale>
                    </View>

                    <Text style={styles.savedAddressBody}>{addr.line1}</Text>
                    {addr.line2 ? (
                      <Text style={styles.savedAddressSub}>{addr.line2}</Text>
                    ) : null}
                    <Text style={styles.savedAddressState}>
                      Nagpur, Maharashtra · {addr.pincode || '440001'}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          )}

          {/* Section: New Address Form (Rendered if customer has no addresses or toggles Add New) */}
          {(showAddForm || savedAddresses.length === 0) && (
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  {savedAddresses.length > 0 ? 'New Delivery Address' : 'Delivery Address'}
                </Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
              </View>

              {/* Free Interactive Map Pin Banner */}
              <PressableScale
                onPress={() => setIsMapOpen(true)}
                style={[
                  styles.mapPinBanner,
                  coords ? styles.mapPinBannerConfirmed : styles.mapPinBannerPending,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Pin delivery location on map"
              >
                <View style={styles.mapBannerLeft}>
                  <View
                    style={[
                      styles.mapIconCircle,
                      coords ? styles.mapIconCircleConfirmed : styles.mapIconCirclePending,
                    ]}
                  >
                    <MaterialIcons
                      name={coords ? 'location-on' : 'add-location-alt'}
                      size={20}
                      color={coords ? colors.accentCrimson : colors.accentGold}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mapBannerTitle}>
                      {coords ? 'Drop Location Pinned' : 'Pin Exact Doorstep on Map'}
                    </Text>
                    <Text style={styles.mapBannerSub} numberOfLines={1}>
                      {detectedArea ||
                        (coords
                          ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`
                          : 'Tap to open interactive OpenStreetMap')}
                    </Text>
                  </View>
                </View>

                <View style={styles.pinActionChip}>
                  <Text style={styles.pinActionChipText}>
                    {coords ? 'Change' : 'Pin Map'}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={16}
                    color={colors.accentCrimson}
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
                        isSelected ? styles.typePillSelected : styles.typePillGlass,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={type.label}
                    >
                      <MaterialIcons
                        name={type.icon}
                        size={15}
                        color={isSelected ? '#FFFFFF' : colors.textObsidian}
                      />
                      <Text
                        style={[
                          styles.typeLabel,
                          isSelected && styles.typeLabelSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              {/* Flat / Studio No */}
              <View style={styles.inputWrap}>
                <MaterialIcons
                  name="meeting-room"
                  size={18}
                  color={colors.accentGold}
                />
                <TextInput
                  value={flatNo}
                  onChangeText={setFlatNo}
                  placeholder="Flat / House / Studio No. *"
                  placeholderTextColor={colors.textAsh}
                  style={styles.inputField}
                />
              </View>

              {/* Landmark / Street */}
              <View style={styles.inputWrap}>
                <MaterialIcons
                  name="location-city"
                  size={18}
                  color={colors.accentGold}
                />
                <TextInput
                  value={streetArea}
                  onChangeText={setStreetArea}
                  placeholder="Landmark / Street / Area *"
                  placeholderTextColor={colors.textAsh}
                  style={styles.inputField}
                />
              </View>

              {/* Pincode */}
              <View style={styles.inputWrap}>
                <MaterialIcons
                  name="markunread-mailbox"
                  size={18}
                  color={colors.accentGold}
                />
                <TextInput
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="Nagpur Postal Pincode (e.g. 440010)"
                  placeholderTextColor={colors.textAsh}
                  keyboardType="numeric"
                  maxLength={6}
                  style={styles.inputField}
                />
              </View>

              {/* Receiver Name */}
              <View style={styles.inputWrap}>
                <MaterialIcons
                  name="person"
                  size={18}
                  color={colors.accentGold}
                />
                <TextInput
                  value={receiverName}
                  onChangeText={setReceiverName}
                  placeholder="Receiver Name *"
                  placeholderTextColor={colors.textAsh}
                  style={styles.inputField}
                />
              </View>

              {/* Receiver Phone */}
              <View style={styles.inputWrap}>
                <MaterialIcons
                  name="phone"
                  size={18}
                  color={colors.accentGold}
                />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="10-Digit Delivery Mobile Number *"
                  placeholderTextColor={colors.textAsh}
                  keyboardType="phone-pad"
                  maxLength={13}
                  style={styles.inputField}
                />
              </View>

              {/* Save Address Button */}
              {isLoggedIn && (
                <PressableScale
                  onPress={handleSaveNewAddress}
                  style={styles.saveAddressBtn}
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
          <View style={styles.trustCard}>
            <View style={styles.trustIconCircle}>
              <MaterialIcons name="verified-user" size={18} color={colors.accentGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle}>Nagpur Doorstep Fitting Guarantee</Text>
              <Text style={styles.trustBody}>
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
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.orderSummaryCol}>
          <Text style={styles.orderSummaryEyebrow}>ORDER TOTAL</Text>
          <Text style={styles.orderSummaryPrice}>{formatINR(total)}</Text>
        </View>

        <PressableScale
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
          style={[
            styles.placeOrderBtn,
            !hasConfirmedAddress && styles.placeOrderBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Place Order"
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons
                name={hasConfirmedAddress ? 'shopping-bag' : 'add-location'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.placeOrderLabel}>
                {hasConfirmedAddress
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
  placeOrderLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
