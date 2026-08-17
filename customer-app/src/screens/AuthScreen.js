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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import { validateAuthForm } from '../auth/validation';
import { isFirebaseConfigured } from '../config/firebase';
import useAuthStore from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';

/**
 * AuthScreen — the real login system's single surface.
 *
 * Sign-in and sign-up share one screen so the returning-customer and new-customer
 * paths feel like one door: a mode toggle swaps the two extra fields (name,
 * phone) in and out rather than pushing a second route. It is reachable from the
 * marketing CTA (`Join now` → signup, `Log in` → signin) and, on success, the
 * auth store flips `status` to authenticated and the navigator unmounts this
 * screen back to the storefront.
 *
 * Route param: `{ mode: 'signin' | 'signup' }` chooses the initial mode.
 */
export default function AuthScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState(route?.params?.mode === 'signup' ? 'signup' : 'signin');
  const [fields, setFields] = useState({ name: '', email: '', phone: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const busy = useAuthStore((state) => state.busy);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);

  const isSignup = mode === 'signup';
  const configured = isFirebaseConfigured();

  const setField = (key) => (value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as the user starts fixing it.
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    if (authError) clearAuthError();
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setFieldErrors({});
    clearAuthError();
  };

  const onSubmit = async () => {
    const { valid, errors } = validateAuthForm(mode, fields);
    if (!valid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      if (isSignup) {
        await signUpWithEmail(fields);
      } else {
        await signInWithEmail({ email: fields.email, password: fields.password });
      }
      // On success the navigator swaps this screen out; nothing else to do.
    } catch {
      // Message is surfaced via `authError` from the store.
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>KYA PEHNU?</Text>
        <Text style={styles.title}>{isSignup ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isSignup
            ? 'One account to shop the city and, if you run a shop, to work your order desk.'
            : 'Sign in to pick up where you left off.'}
        </Text>

        <GlassCard style={styles.card}>
          {!configured ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Firebase not configured</Text>
              <Text style={styles.noticeBody}>
                Set your Firebase web keys in an .env file (EXPO_PUBLIC_FIREBASE_*) or
                app.json’s expo.extra.firebase, then reload. See customer-app/.env.example.
              </Text>
            </View>
          ) : null}

          {isSignup ? (
            <Field
              label="Name"
              value={fields.name}
              onChangeText={setField('name')}
              placeholder="Your full name"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              error={fieldErrors.name}
              editable={!busy}
            />
          ) : null}

          <Field
            label="Email"
            value={fields.email}
            onChangeText={setField('email')}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={fieldErrors.email}
            editable={!busy}
          />

          {isSignup ? (
            <Field
              label="Phone"
              value={fields.phone}
              onChangeText={setField('phone')}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={fieldErrors.phone}
              editable={!busy}
            />
          ) : null}

          <Field
            label="Password"
            value={fields.password}
            onChangeText={setField('password')}
            placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            textContentType={isSignup ? 'newPassword' : 'password'}
            error={fieldErrors.password}
            editable={!busy}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />

          {authError ? <Text style={styles.formError}>{authError}</Text> : null}

          <GlassButton
            label={isSignup ? 'Create account' : 'Log in'}
            onPress={onSubmit}
            loading={busy}
            disabled={!configured}
            style={styles.submit}
          />
        </GlassCard>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {isSignup ? 'Already have an account?' : 'New to Kya Pehnu?'}
          </Text>
          <Pressable onPress={switchMode} disabled={busy} hitSlop={spacing.xs}>
            <Text style={styles.switchLink}>{isSignup ? 'Log in' : 'Create one'}</Text>
          </Pressable>
        </View>

        {navigation?.canGoBack?.() ? (
          <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={spacing.xs}>
            <Text style={styles.backLabel}>Keep browsing</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** One labelled text input with an inline error slot below it. */
function Field({ label, error, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.slate}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  brand: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.ivory,
    fontSize: 30,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.ash,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  notice: {
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold,
    backgroundColor: colors.glassFill,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  noticeTitle: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  noticeBody: {
    color: colors.platinum,
    fontSize: 12,
    lineHeight: 18,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  input: {
    color: colors.ivory,
    fontSize: 15,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
  },
  inputError: {
    borderColor: colors.crimsonBright,
  },
  fieldError: {
    color: colors.crimsonBright,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  formError: {
    color: colors.crimsonBright,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  submit: {
    marginTop: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  switchText: {
    color: colors.ash,
    fontSize: 13,
  },
  switchLink: {
    color: colors.ivory,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  back: {
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  backLabel: {
    color: colors.slate,
    fontSize: 12,
    letterSpacing: 1,
  },
});
