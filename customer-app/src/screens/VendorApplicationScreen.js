import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import { fetchMyVendorApplication, submitVendorApplication } from '../api/vendorApi';
import {
  emptyApplication,
  toApplicationPayload,
  validateApplication,
  VENDOR_CATEGORIES,
} from '../vendor/applicationForm';
import { colors, radii, spacing } from '../theme/colors';

/**
 * "Apply to become a vendor" — the shop-owner intake form.
 *
 * A customer opens this from their Profile. On submit it POSTs a VendorApplication
 * to the backend, which lands in the admin review queue; the admin approves it
 * (promoting the account to VENDOR) or rejects it with a reason. The screen loads
 * any existing application first so it can show live status and let the applicant
 * edit and resubmit while pending or after a rejection.
 */
export default function VendorApplicationScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState(emptyApplication);
  const [errors, setErrors] = useState({});
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const prefillFrom = useCallback((app) => {
    if (!app) return;
    setForm((prev) => ({
      ...prev,
      shopName: app.shopName ?? '',
      ownerName: app.ownerName ?? '',
      phone: app.phone ?? '',
      whatsappNumber: app.whatsappNumber ?? '',
      category: app.category ?? 'BOTH',
      description: app.description ?? '',
      yearsInBusiness: app.yearsInBusiness != null ? String(app.yearsInBusiness) : '',
      gstin: app.gstin ?? '',
      line1: app.address?.line1 ?? '',
      area: app.address?.area ?? '',
      city: app.address?.city ?? 'Nagpur',
      pincode: app.address?.pincode ?? '',
    }));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const app = await fetchMyVendorApplication();
        if (!active) return;
        setApplication(app);
        prefillFrom(app);
      } catch {
        // No backend / not reachable — the form still works, submit will surface it.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [prefillFrom]);

  const setField = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (submitError) setSubmitError(null);
  };

  const onSubmit = async () => {
    const { valid, errors: formErrors } = validateApplication(form);
    if (!valid) {
      setErrors(formErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);
    try {
      const saved = await submitVendorApplication(toApplicationPayload(form));
      setApplication(saved);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isApproved = application?.status === 'APPROVED';
  const isPending = application?.status === 'PENDING';
  const isRejected = application?.status === 'REJECTED';

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.ivory} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>SELL ON KYA PEHNU?</Text>
        <Text style={styles.title}>Put your shop on the map.</Text>
        <Text style={styles.subtitle}>
          Tell us about your store. Our team reviews every application before your shop
          goes live to buyers nearby.
        </Text>

        {application ? <StatusBanner application={application} /> : null}

        {isApproved ? (
          <GlassButton
            label="Go to my order desk"
            onPress={() => navigation.goBack()}
            style={styles.block}
          />
        ) : (
          <GlassCard style={styles.card}>
            <Section>Shop</Section>
            <Field label="Shop name" value={form.shopName} onChangeText={setField('shopName')}
              placeholder="e.g. Sitabuldi Threads" error={errors.shopName} editable={!submitting} />
            <Field label="Owner name" value={form.ownerName} onChangeText={setField('ownerName')}
              placeholder="Your full name" error={errors.ownerName} editable={!submitting} />

            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.chips}>
              {VENDOR_CATEGORIES.map((c) => {
                const active = form.category === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setField('category')(c.key)}
                    style={[styles.chip, active && styles.chipActive]}
                    disabled={submitting}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Field label="Years in business (optional)" value={form.yearsInBusiness}
              onChangeText={setField('yearsInBusiness')} placeholder="e.g. 8" keyboardType="number-pad"
              error={errors.yearsInBusiness} editable={!submitting} />
            <Field label="About the shop (optional)" value={form.description}
              onChangeText={setField('description')} placeholder="What do you sell?" multiline
              editable={!submitting} />

            <Section>Contact</Section>
            <Field label="Phone" value={form.phone} onChangeText={setField('phone')}
              placeholder="10-digit mobile number" keyboardType="phone-pad" error={errors.phone}
              editable={!submitting} />
            <Field label="WhatsApp (optional — defaults to phone)" value={form.whatsappNumber}
              onChangeText={setField('whatsappNumber')} placeholder="Order alerts go here"
              keyboardType="phone-pad" error={errors.whatsappNumber} editable={!submitting} />
            <Field label="GSTIN (optional)" value={form.gstin} onChangeText={setField('gstin')}
              placeholder="For verification" autoCapitalize="characters" editable={!submitting} />

            <Section>Address</Section>
            <Field label="Address line" value={form.line1} onChangeText={setField('line1')}
              placeholder="Shop no., street" error={errors.line1} editable={!submitting} />
            <Field label="Area / locality" value={form.area} onChangeText={setField('area')}
              placeholder="e.g. Dharampeth" error={errors.area} editable={!submitting} />
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <Field label="City" value={form.city} onChangeText={setField('city')}
                  placeholder="Nagpur" editable={!submitting} />
              </View>
              <View style={styles.rowField}>
                <Field label="Pincode" value={form.pincode} onChangeText={setField('pincode')}
                  placeholder="440012" keyboardType="number-pad" error={errors.pincode}
                  editable={!submitting} />
              </View>
            </View>

            {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

            <GlassButton
              label={isPending || isRejected ? 'Resubmit application' : 'Submit application'}
              onPress={onSubmit}
              loading={submitting}
              style={styles.block}
            />
          </GlassCard>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Coloured banner reflecting the current review status. */
function StatusBanner({ application }) {
  const map = {
    PENDING: { color: colors.gold, title: 'Under review', body: 'Your application is with our team. We’ll flip your app to the shop desk once it’s approved.' },
    APPROVED: { color: '#6ad29b', title: 'Approved', body: 'You’re a vendor. Reopen the app to land on your order desk.' },
    REJECTED: { color: colors.crimsonBright, title: 'Not approved', body: application.adminNotes || 'Please review your details and resubmit.' },
  };
  const s = map[application.status] ?? map.PENDING;
  return (
    <View style={[styles.banner, { borderColor: s.color }]}>
      <Text style={[styles.bannerTitle, { color: s.color }]}>{s.title.toUpperCase()}</Text>
      <Text style={styles.bannerBody}>{s.body}</Text>
    </View>
  );
}

function Section({ children }) {
  return <Text style={styles.section}>{children}</Text>;
}

function Field({ label, error, style, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        style={[styles.input, inputProps.multiline && styles.inputMultiline, error && styles.inputError, style]}
        placeholderTextColor={colors.slate}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 3, marginBottom: spacing.sm },
  title: { color: colors.ivory, fontSize: 28, fontWeight: '300', letterSpacing: -0.5, marginBottom: spacing.xs },
  subtitle: { color: colors.ash, fontSize: 14, lineHeight: 21, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  block: { marginTop: spacing.md },
  section: { color: colors.gold, fontSize: 10, letterSpacing: 2, marginTop: spacing.md, marginBottom: spacing.xs },
  field: { marginBottom: spacing.md },
  fieldLabel: { color: colors.slate, fontSize: 9, letterSpacing: 2, marginBottom: spacing.xs, marginTop: spacing.xs },
  input: {
    color: colors.ivory, fontSize: 15, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  inputError: { borderColor: colors.crimsonBright },
  fieldError: { color: colors.crimsonBright, fontSize: 12, marginTop: spacing.xs },
  rowFields: { flexDirection: 'row', gap: spacing.sm },
  rowField: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  chip: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassBorder, backgroundColor: colors.glassFill,
  },
  chipActive: { borderColor: colors.crimsonBright, backgroundColor: colors.crimson },
  chipLabel: { color: colors.platinum, fontSize: 13 },
  chipLabelActive: { color: colors.ivory, fontWeight: '600' },
  error: { color: colors.crimsonBright, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  banner: {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.md, padding: spacing.md,
    marginBottom: spacing.lg, backgroundColor: colors.glassFill,
  },
  bannerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  bannerBody: { color: colors.platinum, fontSize: 13, lineHeight: 20 },
});
