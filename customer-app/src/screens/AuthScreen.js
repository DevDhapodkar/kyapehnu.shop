import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import BrandLogo from '../components/BrandLogo';
import PressableScale from '../components/PressableScale';
import { useAuthStore } from '../store/useAuthStore';
import { friendlyAuthError } from '../services/auth';
import { colors, radii, spacing } from '../theme/colors';

/**
 * AuthScreen — Sign In & Auth (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen 10cb534fd02541f4b4842c0de9068f40:
 * - Animated drifting ambient background blobs
 * - Top bar with close button & "Explore as Guest"
 * - Mode toggle: Sign In vs Register
 * - Clean frosted input cards for credentials
 * - Social login buttons: Apple & Google
 * - Direct artisan / vendor registration shortcut
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function AuthScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialMode = route?.params?.mode === 'register' ? 'register' : 'signin';
  const [mode, setMode] = useState(initialMode);
  const isRegister = mode === 'register';

  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const registerWithEmail = useAuthStore((state) => state.registerWithEmail);
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const setField = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);
    if (isRegister && !form.name.trim()) return setError('Enter your name.');
    if (isRegister && !form.phone.trim()) return setError('Enter your phone number.');
    if (!form.email.trim()) return setError('Enter your email.');
    if (!form.password) return setError('Enter a password.');

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

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
        await signInWithEmail({
          email: form.email.trim(),
          password: form.password,
        });
      }
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

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setError('Enter your email address above to receive a password reset link.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    try {
      await sendPasswordReset(form.email.trim());
      setSuccessMessage(`Password reset link sent to ${form.email.trim()}. Check your inbox.`);
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  };

  const handleExploreAsGuest = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Top Bar */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarInner} pointerEvents="auto">
          <PressableScale
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialIcons name="close" size={18} color={colors.textObsidian} />
          </PressableScale>

          <PressableScale
            onPress={handleExploreAsGuest}
            style={styles.guestBtn}
            accessibilityRole="button"
            accessibilityLabel="Explore as Guest"
          >
            <Text style={styles.guestBtnText}>Explore as Guest</Text>
          </PressableScale>
        </View>
      </View>

      {/* 3. Main Scrollable Form */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 68,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Card with Stitch Official Identity */}
          <View style={styles.headerSection}>
            <View style={styles.brandContainer}>
              <BrandLogo size="lg" showEmblem={true} />
            </View>
            <View style={styles.eyebrowBadge}>
              <View style={styles.crimsonDot} />
              <Text style={styles.eyebrow}>KYA PEHNU? · PROXIMITY COUTURE</Text>
            </View>
            <Text style={styles.title}>
              {isRegister ? 'Create Account' : 'Welcome back'}
            </Text>
            <Text style={styles.subtitle}>
              Discover Nagpur’s handloom & couture ateliers.
            </Text>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabsRow}>
            <PressableScale
              onPress={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              style={[styles.tab, !isRegister && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, !isRegister && styles.tabTextActive]}
              >
                Sign In
              </Text>
            </PressableScale>

            <PressableScale
              onPress={() => {
                setMode('register');
                setError(null);
                setSuccessMessage(null);
              }}
              style={[styles.tab, isRegister && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, isRegister && styles.tabTextActive]}
              >
                Register
              </Text>
            </PressableScale>
          </View>

          {/* Success Banner */}
          {successMessage ? (
            <View style={styles.successCard}>
              <MaterialIcons
                name="check-circle-outline"
                size={16}
                color={colors.accentEmerald}
              />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorCard}>
              <MaterialIcons
                name="error-outline"
                size={16}
                color={colors.accentCrimson}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Fields Card */}
          <View style={styles.glassCard}>
            {isRegister ? (
              <>
                <View style={styles.inputWrap}>
                  <MaterialIcons
                    name="person"
                    size={18}
                    color={colors.accentGold}
                  />
                  <TextInput
                    value={form.name}
                    onChangeText={setField('name')}
                    placeholder="Full Name"
                    placeholderTextColor={colors.textAsh}
                    style={styles.inputField}
                  />
                </View>

                <View style={styles.inputWrap}>
                  <MaterialIcons
                    name="call"
                    size={18}
                    color={colors.accentGold}
                  />
                  <TextInput
                    value={form.phone}
                    onChangeText={setField('phone')}
                    placeholder="Mobile Number"
                    placeholderTextColor={colors.textAsh}
                    keyboardType="phone-pad"
                    style={styles.inputField}
                  />
                </View>
              </>
            ) : null}

            {/* Email */}
            <View style={styles.inputWrap}>
              <MaterialIcons
                name="mail-outline"
                size={18}
                color={colors.accentGold}
              />
              <TextInput
                value={form.email}
                onChangeText={setField('email')}
                placeholder="name@example.com"
                placeholderTextColor={colors.textAsh}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.inputField}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <MaterialIcons
                name="lock-outline"
                size={18}
                color={colors.accentGold}
              />
              <TextInput
                value={form.password}
                onChangeText={setField('password')}
                placeholder="Password"
                placeholderTextColor={colors.textAsh}
                secureTextEntry
                style={styles.inputField}
              />
              {!isRegister ? (
                <PressableScale
                  onPress={handleForgotPassword}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot?</Text>
                </PressableScale>
              ) : null}
            </View>

            {/* Submit Button */}
            <PressableScale
              onPress={handleSubmit}
              disabled={busy}
              style={styles.submitBtn}
              accessibilityRole="button"
              accessibilityLabel={isRegister ? 'Create Account' : 'Sign In'}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitLabel}>
                    {isRegister ? 'Create Account' : 'Sign In'}
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={17}
                    color="#FFFFFF"
                  />
                </>
              )}
            </PressableScale>
          </View>

          {/* Vendor Registration Card */}
          <PressableScale
            onPress={() => navigation.navigate('VendorRegister')}
            style={styles.vendorCard}
          >
            <View style={styles.vendorIconWrap}>
              <MaterialIcons
                name="storefront"
                size={20}
                color={colors.accentGoldDeep}
              />
            </View>
            <View style={styles.vendorTextWrap}>
              <Text style={styles.vendorLinkPre}>Are you a Nagpur boutique or artisan?</Text>
              <Text style={styles.vendorLinkCta}>Register shop for 60-min delivery →</Text>
            </View>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4EFE7',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
  },
  topBarInner: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  guestBtnText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  headerSection: {
    paddingHorizontal: 4,
    marginTop: spacing.xs,
  },
  brandContainer: {
    marginBottom: 10,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  crimsonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
  },
  eyebrow: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textObsidian,
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subtitle: {
    color: colors.textSlate,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: colors.textObsidian,
  },
  tabText: {
    color: colors.textSlate,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  errorText: {
    color: colors.accentCrimson,
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  successCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  successText: {
    color: colors.accentEmerald,
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(210%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%)',
      },
    }),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  inputField: {
    flex: 1,
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '500',
  },
  forgotBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  forgotText: {
    color: colors.accentGoldDeep,
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: radii.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xs,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    marginTop: spacing.xs,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  vendorIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  vendorTextWrap: {
    flex: 1,
    gap: 2,
  },
  vendorLinkPre: {
    color: colors.textAsh,
    fontSize: 11.5,
    fontWeight: '500',
  },
  vendorLinkCta: {
    color: colors.accentGoldDeep,
    fontSize: 12.5,
    fontWeight: '700',
  },
});
