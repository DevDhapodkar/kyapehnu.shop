import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';

import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import PressableScale from '../components/PressableScale';
import { impactLight, notifySuccess, notifyError } from '../utils/haptics';
import { colors, radii, spacing } from '../theme/colors';
import useAuthStore, { ROLES } from '../store/useAuthStore';
import { registerVendor } from '../api/vendorApi';

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
      // The pin dropped — a light confirmation that the fix landed.
      impactLight();

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

      notifySuccess();
      setVendorProfile(vendor);
      setRole(ROLES.VENDOR);
    } catch (err) {
      notifyError();
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>SELL ON KYA PEHNU?</Text>
        <Text style={styles.title}>Register your shop</Text>
        <Text style={styles.subtitle}>
          Take a photo, list a garment, and buyers within 5 km can see it tonight. Your listings
          go live after a quick quality check.
        </Text>

        {!token ? (
          <GlassCard strong compact style={styles.warn}>
            <Text style={styles.warnTitle}>Sign in first</Text>
            <Text style={styles.warnBody}>
              Registration links the shop to your account.{' '}
              <Text style={styles.warnLink} onPress={() => navigation.navigate('Auth', { mode: 'signin' })}>
                Sign in
              </Text>
              , then come back.
            </Text>
          </GlassCard>
        ) : null}

        <GlassCard strong compact style={styles.card}>
          <Field label="SHOP NAME" value={form.shopName} onChangeText={setField('shopName')} placeholder="Sitabuldi Silks" />
          <Field label="OWNER NAME" value={form.ownerName} onChangeText={setField('ownerName')} placeholder="Priya Deshmukh" />
          <Field label="PHONE" value={form.phone} onChangeText={setField('phone')} placeholder="+91 98765 43210" keyboardType="phone-pad" />
          <Field
            label="WHATSAPP (ORDER ALERTS)"
            value={form.whatsappNumber}
            onChangeText={setField('whatsappNumber')}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
          />
          <Field
            label="EMAIL"
            value={form.email}
            onChangeText={setField('email')}
            placeholder="shop@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </GlassCard>

        <GlassCard strong compact style={styles.card}>
          <Text style={styles.groupLabel}>SHOP ADDRESS</Text>
          <Field label="STREET / SHOP NO." value={form.line1} onChangeText={setField('line1')} placeholder="Shop 14, Gandhibagh Rd" />
          <Field label="AREA" value={form.area} onChangeText={setField('area')} placeholder="Sitabuldi" />
          <Field label="PINCODE" value={form.pincode} onChangeText={setField('pincode')} placeholder="440012" keyboardType="number-pad" />

          <PressableScale
            onPress={useMyLocation}
            haptic={false}
            accessibilityLabel="Use my current location"
            style={styles.locBtn}
          >
            <Text style={styles.locBtnText}>
              {locating ? 'GETTING LOCATION…' : coords ? '✓ LOCATION CAPTURED' : '📍 USE MY CURRENT LOCATION'}
            </Text>
          </PressableScale>
        </GlassCard>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <GlassButton label="Register Shop" onPress={onSubmit} loading={busy} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, multiline, style, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={colors.slate}
        style={[styles.input, multiline && styles.inputMultiline, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 3, marginBottom: spacing.sm },
  title: { color: colors.ivory, fontSize: 28, fontWeight: '300', letterSpacing: -0.5 },
  subtitle: { color: colors.ash, fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: spacing.md },
  warn: { marginBottom: spacing.sm },
  warnTitle: { color: colors.ivory, fontSize: 14 },
  warnBody: { color: colors.ash, fontSize: 12, marginTop: 4, lineHeight: 18 },
  warnLink: { color: colors.ivory, textDecorationLine: 'underline' },
  card: { marginBottom: spacing.sm },
  groupLabel: { color: colors.slate, fontSize: 9, letterSpacing: 2, marginBottom: spacing.sm },
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
  inputMultiline: { minHeight: 74, textAlignVertical: 'top' },
  locBtn: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
  },
  locBtnText: { color: colors.platinum, fontSize: 11, letterSpacing: 1.4 },
  error: { color: colors.crimsonBright, fontSize: 13, marginBottom: spacing.sm },
  submit: { marginTop: spacing.xs },
});
