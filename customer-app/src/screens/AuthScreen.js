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
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { useStorefrontStore } from '../store/useStorefrontStore';
import { friendlyAuthError } from '../services/auth';
import { useTheme } from '../theme/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Google SVG Logo component for web and native
 */
function GoogleIcon({ size = 16 }) {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
        <path
          d="M12 5c1.54 0 2.92.56 4.01 1.48l3.01-3.01C17.2 1.8 14.78 1 12 1 7.4 1 3.52 3.61 1.63 7.41l3.66 2.84C6.18 7.37 8.84 5 12 5z"
          fill="#EA4335"
        />
        <path
          d="M23.49 12.28c0-.82-.07-1.6-.2-2.28H12v4.51h6.47c-.28 1.48-1.12 2.73-2.38 3.58l3.66 2.84c2.14-1.97 3.74-4.88 3.74-8.65z"
          fill="#4285F4"
        />
        <path
          d="M5.29 14.75c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.63 7.41C.59 9.5.01 11.69.01 12c0 2.31.59 4.5 1.62 6.59l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 23c3.24 0 5.95-1.07 7.93-2.91l-3.66-2.84c-1.07.72-2.45 1.16-4.27 1.16-3.16 0-5.82-2.37-6.71-5.25L1.63 16.59C3.52 20.39 7.4 23 12 23z"
          fill="#34A853"
        />
      </svg>
    );
  }
  return <FontAwesome name="google" size={size} color="#EA4335" />;
}

/**
 * AuthScreen — Sign In & Auth (Final Light Theme Suite Parity)
 *
 * Matches Stitch Screen 0788955a6a00495c9f9e68995af36204:
 * - Top Navigation & Brand Crest: Circle back button, Kya Pehnu brand emblem + Garamond title, help button
 * - Editorial Header: Nagpur Couture Passport pill with pulsing crimson dot, Garamond headline, instant Nagpur deliveries subtitle
 * - Main Atelier Card Container:
 *   - Full Name input with person icon
 *   - Mobile Number input with 🇮🇳 +91 prefix badge, Instant OTP gold pill, and verified shield
 *   - Email Address input with mail icon
 *   - Password input with visibility eye toggle and Forgot? action
 *   - 45-min trials delivery notice across Sitabuldi & Dharampeth
 *   - Full-width pill action button: "Create Account / Sign In" with forward arrow
 *   - Checkbox: "Keep me signed in for 45-minute instant checkout"
 *   - Divider: "OR CONTINUE WITH"
 *   - Full-width Google OAuth button with official multicolor G logo
 * - Boutique Merchant Onboarding banner with storefront icon and Register button
 * - Trust & Security Footnote: 256-bit encryption and Nagpur Same-City Express Network
 */
