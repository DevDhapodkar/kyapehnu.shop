import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import GlassButton from '../components/GlassButton';
import PressableScale from '../components/PressableScale';
import { selection, notifySuccess, notifyError } from '../utils/haptics';
import { NAGPUR_CENTER, formatINR } from '../data/mockStores';
import { obsidianMapStyle } from '../theme/mapStyle';
import { colors, radii, spacing } from '../theme/colors';
import { ADDRESS_LABELS, DELIVERY_FEE } from '../config/checkout';
import { placeCartOrders } from '../services/checkout';
import { saveUserAddress } from '../api/vendorApi';
import { selectCartItems, selectCartTotal, useCartStore } from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

/** How long the map must sit still before we reverse-geocode the new centre. */
const GEOCODE_DEBOUNCE_MS = 550;

const INITIAL_REGION = {
  latitude: NAGPUR_CENTER.latitude,
  longitude: NAGPUR_CENTER.longitude,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

/**
 * Delivery-address step — the Blinkit-style "drop a pin, then fill your flat"
 * screen that used to be a silent GPS grab inside the cart.
 *
 * The pin is fixed to the centre of the screen; panning the map moves the map
 * *under* it, and when the map settles we reverse-geocode the centre to detect
 * the area + pincode. The buyer types the parts a map can't know (flat number,
 * landmark, who's receiving) and confirms — which is where the order is placed.
 */
export default function AddressScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const geocodeTimer = useRef(null);

  const cartItems = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectCartTotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const profile = useAuthStore((state) => state.profile);

  // Map-pin centre, in {latitude, longitude}. Starts on Nagpur, then jumps to
  // the device's GPS fix on mount if we can get one.
  const [coords, setCoords] = useState({
    latitude: NAGPUR_CENTER.latitude,
    longitude: NAGPUR_CENTER.longitude,
  });
  const [detectedArea, setDetectedArea] = useState('Move the map to set your location');
  const [locating, setLocating] = useState(true);

  const [form, setForm] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    pincode: '',
    receiverName: '',
    receiverPhone: '',
  });
  // Track which fields the buyer edited so auto-detect never overwrites them.
  const touched = useRef({ line2: false, pincode: false });
  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);

  const setField = (key) => (value) => {
    if (key === 'line2' || key === 'pincode') touched.current[key] = true;
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Prefill the receiver from the signed-in profile once it loads.
  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      receiverName: f.receiverName || profile.name || '',
      receiverPhone: f.receiverPhone || profile.phone || '',
    }));
  }, [profile]);

  /** Reverse-geocode a point and fill the area banner + (untouched) fields. */
  const describe = useCallback(async ({ latitude, longitude }) => {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (!place) return;

      const area =
        [place.name, place.street, place.district || place.subregion]
          .filter(Boolean)
          .join(', ') || place.city || 'Nagpur';
      setDetectedArea(area);

      if (!touched.current.pincode && place.postalCode) {
        setForm((f) => ({ ...f, pincode: place.postalCode }));
      }
      if (!touched.current.line2) {
        const landmark = [place.street, place.district || place.subregion]
          .filter(Boolean)
          .join(', ');
        if (landmark) setForm((f) => ({ ...f, line2: landmark }));
      }
    } catch {
      /* geocoder unavailable — keep whatever the buyer has typed */
    }
  }, []);

  /** Centre the map on the device's current position. */
  const goToMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDetectedArea('Location off — pan the map to your address');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(next);
      mapRef.current?.animateToRegion({ ...next, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 600);
      describe(next);
    } catch {
      setDetectedArea('Could not get a fix — pan the map to your address');
    } finally {
      setLocating(false);
    }
  }, [describe]);

  useEffect(() => {
    goToMyLocation();
    return () => clearTimeout(geocodeTimer.current);
  }, [goToMyLocation]);

  /** Map settled on a new centre: remember it and debounce a reverse-geocode. */
  const onRegionChangeComplete = useCallback(
    (region) => {
      const next = { latitude: region.latitude, longitude: region.longitude };
      setCoords(next);
      clearTimeout(geocodeTimer.current);
      geocodeTimer.current = setTimeout(() => describe(next), GEOCODE_DEBOUNCE_MS);
    },
    [describe]
  );

  const total = subtotal + (cartItems.length ? DELIVERY_FEE : 0);

  const handleConfirm = async () => {
    setError(null);

    if (cartItems.length === 0) {
      setError('Your bag is empty.');
      return;
    }
    if (!form.line1.trim()) {
      setError('Enter your flat / house / building.');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError('Enter a valid 6-digit pincode.');
      return;
    }
    if (!form.receiverName.trim()) {
      setError('Enter the name of who is receiving the order.');
      return;
    }
    if (!form.receiverPhone.trim()) {
      setError('Enter a contact number for delivery.');
      return;
    }

    const deliveryAddress = {
      label: form.label,
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: 'Nagpur',
      pincode: form.pincode.trim(),
      receiverName: form.receiverName.trim(),
      receiverPhone: form.receiverPhone.trim(),
      location: {
        type: 'Point',
        coordinates: [coords.longitude, coords.latitude], // GeoJSON: [lng, lat]
      },
    };

    setPlacing(true);
    try {
      const placed = await placeCartOrders({
        items: cartItems,
        deliveryAddress,
        deliveryFee: DELIVERY_FEE,
      });

      // Keep this address in the buyer's book for next time (best-effort — a
      // brand-new account whose profile hasn't synced yet just skips it).
      saveUserAddress(deliveryAddress).catch(() => {});

      // The order is placed — the one moment on this screen a success note earns
      // its place.
      notifySuccess();
      clearCart();
      navigation.navigate('LiveTracking', {
        order: {
          ...placed[0],
          destination: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            label: [form.line1.trim(), detectedArea].filter(Boolean).join(', '),
          },
        },
      });
    } catch (err) {
      notifyError();
      setError(err.message || 'Could not place your order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Fixed map header — kept outside the ScrollView so panning the map
          never fights the vertical scroll on Android. */}
      <View style={styles.mapWrap}>
        {Platform.OS === 'web' ? (
          <View style={[styles.map, styles.mapFallback]}>
            <Text style={styles.mapFallbackText}>
              Open the app on your phone to drop a delivery pin. You can still enter
              your address below.
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            customMapStyle={obsidianMapStyle}
            userInterfaceStyle="dark"
            initialRegion={INITIAL_REGION}
            onRegionChangeComplete={onRegionChangeComplete}
            showsPointsOfInterest={false}
            showsTraffic={false}
            toolbarEnabled={false}
            showsMyLocationButton={false}
          />
        )}

        {/* Fixed centre pin. pointerEvents none so it never eats map gestures. */}
        <View pointerEvents="none" style={styles.pinLayer}>
          <View style={styles.pin}>
            <View style={styles.pinHead}>
              <View style={styles.pinCore} />
            </View>
            <View style={styles.pinStem} />
          </View>
        </View>

        <PressableScale
          onPress={goToMyLocation}
          haptic="light"
          style={styles.locateButton}
          accessibilityLabel="Use my current location"
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.ivory} />
          ) : (
            <Text style={styles.locateGlyph}>◎</Text>
          )}
        </PressableScale>
      </View>

      <KeyboardAvoidingView
        style={styles.formWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.areaBanner}>
            <Text style={styles.areaEyebrow}>DELIVERING TO</Text>
            <Text style={styles.areaText} numberOfLines={2}>
              {detectedArea}
            </Text>
          </View>

          {/* Label chips. */}
          <View style={styles.chipRow}>
          {ADDRESS_LABELS.map((label) => {
            const active = form.label === label;
            return (
              <PressableScale
                key={label}
                haptic={false}
                onPress={() => {
                  if (form.label === label) return;
                  selection();
                  setForm((f) => ({ ...f, label }));
                }}
                accessibilityLabel={`${label} address`}
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </PressableScale>
            );
          })}
        </View>

        <Field
          label="FLAT / HOUSE / BUILDING"
          value={form.line1}
          onChangeText={setField('line1')}
          placeholder="Flat 4B, Rosewood Apartments"
        />
        <Field
          label="AREA / LANDMARK"
          value={form.line2}
          onChangeText={setField('line2')}
          placeholder="Near Wathoda Ring Road"
        />
        <Field
          label="PINCODE"
          value={form.pincode}
          onChangeText={setField('pincode')}
          placeholder="440024"
          keyboardType="number-pad"
          maxLength={6}
        />
        <Field
          label="RECEIVER'S NAME"
          value={form.receiverName}
          onChangeText={setField('receiverName')}
          placeholder="Aarav Sharma"
        />
        <Field
          label="CONTACT NUMBER"
          value={form.receiverPhone}
          onChangeText={setField('receiverPhone')}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

          <GlassButton
            label="Place Order · Cash on Delivery"
            onPress={handleConfirm}
            loading={placing}
            caption={`${formatINR(total)}  ·  pay on delivery`}
            style={styles.confirm}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.slate}
        style={styles.input}
      />
    </View>
  );
}

