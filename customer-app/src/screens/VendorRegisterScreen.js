import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';

import {
  BrandMark,
  Button,
  Icon,
  SectionHeader,
  Surface,
  TextField,
} from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';
import { duration, easing, stagger, type } from '../theme/tokens';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { registerVendor } from '../api/vendorApi';
import { failure, success } from '../utils/haptics';

// Fallback when the shopkeeper skips the location grab: Nagpur city centre.
const NAGPUR_CENTER = [79.0882, 21.1458]; // [lng, lat]

const EMPTY = {
  shopName: '',
  ownerName: '',
  phone: '',
  whatsappNumber: '',
  email: '',
  line1: '',
  area: '',
  pincode: '',
};

/** What a shopkeeper gets, said plainly before the form asks for anything. */
const PITCH = [
  { icon: 'camera', text: 'List a garment by sending one photo to WhatsApp' },
  { icon: 'bell', text: 'Order alerts land on the phone already at your counter' },
  { icon: 'truck', text: 'A Porter rider is dispatched to your shutter for you' },
];

/**
 * Vendor onboarding. Registers (upserts) the shop for the signed-in Firebase
 * account, captures the shop's coordinates for the customer discovery feed, and
 * flips the app into VENDOR mode on success.
 *
 * Requires a signed-in session — the backend keys the shop off the Firebase
 * uid — so an unauthenticated visitor is routed to sign in first.
 */