export default function AuthScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();

  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const registerWithEmail = useAuthStore((state) => state.registerWithEmail);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);

  const [form, setForm] = useState({
    name: '',
    phone: '98230 45892',
    email: '',
    password: '',
  });
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const setField = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    const email = form.email.trim();
    const password = form.password;
    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!email) {
      return setError('Please enter your email address.');
    }
    if (!password) {
      return setError('Please enter your password.');
    }

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

    setBusy(true);
    try {
      if (name) {
        // If name is present, user is creating an account or registering
        await registerWithEmail({
          name,
          phone: phone || '98230 45892',
          email,
          password,
        });
      } else {
        // Direct email & password sign in
        await signInWithEmail({
          email,
          password,
        });
      }

      const currentRole = useAuthStore.getState().role;
      if (currentRole === ROLES.VENDOR) {
        return;
      }
      try {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home');
        }
      } catch {
        try {
          navigation.navigate('Home');
        } catch {}
      }
    } catch (err) {
      if (!name && (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential')) {
        setError('No account found for this email. Please enter your Full Name to create your account.');
      } else {
        setError(friendlyAuthError(err));
      }
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
        const currentRole = useAuthStore.getState().role;
        if (currentRole === ROLES.VENDOR) {
          return;
        }
        try {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Home');
          }
        } catch {
          try {
            navigation.navigate('Home');
          } catch {}
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
    <View style={[styles.root, { backgroundColor: themeColors.groundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Ambient Drifting Glowing Orbs */}
      <AmbientBackgroundBlobs />

      <View style={styles.outerContainer}>
        <View style={styles.frameContainer}>
          {/* 2. Top Navigation Bar */}
          <View
            style={[
              styles.topBar,
              { paddingTop: Math.max(insets.top + 8, 16) },
            ]}
          >
            {/* Back Circular Button */}
            <PressableScale
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
              style={[
                styles.backCircleBtn,
                {
                  backgroundColor: isDark ? 'rgba(28, 27, 29, 0.9)' : '#F4F4F0',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="arrow-back" size={20} color={themeColors.textPrimary} />
            </PressableScale>

            {/* Center Brand Crest */}
            <View style={styles.topCenterBrand}>
              <Image
                source={require('../../assets/images/brand-emblem.png')}
                style={styles.topCenterLogo}
                resizeMode="cover"
              />
              <View style={styles.topCenterBrandTextCol}>
                <Text style={[styles.topCenterBrandTitle, { color: isDark ? '#FFB3B3' : '#A00025' }]}>
                  Kya
                </Text>
                <Text style={[styles.topCenterBrandSubtitle, { color: isDark ? '#FFB3B3' : '#A00025' }]}>
                  Pehnu?
                </Text>
              </View>
            </View>

            {/* Right Help / Guest Trigger Button */}
            <PressableScale
              onPress={handleExploreAsGuest}
              style={[
                styles.helpCircleBtn,
                {
                  backgroundColor: isDark ? 'rgba(28, 27, 29, 0.9)' : '#F4F4F0',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Help & Guest Explore"
            >
              <MaterialIcons name="help-outline" size={20} color={themeColors.textAsh} />
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
              {/* Editorial Header Section */}
              <View style={styles.headerSection}>
                <View
                  style={[
                    styles.eyebrowContainer,
                    {
                      backgroundColor: isDark ? 'rgba(200, 162, 74, 0.12)' : '#EFEEEA',
                    },
                  ]}
                >
                  <View style={[styles.crimsonDot, { backgroundColor: themeColors.accentCrimson }]} />
                  <Text style={[styles.eyebrowText, { color: isDark ? '#EAC166' : '#B38A2B' }]}>
                    NAGPUR COUTURE PASSPORT
                  </Text>
                </View>

                <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
                  Welcome to{' '}
                  <Text
                    style={[
                      styles.headerTitleBrand,
                      { color: isDark ? '#FFB3B3' : '#A00025' },
                    ]}
                  >
                    Kya Pehnu?
                  </Text>
                </Text>
                <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
                  Enter your mobile number to access real-time trials, bespoke measurements, and instant Nagpur deliveries.
                </Text>
              </View>

              {/* Main White Porcelain Card */}
              <View
                style={[
                  styles.porcelainCard,
                  {
                    backgroundColor: isDark ? '#18181C' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E3DC',
                  },
                ]}
              >
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

                {/* Input Fields Stack */}
                <View style={styles.fieldsContainer}>
                  {/* Full Name */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                      Full Name
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDark ? '#1F1F24' : '#F4F3EE',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                        },
                      ]}
                    >
                      <TextInput
                        value={form.name}
                        onChangeText={setField('name')}
                        placeholder="e.g. Radhika Deshmukh"
                        placeholderTextColor={themeColors.textAsh}
                        style={[styles.textInput, { color: themeColors.textPrimary }]}
                      />
                      <MaterialIcons name="person-outline" size={18} color={themeColors.textAsh} />
                    </View>
                  </View>

                  {/* Mobile Number */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelWithBadgeRow}>
                      <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                        Mobile Number
                      </Text>
                      <View style={styles.instantOtpBadge}>
                        <MaterialIcons name="verified" size={13} color={isDark ? '#EAC166' : '#946C18'} />
                        <Text style={[styles.instantOtpText, { color: isDark ? '#EAC166' : '#946C18' }]}>
                          Instant OTP
                        </Text>
                      </View>
                    </View>
                    <View style={styles.phoneInputRow}>
                      {/* Country code prefix */}
                      <View
                        style={[
                          styles.countryCodeBox,
                          {
                            backgroundColor: isDark ? '#1F1F24' : '#F4F3EE',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                          },
                        ]}
                      >
                        <Text style={styles.flagEmoji}>🇮🇳</Text>
                        <Text style={[styles.countryCodeText, { color: themeColors.textPrimary }]}>
                          +91
                        </Text>
                        <MaterialIcons name="arrow-drop-down" size={16} color={themeColors.textAsh} />
                      </View>

                      {/* Phone text input */}
                      <View
                        style={[
                          styles.phoneInputContainer,
                          {
                            backgroundColor: isDark ? '#1F1F24' : '#F4F3EE',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                          },
                        ]}
                      >
                        <TextInput
                          value={form.phone}
                          onChangeText={setField('phone')}
                          placeholder="98230 45892"
                          placeholderTextColor={themeColors.textAsh}
                          keyboardType="phone-pad"
                          style={[styles.phoneTextInput, { color: themeColors.textPrimary }]}
                        />
                        <MaterialIcons name="verified-user" size={18} color={isDark ? '#EAC166' : '#B38A2B'} />
                      </View>
                    </View>
                  </View>

                  {/* Email Address */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                      Email Address
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDark ? '#1F1F24' : '#F4F3EE',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                        },
                      ]}
                    >
                      <TextInput
                        value={form.email}
                        onChangeText={setField('email')}
                        placeholder="name@example.com"
                        placeholderTextColor={themeColors.textAsh}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={[styles.textInput, { color: themeColors.textPrimary }]}
                      />
                      <MaterialIcons name="mail-outline" size={18} color={themeColors.textAsh} />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelWithBadgeRow}>
                      <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                        Password
                      </Text>
                      <PressableScale onPress={handleForgotPassword}>
                        <Text style={[styles.forgotPasswordText, { color: themeColors.accentCrimson }]}>
                          Forgot?
                        </Text>
                      </PressableScale>
                    </View>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDark ? '#1F1F24' : '#F4F3EE',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                        },
                      ]}
                    >
                      <TextInput
                        value={form.password}
                        onChangeText={setField('password')}
                        placeholder="Enter your password"
                        placeholderTextColor={themeColors.textAsh}
                        secureTextEntry={!showPassword}
                        style={[styles.textInput, { color: themeColors.textPrimary }]}
                      />
                      <PressableScale
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeToggleBtn}
                        accessibilityLabel="Toggle password visibility"
                      >
                        <MaterialIcons
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={18}
                          color={themeColors.textAsh}
                        />
                      </PressableScale>
                    </View>
                  </View>

                  {/* Speed / 45-Min Trial Delivery Badge */}
                  <View
                    style={[
                      styles.trialNoticeBox,
                      {
                        backgroundColor: isDark ? '#1C1C20' : '#F4F4F0',
                      },
                    ]}
                  >
                    <MaterialIcons name="bolt" size={18} color={themeColors.accentCrimson} />
                    <Text style={[styles.trialNoticeText, { color: themeColors.textSecondary }]}>
                      Enabled for{' '}
                      <Text style={[styles.trialNoticeTextBold, { color: themeColors.textPrimary }]}>
                        45-min trials
                      </Text>{' '}
                      across Sitabuldi & Dharampeth.
                    </Text>
                  </View>

                  {/* Primary Action Button */}
                  <PressableScale
                    onPress={handleSubmit}
                    disabled={busy}
                    style={[styles.primaryActionButton, { backgroundColor: '#C4243A' }]}
                    accessibilityRole="button"
                    accessibilityLabel="Create Account / Sign In"
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryActionText}>Create Account / Sign In</Text>
                        <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                      </>
                    )}
                  </PressableScale>
                </View>

                {/* Keep Signed In Checkbox */}
                <PressableScale
                  onPress={() => setKeepSignedIn(!keepSignedIn)}
                  style={styles.keepSignedInRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: keepSignedIn }}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        borderColor: keepSignedIn ? '#C4243A' : (isDark ? '#76746E' : '#B0AEB7'),
                        backgroundColor: keepSignedIn ? '#C4243A' : 'transparent',
                      },
                    ]}
                  >
                    {keepSignedIn ? <MaterialIcons name="check" size={13} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={[styles.keepSignedInText, { color: themeColors.textSecondary }]}>
                    Keep me signed in for 45-minute instant checkout
                  </Text>
                </PressableScale>

                {/* Subtle Or Divider */}
                <View style={styles.dividerRow}>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9E8E4' },
                    ]}
                  />
                  <View style={styles.dividerBadge}>
                    <Text style={[styles.dividerText, { color: themeColors.textAsh }]}>
                      OR CONTINUE{'\n'}WITH
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9E8E4' },
                    ]}
                  />
                </View>

                {/* Fast OAuth Google Button */}
                <PressableScale
                  onPress={handleGoogleSignIn}
                  style={[
                    styles.googleOAuthButton,
                    {
                      backgroundColor: isDark ? '#1F1F24' : '#F4F3EE',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  <GoogleIcon size={16} />
                  <Text style={[styles.googleOAuthText, { color: themeColors.textPrimary }]}>
                    Continue with Google
                  </Text>
                </PressableScale>
              </View>

              {/* Bottom Vendor Gateway & Safety Guarantee */}
              <View style={styles.bottomSection}>
                {/* Boutique Merchant Onboarding Banner */}
                <View
                  style={[
                    styles.vendorCalloutBanner,
                    {
                      backgroundColor: isDark ? '#1C1C20' : '#E9E8E4',
                    },
                  ]}
                >
                  <View style={styles.vendorCalloutLeft}>
                    <View
                      style={[
                        styles.vendorIconBadge,
                        {
                          backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : 'rgba(179, 138, 43, 0.18)',
                        },
                      ]}
                    >
                      <MaterialIcons name="storefront" size={20} color={isDark ? '#EAC166' : '#946C18'} />
                    </View>
                    <View style={styles.vendorTextColumn}>
                      <Text
                        numberOfLines={1}
                        style={[styles.vendorBannerTitle, { color: themeColors.textPrimary }]}
                      >
                        Own a Boutique in Nagpur?
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.vendorBannerSub, { color: themeColors.textSecondary }]}
                      >
                        Join Sitabuldi & Dharampeth network
                      </Text>
                    </View>
                  </View>
                  <PressableScale
                    onPress={() => navigation.navigate('VendorRegister')}
                    style={[
                      styles.vendorBannerBtn,
                      {
                        backgroundColor: isDark ? '#18181C' : '#FFFFFF',
                      },
                    ]}
                    accessibilityRole="link"
                    accessibilityLabel="Register Shop as Merchant"
                  >
                    <Text style={[styles.vendorBannerBtnText, { color: isDark ? '#EAC166' : '#946C18' }]}>
                      Register
                    </Text>
                    <MaterialIcons name="arrow-forward" size={13} color={isDark ? '#EAC166' : '#946C18'} />
                  </PressableScale>
                </View>

                {/* Trust & Security Footnote */}
                <View style={styles.footerSecurityBlock}>
                  <View style={styles.securityRow}>
                    <MaterialIcons name="lock" size={13} color={isDark ? '#EAC166' : '#B38A2B'} />
                    <Text style={[styles.securityText, { color: themeColors.textAsh }]}>
                      Protected by 256-bit encryption
                    </Text>
                  </View>
                  <Text style={[styles.networkFootnote, { color: themeColors.textAsh }]}>
                    NAGPUR SAME-CITY EXPRESS NETWORK
                  </Text>
                </View>
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
    paddingBottom: 8,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topCenterBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topCenterLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  topCenterBrandTextCol: {
    justifyContent: 'center',
  },
  topCenterBrandTitle: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  topCenterBrandSubtitle: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  helpCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexGrow: 1,
  },
  headerSection: {
    paddingHorizontal: 4,
    marginBottom: 18,
    paddingTop: 4,
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 10,
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
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: -0.4,
    lineHeight: 38,
  },
  headerTitleBrand: {
    fontStyle: 'italic',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
  },
  headerSubtitle: {
    fontSize: 13.5,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 360,
  },
  porcelainCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    gap: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
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
    borderRadius: 12,
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
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  instantOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instantOtpText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  forgotPasswordText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  inputContainer: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeBox: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  flagEmoji: {
    fontSize: 15,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  phoneInputContainer: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  eyeToggleBtn: {
    padding: 4,
  },
  trialNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 2,
  },
  trialNoticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  trialNoticeTextBold: {
    fontWeight: '700',
  },
  primaryActionButton: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 2,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  keepSignedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepSignedInText: {
    fontSize: 12,
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerBadge: {
    paddingHorizontal: 4,
  },
  dividerText: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    textAlign: 'center',
    lineHeight: 12,
  },
  googleOAuthButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  googleOAuthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSection: {
    marginTop: 20,
    gap: 16,
  },
  vendorCalloutBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  vendorCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  vendorIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vendorTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  vendorBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  vendorBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  vendorBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    flexShrink: 0,
  },
  vendorBannerBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  footerSecurityBlock: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  networkFootnote: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
