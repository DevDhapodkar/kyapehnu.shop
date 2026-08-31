import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Chip,
  Field,
  GlassHeader,
  GLASS_HEADER_HEIGHT,
  PillButton,
  Surface,
} from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import useAuthStore from '../store/useAuthStore';
import { friendlyAuthError } from '../services/auth';

/**
 * AuthScreen — sign in, or create an account.
 *
 * One screen, two modes toggled by a link at the foot. The fields differ:
 * registration also collects a name and phone, both of which the backend User
 * document requires.
 *
 * This is a conversion screen, so it takes the ember submit button — the same
 * accent the marketing CTA hands off from, which makes the handover from the
 * scrollytelling to the form read as one continuous action.
 *
 * On success the Firebase listener in the auth store sets the session and this
 * screen pops back to wherever the customer came from (the storefront).
 */
export default function AuthScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
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
      // Pop back to wherever the customer came from; a cold start into Auth
      // has nothing to pop to, so it lands on the storefront instead.
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
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
      <GlassHeader
        title={isRegister ? 'Create Account' : 'Sign In'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + GLASS_HEADER_HEIGHT + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Chip label="Kya Pehnu?" tone="regular" style={styles.chip} />

        <Text style={styles.title}>
          {isRegister ? 'Create your\naccount' : 'Welcome\nback'}
        </Text>
        <Text style={styles.subtitle}>
          {isRegister
            ? 'See what is in stock two streets away.'
            : 'Log in to keep shopping your city.'}
        </Text>

        {!authAvailable ? (
          <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.warn}>
            <Text style={styles.warnTitle}>Sign-in not configured</Text>
            <Text style={styles.warnBody}>
              Add your Firebase web keys to app.json → expo.extra.firebase, then rebuild.
            </Text>
          </Surface>
        ) : null}

        <Surface tone="regular" radius={radii.xl} elevation="medium" style={styles.card} sheen>
          {isRegister ? (
            <>
              <Field
                label="Name"
                value={form.name}
                onChangeText={setField('name')}
                placeholder="Aarav Sharma"
              />
              <Field
                label="Phone"
                value={form.phone}
                onChangeText={setField('phone')}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
              />
            </>
          ) : null}

          <Field
            label="Email"
            value={form.email}
            onChangeText={setField('email')}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="Password"
            value={form.password}
            onChangeText={setField('password')}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PillButton
            label={isRegister ? 'Create account' : 'Log in'}
            variant="gradient"
            size="lg"
            icon="→"
            full
            onPress={onSubmit}
            loading={busy}
            disabled={!authAvailable}
            style={styles.submit}
          />
        </Surface>

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
            hitSlop={8}
          >
            <Text style={styles.switchLink}>{isRegister ? 'Log in' : 'Create one'}</Text>
          </Pressable>
        </View>

        <PillButton
          label="Own a shop? Register your store"
          variant="ghost"
          size="sm"
          icon="→"
          full
          onPress={() => navigation.navigate('VendorRegister')}
          style={styles.vendorLink}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  chip: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    fontSize: 34,
    lineHeight: 39,
    color: colors.ivory,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.ash,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  warn: {
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
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
  card: {
    padding: spacing.md - 2,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.caption,
    fontSize: 13,
    color: colors.rose,
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
    marginBottom: spacing.md,
  },
  switchText: {
    ...typography.body,
    color: colors.ash,
  },
  switchLink: {
    ...typography.body,
    fontWeight: '700',
    color: colors.ivory,
    textDecorationLine: 'underline',
  },
  vendorLink: {
    marginTop: spacing.xs,
  },
});
