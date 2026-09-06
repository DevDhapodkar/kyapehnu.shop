import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
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
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import PressableScale from '../components/PressableScale';
import { useAuthStore } from '../store/useAuthStore';
import { useStorefrontStore } from '../store/useStorefrontStore';
import { friendlyAuthError } from '../services/auth';
import { colors, radii, spacing } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * AuthScreen — Sign In & Auth (Apple Glass Redesign)
 *
 * Implements Stitch Screen 71d1f6dd753845798a9b5a0f4212caf2:
 * - Glowing drifting ambient background blobs
 * - Top bar with circular frosted back button & "Explore as Guest" pill
 * - Brand introduction with Stitch official emblem and proximity couture eyebrow
 * - Main frosted glass card (backdrop blur, white porcelain hairline border)
 * - Segmented switcher: Sign In vs Register
 * - Inputs with uppercase labels, icons, and password reveal toggle
 * - Primary gradient action: "Continue to Nagpur Ateliers" / "Create Atelier Account"
 * - Divider with "or" badge
 * - Social Auth options: Apple & Google with live web integration
 * - Boutique onboarding gateway & verified encryption trust capsule
 */
export default function AuthScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialMode = route?.params?.mode === 'register' ? 'register' : 'signin';
  const [mode, setMode] = useState(initialMode);
  const isRegister = mode === 'register';

  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const registerWithEmail = useAuthStore((state) => state.registerWithEmail);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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
    if (!form.email.trim()) return setError('Enter your email address.');
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setBusy(true);
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home');
        }
      }
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(friendlyAuthError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAppleSignIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setError('Apple Sign-In is configured for native iOS builds. Use email or Google for instant web access.');
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setError('Enter your email address in the field below to receive a password reset link.');
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
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    useStorefrontStore.getState().setGuestExplore(true);
    navigation.navigate('Home');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Ambient Drifting Glowing Orbs */}
      <AmbientBackgroundBlobs />

      <View style={styles.outerContainer}>
        <View style={styles.frameContainer}>
          {/* 2. Top Navigation Bar */}
          <View
            style={[
              styles.topBar,
              { paddingTop: Math.max(insets.top + 6, 16) },
            ]}
          >
            {/* Back Circular Button */}
            <PressableScale
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
              style={styles.backCircleBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <MaterialIcons name="chevron-left" size={24} color="#131316" />
            </PressableScale>

            {/* Guest Pass Pill */}
            <PressableScale
              onPress={handleExploreAsGuest}
              style={styles.guestPill}
              accessibilityRole="button"
              accessibilityLabel="Explore as Guest"
            >
              <Text style={styles.guestPillText}>Explore as Guest</Text>
              <MaterialIcons name="chevron-right" size={16} color="#131316" />
            </PressableScale>
          </View>

          {/* 3. Main Scrollable Form */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingBottom: Math.max(insets.bottom + 24, 32),
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header / Brand Intro */}
              <View style={styles.headerSection}>
                <View style={styles.brandBadgeRow}>
                  <View style={styles.emblemBox}>
                    <Image
                      source={require('../../assets/images/stitch-emblem.png')}
                      style={styles.emblemImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.eyebrowContainer}>
                    <View style={styles.crimsonDot} />
                    <Text style={styles.eyebrowText}>KYA PEHNU? · PROXIMITY COUTURE</Text>
                  </View>
                </View>

                <Text style={styles.headerTitle}>
                  {isRegister ? 'Create Account' : 'Welcome back'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  Discover Nagpur’s handloom & couture ateliers.
                </Text>
              </View>

              {/* Main Frosted Glass Form Card */}
              <View style={styles.glassCard}>
                {/* Segmented Tab: Sign In vs Register */}
                <View style={styles.segmentedControl}>
                  <PressableScale
                    onPress={() => {
                      setMode('signin');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    wrapperStyle={styles.segmentWrapper}
                    style={[styles.segmentBtn, !isRegister && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentBtnText, !isRegister && styles.segmentBtnTextActive]}>
                      Sign In
                    </Text>
                  </PressableScale>

                  <PressableScale
                    onPress={() => {
                      setMode('register');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    wrapperStyle={styles.segmentWrapper}
                    style={[styles.segmentBtn, isRegister && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentBtnText, isRegister && styles.segmentBtnTextActive]}>
                      Register
                    </Text>
                  </PressableScale>
                </View>

                {/* Status Banners */}
                {successMessage ? (
                  <View style={styles.successBanner}>
                    <MaterialIcons name="check-circle" size={16} color="#059669" />
                    <Text style={styles.successBannerText}>{successMessage}</Text>
                  </View>
                ) : null}

                {error ? (
                  <View style={styles.errorBanner}>
                    <MaterialIcons name="error-outline" size={16} color="#C4243A" />
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                ) : null}

                {/* Input Fields */}
                <View style={styles.fieldsContainer}>
                  {isRegister ? (
                    <>
                      {/* Full Name */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>FULL NAME</Text>
                        <View style={styles.inputContainer}>
                          <MaterialIcons name="person-outline" size={18} color="#8A8891" />
                          <TextInput
                            value={form.name}
                            onChangeText={setField('name')}
                            placeholder="Enter your full name"
                            placeholderTextColor="#A1A1AA"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      {/* Phone Number */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                        <View style={styles.inputContainer}>
                          <MaterialIcons name="call" size={17} color="#8A8891" />
                          <TextInput
                            value={form.phone}
                            onChangeText={setField('phone')}
                            placeholder="Enter 10-digit mobile number"
                            placeholderTextColor="#A1A1AA"
                            keyboardType="phone-pad"
                            style={styles.textInput}
                          />
                        </View>
                      </View>
                    </>
                  ) : null}

                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {isRegister ? 'EMAIL ADDRESS' : 'EMAIL OR MOBILE'}
                    </Text>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="mail-outline" size={18} color="#8A8891" />
                      <TextInput
                        value={form.email}
                        onChangeText={setField('email')}
                        placeholder="name@example.com"
                        placeholderTextColor="#A1A1AA"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelWithActionRow}>
                      <Text style={styles.inputLabel}>PASSWORD</Text>
                      {!isRegister ? (
                        <PressableScale onPress={handleForgotPassword}>
                          <Text style={styles.forgotPasswordText}>Forgot?</Text>
                        </PressableScale>
                      ) : null}
                    </View>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="lock-outline" size={18} color="#8A8891" />
                      <TextInput
                        value={form.password}
                        onChangeText={setField('password')}
                        placeholder={isRegister ? 'Create secure password' : 'Enter password'}
                        placeholderTextColor="#A1A1AA"
                        secureTextEntry={!showPassword}
                        style={styles.textInput}
                      />
                      <PressableScale
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeToggleBtn}
                      >
                        <MaterialIcons
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={18}
                          color="#8A8891"
                        />
                      </PressableScale>
                    </View>
                  </View>
                </View>

                {/* Primary Action Button */}
                <PressableScale
                  onPress={handleSubmit}
                  disabled={busy}
                  style={styles.primaryActionButton}
                  accessibilityRole="button"
                  accessibilityLabel={isRegister ? 'Create Atelier Account' : 'Continue to Nagpur Ateliers'}
                >
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionText}>
                        {isRegister ? 'Create Atelier Account' : 'Continue to Nagpur Ateliers'}
                      </Text>
                      <MaterialIcons name="arrow-forward" size={17} color="#FFFFFF" />
                    </>
                  )}
                </PressableScale>

                {/* Hairline Divider with "or" Capsule */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <View style={styles.dividerBadge}>
                    <Text style={styles.dividerText}>or</Text>
                  </View>
                </View>

                {/* Social Auth Options (Apple & Google) */}
                <View style={styles.socialButtonsRow}>
                  <PressableScale
                    onPress={handleAppleSignIn}
                    wrapperStyle={styles.socialWrapper}
                    style={styles.socialBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with Apple"
                  >
                    <FontAwesome name="apple" size={17} color="#131316" />
                    <Text style={styles.socialBtnText}>Apple</Text>
                  </PressableScale>

                  <PressableScale
                    onPress={handleGoogleSignIn}
                    wrapperStyle={styles.socialWrapper}
                    style={styles.socialBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with Google"
                  >
                    <FontAwesome name="google" size={15} color="#EA4335" />
                    <Text style={styles.socialBtnText}>Google</Text>
                  </PressableScale>
                </View>
              </View>

              {/* Bottom Vendor Gateway & Safety Guarantee */}
              <View style={styles.bottomSection}>
                {/* Boutique Onboarding Callout */}
                <View style={styles.vendorCalloutRow}>
                  <Text style={styles.vendorCalloutText}>Own a boutique in Nagpur?</Text>
                  <PressableScale
                    onPress={() => navigation.navigate('VendorRegister')}
                    style={styles.vendorRegisterBtn}
                    accessibilityRole="link"
                    accessibilityLabel="Register Shop as Merchant"
                  >
                    <Text style={styles.vendorRegisterBtnText}>Register Shop</Text>
                    <MaterialIcons name="arrow-forward" size={13} color="#C4243A" />
                  </PressableScale>
                </View>

                {/* Trust Indicator Capsule */}
                <View style={styles.trustCapsule}>
                  <MaterialIcons name="verified" size={14} color="#059669" />
                  <Text style={styles.trustCapsuleText}>
                    End-to-End Encrypted & Hyperlocal Verification
                  </Text>
                </View>

                {/* Home Indicator */}
                <View style={styles.homeIndicator} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    zIndex: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      },
    }),
  },
  guestPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      },
    }),
  },
  guestPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#131316',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    paddingHorizontal: 4,
    marginBottom: 16,
    marginTop: 4,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  emblemBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: 1,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crimsonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C4243A',
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C8A24A',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', 'Cinzel', Georgia, serif",
    }),
    fontSize: 32,
    fontWeight: '400',
    color: '#131316',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#5C5A63',
    marginTop: 2,
    lineHeight: 18,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 34,
    padding: 20,
    gap: 16,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(38px) saturate(190%)',
        WebkitBackdropFilter: 'blur(38px) saturate(190%)',
      },
    }),
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  segmentWrapper: {
    flex: 1,
  },
  segmentBtn: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C5A63',
  },
  segmentBtnTextActive: {
    fontWeight: '700',
    color: '#131316',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#047857',
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(196, 36, 58, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#C4243A',
    fontWeight: '600',
  },
  fieldsContainer: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  labelWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8891',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C4243A',
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
  textInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#131316',
    padding: 0,
  },
  eyeToggleBtn: {
    padding: 2,
  },
  primaryActionButton: {
    height: 46,
    borderRadius: 16,
    backgroundColor: '#C4243A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  dividerRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  dividerBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      },
    }),
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8891',
    textTransform: 'uppercase',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialWrapper: {
    flex: 1,
  },
  socialBtn: {
    width: '100%',
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  socialBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#131316',
  },
  bottomSection: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 12,
  },
  vendorCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  vendorCalloutText: {
    fontSize: 12,
    color: '#5C5A63',
  },
  vendorRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  vendorRegisterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C4243A',
  },
  trustCapsule: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
  trustCapsuleText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8A8891',
  },
  homeIndicator: {
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(19, 19, 22, 0.18)',
    alignSelf: 'center',
    marginTop: 6,
  },
});