const PIN_HEAD = 26;
const PIN_STEM = 14;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  formWrap: { flex: 1 },
  content: { padding: spacing.md },

  mapWrap: {
    height: 300,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
    backgroundColor: colors.obsidianDeep,
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapFallback: { alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  mapFallbackText: { color: colors.ash, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // The pin is centred in the map, then lifted by half its own height so the
  // stem's tip — not its middle — rests on the true map centre.
  pinLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    alignItems: 'center',
    transform: [{ translateY: -(PIN_HEAD + PIN_STEM) / 2 }],
  },
  pinHead: {
    width: PIN_HEAD,
    height: PIN_HEAD,
    borderRadius: PIN_HEAD / 2,
    backgroundColor: colors.crimsonBright,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ivory,
  },
  pinCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ivory },
  pinStem: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: PIN_STEM,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.crimsonBright,
    marginTop: -1,
  },

  locateButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.glassFillStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateGlyph: { color: colors.ivory, fontSize: 20, lineHeight: 22 },

  areaBanner: {
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  areaEyebrow: { color: colors.gold, fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  areaText: { color: colors.ivory, fontSize: 14, lineHeight: 20 },

  chipRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.obsidianDeep,
  },
  chipActive: { backgroundColor: colors.crimson, borderColor: colors.crimsonBright },
  chipText: { color: colors.ash, fontSize: 13, letterSpacing: 0.5 },
  chipTextActive: { color: colors.ivory, fontWeight: '600' },

  field: { marginBottom: spacing.sm },
  fieldLabel: { color: colors.slate, fontSize: 9, letterSpacing: 2, marginBottom: 6 },
  input: {
    color: colors.ivory,
    fontSize: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 11,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.obsidianDeep,
  },

  error: { color: colors.crimsonBright, fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.sm },
  confirm: { marginTop: spacing.md },
});