export default function VendorRegisterScreen({ navigation }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setRole = useAuthStore((state) => state.setRole);
  const setVendorProfile = useAuthStore((state) => state.setVendorProfile);

  const [form, setForm] = useState({ ...EMPTY, email: user?.email ?? '' });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied — we will use Nagpur city centre.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords([pos.coords.longitude, pos.coords.latitude]);

      // Auto-fill the address from the device's free geocoder (no API key).
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const g = geo?.[0];
        if (g) {
          setForm((f) => ({
            ...f,
            line1: f.line1 || [g.name, g.street].filter(Boolean).join(' '),
            area: f.area || g.district || g.subregion || g.city || '',
            pincode: f.pincode || g.postalCode || '',
          }));
        }
      } catch {
        /* geocoder unavailable — leave fields for manual entry */
      }
    } catch {
      setError('Could not read your location — we will use Nagpur city centre.');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async () => {
    setError(null);

    if (!token) {
      setError('Please sign in first, then register your shop.');
      navigation.navigate('Auth', { mode: 'signin' });
      return;
    }
    if (!form.shopName.trim()) return setError('Enter your shop name.');
    if (!form.ownerName.trim()) return setError('Enter the owner name.');
    if (!form.phone.trim()) return setError('Enter a phone number.');
    if (!form.whatsappNumber.trim()) return setError('Enter a WhatsApp number for order alerts.');
    if (!form.line1.trim() || !form.area.trim() || !form.pincode.trim()) {
      return setError('Fill in the shop address (street, area, pincode).');
    }

    setBusy(true);
    try {
      const vendor = await registerVendor({
        shopName: form.shopName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        email: (form.email || user?.email || '').trim(),
        address: {
          line1: form.line1.trim(),
          area: form.area.trim(),
          city: 'Nagpur',
          pincode: form.pincode.trim(),
        },
        location: { type: 'Point', coordinates: coords ?? NAGPUR_CENTER },
        operatingHours: [],
      });

      success();
      setVendorProfile(vendor);
      setRole(ROLES.VENDOR);
    } catch (err) {
      failure();
      setError(err.message || 'Could not register your shop.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(duration.slow).easing(easing.out)}
          style={styles.masthead}
        >
          <BrandMark size={38} />
          <SectionHeader
            eyebrow="Sell on Kya Pehnu?"
            title="Register your shop"
            description="Take a photo, list a garment, and buyers within 5 km can see it tonight. Your listings go live after a quick quality check."
            style={styles.header}
          />
        </Animated.View>

        <View style={styles.pitch}>
          {PITCH.map((item, index) => (
            <Animated.View
              key={item.text}
              entering={FadeInDown.delay(stagger(index, 70))
                .duration(duration.slow)
                .easing(easing.out)}
              style={styles.pitchRow}
            >
              <View style={styles.pitchIcon}>
                <Icon name={item.icon} size="sm" color={colors.gold} />
              </View>
              <Text style={styles.pitchText}>{item.text}</Text>
            </Animated.View>
          ))}
        </View>

        {!token ? (
          <Surface tone="accent" padding="compact" lift="low" style={styles.warn}>
            <View style={styles.warnRow}>
              <Icon name="lock" size="sm" color={colors.crimsonGlow} />
              <View style={styles.warnBody}>
                <Text style={styles.warnTitle}>Sign in first</Text>
                <Text style={styles.warnText}>
                  Registration links the shop to your account.{' '}
                  <Text
                    style={styles.warnLink}
                    onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
                  >
                    Sign in
                  </Text>
                  , then come back.
                </Text>
              </View>
            </View>
          </Surface>
        ) : null}

        <Surface padding="default" style={styles.card}>
          <Text style={styles.groupLabel}>THE SHOP</Text>
          <TextField
            label="Shop name"
            icon="shopping-bag"
            value={form.shopName}
            onChangeText={setField('shopName')}
            placeholder="Sitabuldi Silks"
          />
          <TextField
            label="Owner name"
            icon="user"
            value={form.ownerName}
            onChangeText={setField('ownerName')}
            placeholder="Priya Deshmukh"
          />
          <TextField
            label="Phone"
            icon="phone"
            value={form.phone}
            onChangeText={setField('phone')}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
          />
          <TextField
            label="WhatsApp (order alerts)"
            icon="message-circle"
            value={form.whatsappNumber}
            onChangeText={setField('whatsappNumber')}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            hint="Every new order pings this number."
          />
          <TextField
            label="Email"
            icon="mail"
            value={form.email}
            onChangeText={setField('email')}
            placeholder="shop@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Surface>

        <Surface padding="default" style={styles.card}>
          <Text style={styles.groupLabel}>SHOP ADDRESS</Text>
          <TextField
            label="Street / shop no."
            icon="map"
            value={form.line1}
            onChangeText={setField('line1')}
            placeholder="Shop 14, Gandhibagh Rd"
          />
          <TextField
            label="Area"
            icon="map-pin"
            value={form.area}
            onChangeText={setField('area')}
            placeholder="Sitabuldi"
          />
          <TextField
            label="Pincode"
            icon="hash"
            value={form.pincode}
            onChangeText={setField('pincode')}
            placeholder="440012"
            keyboardType="number-pad"
          />

          <Button
            label={
              locating
                ? 'Getting location…'
                : coords
                  ? 'Location captured'
                  : 'Use my current location'
            }
            icon={coords ? 'check-circle' : 'crosshair'}
            variant={coords ? 'secondary' : 'ghost'}
            onPress={useMyLocation}
            loading={locating}
            fullWidth
            style={styles.locationButton}
          />
          <Text style={styles.locationHint}>
            Pins your shutter on the map so nearby buyers see you first.
          </Text>
        </Surface>

        {error ? (
          <View style={styles.errorRow}>
            <Icon name="alert-circle" size="sm" color={colors.crimsonGlow} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <Button
          label="Register shop"
          icon="check"
          onPress={onSubmit}
          loading={busy}
          size="lg"
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  masthead: {
    marginBottom: spacing.sm,
  },
  header: {
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  pitch: {
    gap: spacing.s,
    marginTop: spacing.m,
    marginBottom: spacing.m,
  },
  pitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pitchIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldWashSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200, 162, 74, 0.24)',
  },
  pitchText: {
    ...type.caption,
    color: colors.ash,
    flex: 1,
    lineHeight: 18,
  },
  warn: {
    marginBottom: spacing.sm,
  },
  warnRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  warnBody: {
    flex: 1,
  },
  warnTitle: {
    ...type.subheading,
    fontSize: 14,
  },
  warnText: {
    ...type.caption,
    color: colors.ash,
    marginTop: 4,
    lineHeight: 17,
  },
  warnLink: {
    color: colors.ivory,
    textDecorationLine: 'underline',
  },
  card: {
    marginBottom: spacing.sm,
  },
  groupLabel: {
    ...type.eyebrow,
    color: colors.slate,
    fontSize: 9,
    marginBottom: spacing.sm,
  },
  locationButton: {
    marginTop: spacing.xs,
  },
  locationHint: {
    ...type.caption,
    color: colors.slate,
    marginTop: spacing.s,
    textAlign: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.crimsonWashSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196, 36, 58, 0.3)',
  },
  error: {
    ...type.bodySmall,
    color: colors.crimsonGlow,
    flex: 1,
  },
});
