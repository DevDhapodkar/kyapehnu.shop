import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import BrandLogo from '../../components/BrandLogo';
import PressableScale from '../../components/PressableScale';
import VendorBottomNav from '../../components/vendor/VendorBottomNav';
import VendorHeader from '../../components/vendor/VendorHeader';
import { colors, radii, spacing } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useVendorStore } from '../../store/useVendorStore';

/**
 * VendorProfileScreen — Dedicated Store & Boutique Settings Screen
 * Built specifically for Nagpur boutique partners:
 * - High-contrast readable information
 * - Shop details (Name, Owner, Phone, WhatsApp, Address)
 * - Live store status indicator
 * - 1-tap Nagpur Partner helpline call & WhatsApp support
 * - Clean sign out action
 * - Zero consumer shopping access
 */
export default function VendorProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isDark = useThemeStore((state) => state.isDark);

  const vendorProfile = useAuthStore((state) => state.vendorProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const resetVendorState = useVendorStore((state) => state.reset);

  const shopName = vendorProfile?.shopName || 'Nagpur Boutique';
  const ownerName = vendorProfile?.ownerName || 'Store Owner';
  const phone = vendorProfile?.phone || '+91 712 254 9900';
  const whatsapp = vendorProfile?.whatsappNumber || phone;
  const area = vendorProfile?.address?.area || 'Sitabuldi';
  const addressLine = vendorProfile?.address?.line1 || `${area}, Nagpur`;
  const isApproved = vendorProfile?.approvalStatus === 'APPROVED';

  const handleSignOut = async () => {
    const doSignOut = async () => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      resetVendorState();
      await signOut();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out of the vendor portal?')) {
        await doSignOut();
      }
      return;
    }

    Alert.alert(
      'Sign Out of Store',
      'Are you sure you want to sign out of the vendor portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doSignOut },
      ]
    );
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+917122549900').catch(() => {
      Alert.alert('Nagpur Partner Helpline', 'Call us at: +91 712 254 9900 (10 AM - 9 PM)');
    });
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL(
      `https://wa.me/917122549900?text=Hello%20Kya%20Pehnu%20Support,%20I%20am%20contacting%20from%20${encodeURIComponent(
        shopName
      )}.`
    ).catch(() => {
      Alert.alert('WhatsApp Helpline', 'WhatsApp partner assistance: +91 712 254 9900');
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#131315' : '#FAF9F5' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Standard Unified Top Header Bar */}
      <VendorHeader subtitle="Store Profile & Settings" navigation={navigation} />

      {/* 2. Main Content Scroll */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop Identity Card */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, isDark && { backgroundColor: isApproved ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.12)', borderColor: isApproved ? '#22C55E' : 'rgba(239, 68, 68, 0.3)' }]}>
              <View style={[styles.statusDot, isApproved && styles.statusDotLive]} />
              <Text style={[styles.statusPillText, isDark && { color: isApproved ? '#4ADE80' : '#F87171' }]}>
                {isApproved ? 'STORE IS LIVE' : 'ADMIN VERIFICATION IN PROGRESS'}
              </Text>
            </View>
            <Text style={styles.cityTag}>Nagpur</Text>
          </View>

          <Text style={[styles.shopNameText, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>{shopName}</Text>
          <Text style={[styles.ownerNameText, { color: isDark ? '#A8A29E' : colors.textSlate }]}>Proprietor: {ownerName}</Text>

          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />

          {/* Details list */}
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={18} color={colors.accentGoldDeep} />
            <Text style={[styles.infoLabel, { color: isDark ? '#A8A29E' : colors.textSlate }]}>Phone:</Text>
            <Text style={[styles.infoValue, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>{phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="chat" size={18} color="#25D366" />
            <Text style={[styles.infoLabel, { color: isDark ? '#A8A29E' : colors.textSlate }]}>WhatsApp:</Text>
            <Text style={[styles.infoValue, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>{whatsapp}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={18} color={colors.accentCrimson} />
            <Text style={[styles.infoLabel, { color: isDark ? '#A8A29E' : colors.textSlate }]}>Area:</Text>
            <Text style={[styles.infoValue, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>{area}, Nagpur</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="store" size={18} color={isDark ? '#A8A29E' : colors.textSlate} />
            <Text style={[styles.infoLabel, { color: isDark ? '#A8A29E' : colors.textSlate }]}>Address:</Text>
            <Text style={[styles.infoValue, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>{addressLine}</Text>
          </View>
        </View>

        {/* Support & Helpline Card */}
        <View style={[styles.supportCard, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>Nagpur Partner Helpline</Text>
          <Text style={[styles.sectionHeaderDesc, { color: isDark ? '#A8A29E' : colors.textSlate }]}>
            Need assistance? Reach out directly to the Kya Pehnu Partner Desk:
          </Text>

          <PressableScale
            onPress={handleCallSupport}
            style={[styles.supportActionBtn, { backgroundColor: isDark ? '#202024' : '#F8F9FA', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
            accessibilityRole="button"
            accessibilityLabel="Call support"
          >
            <View style={styles.supportIconWrap}>
              <MaterialIcons name="call" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={[styles.supportBtnTitle, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>Call Partner Support</Text>
              <Text style={[styles.supportBtnSubtitle, { color: isDark ? '#A8A29E' : colors.textSlate }]}>+91 712 254 9900 (10:00 AM - 9:00 PM)</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={isDark ? '#A8A29E' : colors.textAsh} />
          </PressableScale>

          <PressableScale
            onPress={handleWhatsAppSupport}
            style={[styles.supportActionBtn, { backgroundColor: isDark ? '#202024' : '#F8F9FA', borderColor: isDark ? 'rgba(37, 211, 102, 0.25)' : 'rgba(37, 211, 102, 0.3)' }]}
            accessibilityRole="button"
            accessibilityLabel="WhatsApp support"
          >
            <View style={[styles.supportIconWrap, { backgroundColor: '#25D366' }]}>
              <MaterialIcons name="chat" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={[styles.supportBtnTitle, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>Message on WhatsApp</Text>
              <Text style={[styles.supportBtnSubtitle, { color: isDark ? '#A8A29E' : colors.textSlate }]}>Instant partner assistance</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={isDark ? '#A8A29E' : colors.textAsh} />
          </PressableScale>
        </View>

        {/* Switch to Customer Mode Card */}
        <PressableScale
          onPress={() => useAuthStore.getState().setRole('CUSTOMER')}
          style={[styles.switchModeCard, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(217, 119, 6, 0.2)' }]}
          accessibilityRole="button"
          accessibilityLabel="Switch to customer storefront"
        >
          <View style={styles.switchModeIconWrap}>
            <MaterialIcons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.switchModeTextCol}>
            <Text style={[styles.switchModeTitle, { color: isDark ? '#F5F5F4' : colors.textObsidian }]}>Switch to Customer Storefront</Text>
            <Text style={[styles.switchModeSubtitle, { color: isDark ? '#A8A29E' : colors.textSlate }]}>Browse designer outfits & express delivery</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.accentGoldDeep} />
        </PressableScale>

        {/* Sign Out Card */}
        <PressableScale
          onPress={handleSignOut}
          style={[styles.signOutCard, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}
          accessibilityRole="button"
          accessibilityLabel="Sign out of store"
        >
          <MaterialIcons name="logout" size={18} color={colors.accentCrimson} />
          <Text style={styles.signOutText}>SIGN OUT OF STORE ACCOUNT</Text>
        </PressableScale>

        <View style={styles.footerWrap}>
          <BrandLogo size="sm" showEmblem={true} style={{ marginBottom: 6 }} />
          <Text style={[styles.footerStamp, { color: isDark ? '#78716C' : colors.textAsh }]}>Kya Pehnu? Nagpur Partner Portal v2.5</Text>
          <Text style={[styles.footerCorridor, { color: isDark ? '#78716C' : colors.textSlate }]}>Nagpur Citywide Fast Courier Network · All Zones Active</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <VendorBottomNav activeTab="profile" navigation={navigation} />
    </View>
  );
}

const sansFont = Platform.OS === 'web' ? 'plusJakartaSans, "Plus Jakarta Sans", sans-serif' : undefined;
const serifFont = Platform.OS === 'web' ? 'ebGaramond, "EB Garamond", Georgia, serif' : 'serif';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4EFE7',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: 512,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#15803D',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
  },
  statusDotLive: {
    backgroundColor: '#15803D',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
    letterSpacing: 0.6,
    fontFamily: sansFont,
  },
  cityTag: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentGoldDeep,
    letterSpacing: 0.2,
    fontFamily: sansFont,
  },
  shopNameText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textObsidian,
    letterSpacing: -0.3,
    lineHeight: 26,
    fontFamily: serifFont,
  },
  ownerNameText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '400',
    color: colors.textSlate,
    marginTop: 2,
    fontFamily: sansFont,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textSlate,
    width: 78,
    fontFamily: sansFont,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textObsidian,
    fontFamily: sansFont,
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textObsidian,
    letterSpacing: -0.2,
    fontFamily: serifFont,
  },
  sectionHeaderDesc: {
    fontSize: 12,
    color: colors.textSlate,
    marginBottom: 2,
    lineHeight: 18,
    fontFamily: sansFont,
  },
  supportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 12,
  },
  supportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextCol: {
    flex: 1,
  },
  supportBtnTitle: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textObsidian,
    fontFamily: sansFont,
  },
  supportBtnSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSlate,
    marginTop: 1,
    fontFamily: sansFont,
  },
  switchModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    gap: 12,
  },
  switchModeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentGoldDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchModeTextCol: {
    flex: 1,
  },
  switchModeTitle: {
    color: colors.textObsidian,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '600',
    fontFamily: sansFont,
  },
  switchModeSubtitle: {
    color: colors.textSlate,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 1,
    fontWeight: '400',
    fontFamily: sansFont,
  },
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 11,
  },
  signOutText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.accentCrimson,
    letterSpacing: 0.5,
    fontFamily: sansFont,
  },
  footerWrap: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 3,
  },
  footerStamp: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textAsh,
    fontFamily: sansFont,
  },
  footerCorridor: {
    fontSize: 10.5,
    color: colors.textSlate,
    fontFamily: sansFont,
  },
});
