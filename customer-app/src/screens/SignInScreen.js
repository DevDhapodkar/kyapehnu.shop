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
import { signUpWithEmail, signInWithEmail } from '../services/auth';
import { syncUserProfile } from '../api/customerApi';
import useAuthStore, { ROLES } from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';

/**
 * Email/password auth (free, no SMS cost). Sign-up collects the phone up front
 * because a COD delivery needs a number to call. On success the backend profile
 * is synced and the session token enters the shared axios seam via the store;
 * `useAuthInit` then keeps it fresh. Phone OTP can replace this later without
 * touching callers.
 */
export default function SignInScreen({ navigation, route }) {
  const [mode, setMode] = useState(route.params?.mode === 'signup' ? 'signup' : 'signin');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const signIn = useAuthStore((s) => s.signIn);
  const isSignup = mode === 'signup';
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (isSignup && !form.name.trim()) return setError('Please enter your name.');
    if (!form.email.trim()) return setError('Please enter your email.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (isSignup && form.phone.trim().length < 6) return setError('Please enter a phone number for delivery.');

    setBusy(true);
    try {
      if (isSignup) {
        const { user, token } = await signUpWithEmail({
          name: form.name,
          email: form.email,
          password: form.password,
        });
        await syncUserProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
        signIn({
          user: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), uid: user.uid },
          token,
          role: ROLES.CUSTOMER,
        });
      } else {
        const { user, token } = await signInWithEmail({ email: form.email, password: form.password });
        signIn({ user: { email: form.email.trim(), uid: user.uid }, token, role: ROLES.CUSTOMER });
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message);
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
        <Text style={styles.title}>{isSignup ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isSignup
            ? 'A minute to join — then shop what’s in stock two streets away.'
            : 'Sign in to pick up where you left off.'}
        </Text>

        {isSignup ? (
          <Field label="NAME" value={form.name} onChangeText={set('name')} placeholder="Your name" autoCapitalize="words" />
        ) : null}

        <Field
          label="EMAIL"
          value={form.email}
          onChangeText={set('email')}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        {isSignup ? (
          <Field
            label="PHONE (for delivery)"
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="98765 43210"
            keyboardType="phone-pad"
          />
        ) : null}

        <Field
          label="PASSWORD"
          value={form.password}
          onChangeText={set('password')}
          placeholder="At least 6 characters"
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <GlassButton
          label={isSignup ? 'Create account' : 'Sign in'}
          onPress={submit}
          loading={busy}
          style={styles.submit}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {isSignup ? 'Already have an account?' : 'New to Kya Pehnu?'}
          </Text>
          <Pressable onPress={() => { setError(null); setMode(isSignup ? 'signin' : 'signup'); }} hitSlop={8}>
            <Text style={styles.switchLink}>{isSignup ? 'Sign in' : 'Create one'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...inputProps} placeholderTextColor={colors.slate} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  content: { padding: spacing.lg, paddingTop: spacing.xl * 2 },
  eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 3, marginBottom: spacing.sm },
  title: { color: colors.ivory, fontSize: 30, fontWeight: '300', letterSpacing: -0.5, marginBottom: spacing.xs },
  subtitle: { color: colors.ash, fontSize: 14, lineHeight: 21, marginBottom: spacing.lg },
  field: { marginBottom: spacing.sm },
  fieldLabel: { color: colors.slate, fontSize: 9, letterSpacing: 2, marginBottom: 6 },
  input: {
    color: colors.ivory,
    fontSize: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.obsidianDeep,
  },
  error: { color: colors.crimsonBright, fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.xs },
  submit: { marginTop: spacing.md },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.lg },
  switchText: { color: colors.ash, fontSize: 13 },
  switchLink: { color: colors.ivory, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
