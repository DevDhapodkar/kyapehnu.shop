import { useState } from 'react';
import {
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
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import PressableScale from '../components/PressableScale';
import { formatINR } from '../data/mockStores';
import {
  selectCartItems,
  selectCartTotal,
  useCartStore,
} from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';

const ADDRESS_TYPES = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'work', label: 'Work', icon: 'apartment' },
  { id: 'studio', label: 'Studio', icon: 'dry-cleaning' },
  { id: 'other', label: 'Other', icon: 'more-horiz' },
];

/**
 * AddressScreen — Express Fitting Checkout (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen e6512c6056f541ad8516f9bcf76e8589:
 * - Animated drifting ambient background blobs
 * - Ultra-glass top navigation bar (Back, Title, Share)
 * - 3-step checkout pill stepper: Bag -> Address -> Confirm
 * - GPS location quick-pin banner with "my_location" trigger
 * - Address type tag selector (Home, Work, Studio, Other)
 * - Saved address card with default checkmark
 * - Delivery particulars form (Flat/Room, Landmark, Receiver, Phone)
 * - Nagpur 15-min doorstep fitting trust guarantee badge
 * - Sticky bottom glass order CTA: "Place Order · Cash on Delivery"
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function AddressScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const cartItems = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectCartTotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const profile = useAuthStore((state) => state.profile);

  const [addressType, setAddressType] = useState('home');
  const [flatNo, setFlatNo] = useState('Flat 402, Palm Grove');
  const [streetArea, setStreetArea] = useState(
    'Palm Grove Apts, VCA Stadium Rd, Civil Lines'
  );
  const [receiverName, setReceiverName] = useState(
    profile?.displayName || 'Ananya Sharma'
  );
  const [phone, setPhone] = useState(profile?.phone || '+91 98230 44102');
  const [isLocating, setIsLocating] = useState(false);
  const [detectedArea, setDetectedArea] = useState('Civil Lines, Nagpur (440001)');

  const total = subtotal > 0 ? subtotal : 4800;

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Kya Pehnu? - Nagpur Express 15-Minute Fitting Checkout',
      });
    } catch {
      // ignore
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please allow location access to auto-detect your Nagpur address.'
        );
        setIsLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        const areaStr = [geo.district || geo.subregion, geo.city, geo.postalCode]
          .filter(Boolean)
          .join(', ');
        setDetectedArea(areaStr || 'Sitabuldi, Nagpur (440012)');
      }
    } catch (_e) {
      setDetectedArea('Sitabuldi, Nagpur (440012)');
    } finally {
      setIsLocating(false);
    }
  };

  const handlePlaceOrder = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const orderPayload = {
      orderId: 'KP-' + Math.floor(1000 + Math.random() * 9000),
      items: cartItems.length > 0 ? cartItems : [{ name: 'Chanderi Angrakha', price: 4800, quantity: 1 }],
      total,
      address: {
        flatNo,
        streetArea,
        area: detectedArea,
        type: addressType,
        receiverName,
        phone,
      },
      createdAt: new Date().toISOString(),
      etaMinutes: 18,
      status: 'out_for_delivery',
      rider: {
        name: 'Rameshwar T.',
        vehicle: 'Honda Activa · MH 31 EQ 8492',
        phone: '+91 98221 55940',
      },
    };

    clearCart();

    navigation.navigate('LiveTracking', { order: orderPayload });
  };

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

          {/* Location Quick-Pin Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationLeft}>
              <MaterialIcons
                name="location-on"
                size={22}
                color={colors.accentGold}
              />
              <View style={styles.locationTextCol}>
                <Text style={styles.detectedAreaText} numberOfLines={1}>
                  {detectedArea}
                </Text>
                <Text style={styles.distanceBadgeText}>
                  Gandhibagh Atelier · 2.1 km away
                </Text>
              </View>
            </View>

            <PressableScale
              onPress={handleUseCurrentLocation}
              style={styles.locateBtn}
              accessibilityRole="button"
              accessibilityLabel="Use current location"
            >
              <MaterialIcons
                name="my-location"
                size={16}
                color={isLocating ? colors.accentCrimson : colors.textObsidian}
              />
            </PressableScale>
          </View>

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

          {/* Saved Address Card */}
          <View style={styles.savedAddressCard}>
            <View style={styles.savedHeaderRow}>
              <View style={styles.savedTitleGroup}>
                <View style={styles.savedCheckCircle}>
                  <MaterialIcons name="check" size={13} color="#FFFFFF" />
                </View>
                <Text style={styles.savedTitle}>{flatNo}</Text>
              </View>
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            </View>

            <Text style={styles.savedAddressBody}>{streetArea}</Text>
            <Text style={styles.savedAddressState}>
              Nagpur, Maharashtra · 440001
            </Text>
          </View>

          {/* Delivery Particulars Form */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Delivery Particulars</Text>

            {/* Flat / Studio */}
            <View style={styles.inputWrap}>
              <MaterialIcons
                name="meeting-room"
                size={18}
                color={colors.accentGold}
              />
              <TextInput
                value={flatNo}
                onChangeText={setFlatNo}
                placeholder="Flat / House / Studio No."
                placeholderTextColor={colors.textAsh}
                style={styles.inputField}
              />
            </View>

            {/* Landmark / Area */}
            <View style={styles.inputWrap}>
              <MaterialIcons
                name="location-city"
                size={18}
                color={colors.accentGold}
              />
              <TextInput
                value={streetArea}
                onChangeText={setStreetArea}
                placeholder="Landmark / Area / Street"
                placeholderTextColor={colors.textAsh}
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
                placeholder="Receiver Name"
                placeholderTextColor={colors.textAsh}
                style={styles.inputField}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputWrap}>
              <MaterialIcons
                name="call"
                size={18}
                color={colors.accentGold}
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone (for fitting concierge)"
                placeholderTextColor={colors.textAsh}
                keyboardType="phone-pad"
                style={styles.inputField}
              />
            </View>
          </View>

          {/* Doorstep Trial Guarantee Badge */}
          <View style={styles.guaranteeCard}>
            <MaterialIcons
              name="verified-user"
              size={24}
              color={colors.accentCrimson}
            />
            <View style={styles.guaranteeTextCol}>
              <Text style={styles.guaranteeTitle}>
                Nagpur Express Fitting · 15-Min Doorstep Trial
              </Text>
              <Text style={styles.guaranteeSubtitle}>
                Try your garment in the comfort of your home before paying.
                Concierge will wait and assist with fit.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 4. Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomBarWrap,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <View style={styles.bottomBar}>
          <View style={styles.priceCol}>
            <Text style={styles.priceValue}>{formatINR(total)}</Text>
            <Text style={styles.priceSubtitle}>Pay after doorstep trial</Text>
          </View>

          <PressableScale
            onPress={handlePlaceOrder}
            style={styles.placeOrderBtn}
            accessibilityRole="button"
            accessibilityLabel="Place Order"
          >
            <Text style={styles.placeOrderLabel}>Place Order · COD</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
          </PressableScale>
        </View>
      </View>
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
  headerTitle: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm + 2,
  },
  stepsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
  },
  stepDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  stepDoneText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '600',
  },
  stepConnector: {
    width: 16,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  stepActive: {
    backgroundColor: colors.textObsidian,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  stepActiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepInactive: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  stepInactiveText: {
    color: colors.textAsh,
    fontSize: 11,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  locationTextCol: {
    flex: 1,
  },
  detectedAreaText: {
    color: colors.textObsidian,
    fontSize: 13.5,
    fontWeight: '700',
  },
  distanceBadgeText: {
    color: colors.accentGoldDeep,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  locateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: radii.md,
  },
  typePillSelected: {
    backgroundColor: colors.textObsidian,
  },
  typePillGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  typeLabel: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '600',
  },
  typeLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  savedAddressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.accentCrimson,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  savedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  savedTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTitle: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
  },
  defaultBadge: {
    backgroundColor: 'rgba(18, 18, 20, 0.05)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 9999,
  },
  defaultBadgeText: {
    color: colors.textSlate,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  savedAddressBody: {
    color: colors.textSlate,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  savedAddressState: {
    color: colors.textAsh,
    fontSize: 11,
    marginTop: 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  cardTitle: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputField: {
    flex: 1,
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '500',
  },
  guaranteeCard: {
    backgroundColor: 'rgba(244, 63, 94, 0.06)',
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.18)',
  },
  guaranteeTextCol: {
    flex: 1,
  },
  guaranteeTitle: {
    color: colors.accentCrimson,
    fontSize: 12,
    fontWeight: '700',
  },
  guaranteeSubtitle: {
    color: colors.textSlate,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  bottomBarWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    zIndex: 50,
  },
  bottomBar: {
    height: 64,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(36px) saturate(210%)',
        WebkitBackdropFilter: 'blur(36px) saturate(210%)',
      },
    }),
  },
  priceCol: {
    gap: 1,
  },
  priceValue: {
    color: colors.textObsidian,
    fontSize: 17.5,
    fontWeight: '700',
  },
  priceSubtitle: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
  },
  placeOrderBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  placeOrderLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
