import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import { colors, radii, spacing } from '../theme/colors';
import useAuthStore from '../store/useAuthStore';
import { friendlyAuthError } from '../services/auth';

/**
 * Customer sign-in / create-account. One screen, two modes toggled by a link at
 * the foot — the fields differ (registration also collects a name and phone,
 * both of which the backend User document requires).
 *
 * On success the Firebase listener in the auth store sets the session and this
 * screen pops back to wherever the customer came from (the storefront).
 */
export default function AuthScreen({ navigation, route }) {
  const initialMode = route?.params?.mode === 'register' ? 'register' : 'signin';
  const [mode, setMode] = useState(initialMode);
  const isRegister = mode === 'register';

  const authAvailable = useAuthStore((state) => state.authAvailable);
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const registerWithEmail = useAuthStore((state) => state.registerWithEmail);

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setError(null);

    if (isRegister && !form.name.trim()) return setError('Enter your name.');
    if (isRegister && !form.phone.trim()) return setError('Enter your phone number.');
    if (!form.email.trim()) return setError('Enter your email.');
    if (!form.password) return setError('Enter a password.');

    setBusy(true);
    try {
      if (isRegister) {
        await registerWithEmail({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await signInWithEmail({ email: form.email.trim(), password: form.password });
      }
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home');
    } catch (err) {
      setError(friendlyAuthError(err));
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
        <Text style={styles.eyebrow}>KYA PEHNU?</Text>
        <Text style={styles.title}>{isRegister ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isRegister
            ? 'See what is in stock two streets away.'
            : 'Log in to keep shopping your city.'}
        </Text>

        {!authAvailable ? (
          <GlassCard strong compact style={styles.warn}>
            <Text style={styles.warnTitle}>Sign-in not configured</Text>
            <Text style={styles.warnBody}>
              Add your Firebase web keys to app.json → expo.extra.firebase, then rebuild.
            </Text>
          </GlassCard>
        ) : null}

        <GlassCard strong compact style={styles.card}>
          {isRegister ? (
            <>
              <Field label="NAME" value={form.name} onChangeText={setField('name')} placeholder="Aarav Sharma" />
              <Field
                label="PHONE"
                value={form.phone}
                onChangeText={setField('phone')}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
              />
            </>
          ) : null}

          <Field
            label="EMAIL"
            value={form.email}
            onChangeText={setField('email')}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="PASSWORD"
            value={form.password}
            onChangeText={setField('password')}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GlassButton
            label={isRegister ? 'Create Account' : 'Log In'}
            onPress={onSubmit}
            loading={busy}
            disabled={!authAvailable}
            style={styles.submit}
          />
        </GlassCard>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {isRegister ? 'Already have an account?' : 'New to Kya Pehnu?'}
          </Text>
          <Pressable
            onPress={() => {
              setError(null);
              setMode(isRegister ? 'signin' : 'register');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.switchLink}>{isRegister ? 'Log in' : 'Create one'}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate('VendorRegister')}
          accessibilityRole="button"
          style={styles.vendorLinkRow}
        >
          <Text style={styles.vendorLink}>Own a shop? Register your store →</Text>
        </Pressable>
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
  content: { padding: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 3, marginBottom: spacing.sm },
  title: { color: colors.ivory, fontSize: 30, fontWeight: '300', letterSpacing: -0.5 },
  subtitle: { color: colors.ash, fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: spacing.md },
  warn: { marginBottom: spacing.sm },
  warnTitle: { color: colors.ivory, fontSize: 14 },
  warnBody: { color: colors.ash, fontSize: 12, marginTop: 4, lineHeight: 18 },
  card: { marginBottom: spacing.md },
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
  error: { color: colors.crimsonBright, fontSize: 13, marginBottom: spacing.sm },
  submit: { marginTop: spacing.xs },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.md },
  switchText: { color: colors.ash, fontSize: 13 },
  switchLink: { color: colors.ivory, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  vendorLinkRow: { alignItems: 'center', marginTop: spacing.xs },
  vendorLink: { color: colors.platinum, fontSize: 13, letterSpacing: 0.4 },
});
