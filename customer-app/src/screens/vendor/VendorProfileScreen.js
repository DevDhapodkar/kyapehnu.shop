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

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import PressableScale from '../../components/PressableScale';
import VendorBottomNav from '../../components/vendor/VendorBottomNav';
import { colors, radii, spacing } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useVendorStore } from '../../store/useVendorStore';

/**
 * VendorProfileScreen — Dedicated Dukan & Shopkeeper Settings Screen
 * Built specifically for Nagpur shopkeeper uncles (50-60 yrs old):
 * - Large, high-contrast readable information
 * - Shop details (Name, Owner, Phone, WhatsApp, Address)
 * - Live dukan status indicator
 * - 1-tap Nagpur Partner helpline call & WhatsApp support
 * - Clean sign out action
 * - Zero consumer shopping access
 */
export default function VendorProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const vendorProfile = useAuthStore((state) => state.vendorProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const resetVendorState = useVendorStore((state) => state.reset);

  const shopName = vendorProfile?.shopName || 'Nagpur Boutique';
  const ownerName = vendorProfile?.ownerName || 'Dukan Malik';
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
      if (typeof window !== 'undefined' && window.confirm('Kya aap dukan portal se sign out karna chahte hain?')) {
        await doSignOut();
      }
      return;
    }

    Alert.alert(
      'Dukan Se Logout',
      'Kya aap dukan portal se sign out karna chahte hain?',
      [
        { text: 'Nahi (Cancel)', style: 'cancel' },
        { text: 'Haan, Logout Karein', style: 'destructive', onPress: doSignOut },
      ]
    );
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+917122549900').catch(() => {
      Alert.alert('Nagpur Support Helpline', 'Call karein: +91 712 254 9900 (10 AM - 9 PM)');
    });
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL(
      `https://wa.me/917122549900?text=Namaste%20Kya%20Pehnu%20Support,%20main%20${encodeURIComponent(
        shopName
      )}%20se%20baat%20kar%20raha%20hoon.`
    ).catch(() => {
      Alert.alert('WhatsApp Helpline', 'WhatsApp par helpline uplabdh hai: +91 712 254 9900');
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Top Header Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <View style={styles.topBarInner}>
          <Text style={styles.topBarTitle}>👤 Dukan Profile & Settings</Text>
          <View style={styles.topBarBadge}>
            <Text style={styles.topBarBadgeText}>VENDOR MODE</Text>
          </View>
        </View>
      </View>

      {/* 3. Main Content Scroll */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop Identity Card */}
        <View style={styles.profileCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, isApproved && styles.statusDotLive]} />
              <Text style={styles.statusPillText}>
                {isApproved ? '✓ DUKAAN LIVE HAI' : '⏳ ADMIN VERIFICATION IN PROGRESS'}
              </Text>
            </View>
            <Text style={styles.cityTag}>Nagpur</Text>
          </View>

          <Text style={styles.shopNameText}>{shopName}</Text>
          <Text style={styles.ownerNameText}>Malik: {ownerName}</Text>

          <View style={styles.divider} />

          {/* Details list */}
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color={colors.accentGoldDeep} />
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="chat" size={20} color="#25D366" />
            <Text style={styles.infoLabel}>WhatsApp:</Text>
            <Text style={styles.infoValue}>{whatsapp}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={colors.accentCrimson} />
            <Text style={styles.infoLabel}>Area:</Text>
            <Text style={styles.infoValue}>{area}, Nagpur</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="store" size={20} color={colors.textSlate} />
            <Text style={styles.infoLabel}>Pata (Address):</Text>
            <Text style={styles.infoValue}>{addressLine}</Text>
          </View>
        </View>

        {/* Support & Helpline Card */}
        <View style={styles.supportCard}>
          <Text style={styles.sectionHeaderTitle}>Nagpur Partner Helpline</Text>
          <Text style={styles.sectionHeaderDesc}>
            Koi bhi dikkat ho toh seedha Kya Pehnu Nagpur team se baat karein:
          </Text>

          <PressableScale
            onPress={handleCallSupport}
            style={styles.supportActionBtn}
            accessibilityRole="button"
            accessibilityLabel="Call support"
          >
            <View style={styles.supportIconWrap}>
              <MaterialIcons name="call" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={styles.supportBtnTitle}>Phone Par Baat Karein</Text>
              <Text style={styles.supportBtnSubtitle}>+91 712 254 9900 (Subah 10 baje - Raat 9 baje)</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textAsh} />
          </PressableScale>

          <PressableScale
            onPress={handleWhatsAppSupport}
            style={[styles.supportActionBtn, { borderColor: 'rgba(37, 211, 102, 0.3)' }]}
            accessibilityRole="button"
            accessibilityLabel="WhatsApp support"
          >
            <View style={[styles.supportIconWrap, { backgroundColor: '#25D366' }]}>
              <MaterialIcons name="chat" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={styles.supportBtnTitle}>WhatsApp Par Msg Karein</Text>
              <Text style={styles.supportBtnSubtitle}>Turant reply payein</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textAsh} />
          </PressableScale>
        </View>

        {/* Sign Out Card */}
        <PressableScale
          onPress={handleSignOut}
          style={styles.signOutCard}
          accessibilityRole="button"
          accessibilityLabel="Dukan se logout karein"
        >
          <MaterialIcons name="logout" size={22} color={colors.accentCrimson} />
          <Text style={styles.signOutText}>DUKAAN SE LOGOUT KAREIN (SIGN OUT)</Text>
        </PressableScale>

        <View style={styles.footerWrap}>
          <Text style={styles.footerStamp}>Kya Pehnu? Nagpur Partner Portal v2.5</Text>
          <Text style={styles.footerCorridor}>Sitabuldi · Dharampeth · Itwari · Gandhibagh · Sadar</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <VendorBottomNav activeTab="profile" navigation={navigation} />
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  topBarBadge: {
    backgroundColor: colors.accentCrimson,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  topBarBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.22)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#15803D',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentCrimson,
  },
  statusDotLive: {
    backgroundColor: '#15803D',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  cityTag: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accentGoldDeep,
  },
  shopNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textObsidian,
    letterSpacing: -0.3,
  },
  ownerNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSlate,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSlate,
    width: 90,
  },
  infoValue: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  sectionHeaderDesc: {
    fontSize: 13,
    color: colors.textSlate,
    marginBottom: 4,
  },
  supportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  supportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextCol: {
    flex: 1,
  },
  supportBtnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  supportBtnSubtitle: {
    fontSize: 12,
    color: colors.textSlate,
    marginTop: 2,
  },
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: radii.lg,
    paddingVertical: 16,
    marginTop: spacing.xs,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.accentCrimson,
    letterSpacing: 0.3,
  },
  footerWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 3,
  },
  footerStamp: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textAsh,
  },
  footerCorridor: {
    fontSize: 11,
    color: colors.textSlate,
  },
});
