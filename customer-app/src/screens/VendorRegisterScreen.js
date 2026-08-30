import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

import { Chip, Field, Glow, PillButton, SectionHeader, Surface } from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
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
 * VendorRegisterScreen — shop onboarding.
 *
 * Registers (upserts) the shop for the signed-in Firebase account, captures the
 * shop's coordinates for the customer discovery feed, and flips the app into
 * VENDOR mode on success.
 *
 * The form is split into two bento panels — who you are, then where you are —
 * because the second half can be filled by one tap on "use my location", and
 * grouping it makes that shortcut land beside the fields it fills.
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

      setVendorProfile(vendor);
      setRole(ROLES.VENDOR);
    } catch (err) {
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
      <Glow color={colors.amber} size={400} intensity={0.32} style={styles.glow} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Chip label="Sell on Kya Pehnu?" tone="glass" style={styles.chip} />

        <Text style={styles.title}>Register{'\n'}your shop</Text>
        <Text style={styles.subtitle}>
          Take a photo, list a garment, and buyers within 5 km can see it tonight. Your listings
          go live after a quick quality check.
        </Text>

        {!token ? (
          <Surface tone="surface" radius={radii.lg} elevation="low" style={styles.warn}>
            <Text style={styles.warnTitle}>Sign in first</Text>
            <Text style={styles.warnBody}>
              Registration links the shop to your account.
            </Text>
            <PillButton
              label="Sign in"
              size="sm"
              icon="→"
              onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
              style={styles.warnAction}
            />
          </Surface>
        ) : null}

        <Surface tone="surface" radius={radii.xl} elevation="medium" style={styles.card} sheen>
          <SectionHeader eyebrow="Step one" title="The shop" style={styles.cardHeader} />

          <Field
            label="SHOP NAME"
            value={form.shopName}
            onChangeText={setField('shopName')}
            placeholder="Sitabuldi Silks"
          />
          <Field
            label="OWNER NAME"
            value={form.ownerName}
            onChangeText={setField('ownerName')}
            placeholder="Priya Deshmukh"
          />
          <Field
            label="PHONE"
            value={form.phone}
            onChangeText={setField('phone')}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
          />
          <Field
            label="WHATSAPP (ORDER ALERTS)"
            value={form.whatsappNumber}
            onChangeText={setField('whatsappNumber')}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            hint="Every new order pings this number the moment it is placed."
          />
          <Field
            label="EMAIL"
            value={form.email}
            onChangeText={setField('email')}
            placeholder="shop@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Surface>

        <Surface tone="surface" radius={radii.xl} elevation="medium" style={styles.card} sheen>
          <SectionHeader
            eyebrow="Step two"
            title="Where you are"
            caption="This is what puts your rail in front of the buyers standing nearest to it."
            style={styles.cardHeader}
          />

          <PillButton
            label={
              locating
                ? 'Getting location…'
                : coords
                  ? 'Location captured'
                  : 'Use my current location'
            }
            variant={coords ? 'glass' : 'light'}
            size="sm"
            icon={coords ? '✓' : '◎'}
            loading={locating}
            onPress={useMyLocation}
            style={styles.locationBtn}
          />

          <Field
            label="STREET / SHOP NO."
            value={form.line1}
            onChangeText={setField('line1')}
            placeholder="Shop 14, Gandhibagh Rd"
          />
          <View style={styles.twoCol}>
            <Field
              label="AREA"
              value={form.area}
              onChangeText={setField('area')}
              placeholder="Sitabuldi"
              containerStyle={styles.colField}
            />
            <Field
              label="PINCODE"
              value={form.pincode}
              onChangeText={setField('pincode')}
              placeholder="440012"
              keyboardType="number-pad"
              containerStyle={styles.colField}
            />
          </View>
        </Surface>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PillButton
          label="Register shop"
          variant="gradient"
          size="lg"
          icon="→"
          full
          onPress={onSubmit}
          loading={busy}
          style={styles.submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  glow: {
    position: 'absolute',
    top: -190,
    right: -130,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  chip: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    lineHeight: 37,
    color: colors.ivory,
  },
  subtitle: {
    ...typography.body,
    color: colors.ash,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  warn: {
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  warnTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.amber,
  },
  warnBody: {
    ...typography.caption,
    color: colors.ash,
    marginTop: 4,
  },
  warnAction: {
    marginTop: spacing.sm,
  },
  card: {
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    marginBottom: spacing.md - 2,
  },
  locationBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md - 2,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colField: {
    flex: 1,
  },
  error: {
    ...typography.caption,
    fontSize: 13,
    color: colors.crimsonBright,
    marginBottom: spacing.sm,
  },
  submit: {
    marginTop: spacing.xs,
  },
});
