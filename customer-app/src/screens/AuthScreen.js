import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  BrandMark,
  Button,
  Icon,
  PressableScale,
  Surface,
  TextField,
} from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';
import { duration, easing, stagger, type } from '../theme/tokens';
import { useAuthStore } from '../store/useAuthStore';
import { friendlyAuthError } from '../services/auth';
import { failure, success } from '../utils/haptics';

/** What each mode promises, so the copy is never assembled inline. */
const COPY = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Log in to keep shopping your city.',
    submit: 'Log in',
    switchPrompt: 'New to Kya Pehnu?',
    switchAction: 'Create one',
  },
  register: {
    title: 'Create your account',
    subtitle: 'See what is in stock two streets away, tonight.',
    submit: 'Create account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Log in',
  },
};

/** The three things an account buys you, shown while the form is still empty. */
const BENEFITS = [
  { icon: 'map-pin', text: 'A catalogue reordered around where you are standing' },
  { icon: 'truck', text: 'Live tracking from the shop counter to your door' },
  { icon: 'shield', text: 'The rider waits while you try it on' },
];

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
  const copy = COPY[mode];

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
      success();
      // Came here from the storefront in the usual case; a cold start straight
      // into Auth has nothing to pop back to.
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
    } catch (err) {
      failure();
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(duration.slow).easing(easing.out)}
          style={styles.masthead}
        >
          <BrandMark variant="lockup" size={44} tagline="Nagpur · delivered" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(duration.slow).easing(easing.out)}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </Animated.View>

        {!authAvailable ? (
          <Surface tone="accent" padding="compact" lift="low" style={styles.warn}>
            <View style={styles.warnRow}>
              <Icon name="alert-triangle" size="sm" color={colors.crimsonGlow} />
              <View style={styles.warnBody}>
                <Text style={styles.warnTitle}>Sign-in not configured</Text>
                <Text style={styles.warnText}>
                  Add your Firebase web keys to app.json → expo.extra.firebase, then rebuild.
                </Text>
              </View>
            </View>
          </Surface>
        ) : null}

        <Animated.View entering={FadeInDown.delay(120).duration(duration.slow).easing(easing.out)}>
          <Surface padding="default" style={styles.card}>
            {isRegister ? (
              <>
                <TextField
                  label="Name"
                  icon="user"
                  value={form.name}
                  onChangeText={setField('name')}
                  placeholder="Aarav Sharma"
                  autoComplete="name"
                />
                <TextField
                  label="Phone"
                  icon="phone"
                  value={form.phone}
                  onChangeText={setField('phone')}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </>
            ) : null}

            <TextField
              label="Email"
              icon="mail"
              value={form.email}
              onChangeText={setField('email')}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextField
              label="Password"
              icon="lock"
              value={form.password}
              onChangeText={setField('password')}
              placeholder="••••••••"
              secure
              autoCapitalize="none"
              error={error}
              hint={isRegister ? 'At least six characters.' : undefined}
            />

            <Button
              label={copy.submit}
              icon={isRegister ? 'user-plus' : 'log-in'}
              onPress={onSubmit}
              loading={busy}
              disabled={!authAvailable}
              size="lg"
              fullWidth
              style={styles.submit}
            />
          </Surface>
        </Animated.View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{copy.switchPrompt}</Text>
          <PressableScale
            onPress={() => {
              setError(null);
              setMode(isRegister ? 'signin' : 'register');
            }}
            haptic="selection"
            scaleTo={0.94}
            accessibilityRole="button"
            style={styles.switchButton}
          >
            <Text style={styles.switchLink}>{copy.switchAction}</Text>
          </PressableScale>
        </View>

        {/* The reasons to bother, shown only where there is room for them. */}
        <View style={styles.benefits}>
          {BENEFITS.map((benefit, index) => (
            <Animated.View
              key={benefit.text}
              entering={FadeIn.delay(220 + stagger(index, 70)).duration(duration.slow)}
              style={styles.benefitRow}
            >
              <View style={styles.benefitIcon}>
                <Icon name={benefit.icon} size="sm" color={colors.gold} />
              </View>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </Animated.View>
          ))}
        </View>

        <PressableScale
          onPress={() => navigation.navigate('VendorRegister')}
          scaleTo={0.98}
          accessibilityRole="button"
          accessibilityLabel="Register your shop"
          style={styles.vendorRow}
        >
          <Icon name="shopping-bag" size="sm" color={colors.platinum} />
          <Text style={styles.vendorLink}>Own a shop? Register your store</Text>
          <Icon name="arrow-right" size="sm" color={colors.platinum} />
        </PressableScale>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  masthead: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    ...type.title,
    fontSize: 30,
  },
  subtitle: {
    ...type.bodySmall,
    marginTop: 6,
    marginBottom: spacing.m,
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
  card: {
    marginBottom: spacing.m,
  },
  submit: {
    marginTop: spacing.s,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  switchText: {
    ...type.bodySmall,
  },
  switchButton: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xxs,
  },
  switchLink: {
    ...type.bodySmall,
    color: colors.ivory,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  benefits: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldWashSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200, 162, 74, 0.24)',
  },
  benefitText: {
    ...type.caption,
    color: colors.ash,
    flex: 1,
    lineHeight: 18,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.m,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  vendorLink: {
    ...type.bodySmall,
    color: colors.platinum,
    flex: 1,
  },
});
