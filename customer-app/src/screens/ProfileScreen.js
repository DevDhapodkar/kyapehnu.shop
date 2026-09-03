import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import PressableScale from '../components/PressableScale';
import useAuthStore, { ROLES } from '../store/useAuthStore';
import useVendorStore from '../store/useVendorStore';
import { colors, radii, spacing } from '../theme/colors';

/**
 * ProfileScreen — Profile & Concierge (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen a42b188e2b8b48ed8c17bb5b2d9b487e:
 * - Animated drifting ambient background blobs
 * - Frosted glass client portal header
 * - Ivory Concierge tier badge & Ananya Sharma profile card
 * - Action tiles: Orders (2 Active), Addresses (Civil Lines), Wishlist (6 Pieces)
 * - Boutique & Atelier Partner Mode switch
 * - Concierge hotline (+91 712 254 9900) & WhatsApp stylist links
 * - Sign Out action with haptic confirmation
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);
  const toggleVendorMode = useAuthStore((state) => state.toggleVendorMode);
  const signOut = useAuthStore((state) => state.signOut);
  const resetVendorState = useVendorStore((state) => state.reset);

  const isVendor = role === ROLES.VENDOR;

  const handleToggleVendor = (next) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    if (!next) resetVendorState();
    toggleVendorMode();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your Sitabuldi account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            resetVendorState();
            signOut();
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  const handleStylistChat = () => {
    Linking.openURL(
      'https://wa.me/917122549900?text=Hi%20Kya%20Pehnu%20Concierge,%20I%20need%20styling%20assistance%20for%20an%20upcoming%20event.'
    ).catch(() => {
      Alert.alert('Concierge', 'Stylist chat available on WhatsApp (+91 712 254 9900).');
    });
  };

  const handleCallHotline = () => {
    Linking.openURL('tel:+917122549900').catch(() => {
      Alert.alert('Nagpur Care Hotline', 'Call +91 712 254 9900 (10 AM - 10 PM).');
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Top Header */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarInner} pointerEvents="auto">
          <PressableScale
            onPress={() => navigation.goBack()}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={17}
              color={colors.textObsidian}
            />
          </PressableScale>

          <View style={styles.locationPill}>
            <MaterialIcons name="near-me" size={13} color={colors.accentGold} />
            <Text style={styles.locationText}>Sitabuldi, Nagpur</Text>
            <MaterialIcons
              name="expand-more"
              size={15}
              color={colors.textAsh}
            />
          </View>

          <View style={{ width: 34 }} />
        </View>
      </View>

      {/* 3. Main Scrollable Content */}
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
      >
        {/* Screen Header */}
        <View style={styles.titleSection}>
          <Text style={styles.eyebrow}>
            Client Portal & Concierge · Nagpur Central
          </Text>
          <Text style={styles.title}>Profile & Concierge</Text>
          <Text style={styles.subtitle}>
            Personal couture account & doorstep fittings
          </Text>
        </View>

        {/* Member Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.tierRow}>
            <View style={styles.tierBadge}>
              <MaterialIcons
                name="workspace-premium"
                size={14}
                color={colors.accentGoldDeep}
              />
              <Text style={styles.tierText}>Ivory Concierge</Text>
            </View>
            <MaterialIcons
              name="verified"
              size={18}
              color={colors.accentGold}
            />
          </View>

          <Text style={styles.userName}>
            {user?.displayName || 'Ananya Sharma'}
          </Text>

          <View style={styles.userMetaRow}>
            <View style={styles.userMetaItem}>
              <MaterialIcons
                name="location-on"
                size={13}
                color={colors.accentGold}
              />
              <Text style={styles.userMetaText}>Sitabuldi, Nagpur</Text>
            </View>
            <Text style={styles.userMetaDivider}>•</Text>
            <Text style={styles.userMetaText}>Size S (Custom Tailor)</Text>
          </View>

          {/* 3 Action Tiles */}
          <View style={styles.tilesRow}>
            {/* Orders Tile */}
            <PressableScale
              onPress={() => navigation.navigate('MyOrders')}
              style={styles.tileBtn}
              accessibilityRole="button"
              accessibilityLabel="View orders"
            >
              <MaterialIcons
                name="inventory-2"
                size={20}
                color={colors.accentCrimson}
              />
              <Text style={styles.tileLabel}>Orders</Text>
              <Text style={styles.tileValue}>2 Active</Text>
            </PressableScale>

            {/* Addresses Tile */}
            <PressableScale
              onPress={() => navigation.navigate('Address')}
              style={styles.tileBtn}
              accessibilityRole="button"
              accessibilityLabel="View addresses"
            >
              <MaterialIcons
                name="pin-drop"
                size={20}
                color={colors.accentGold}
              />
              <Text style={styles.tileLabel}>Addresses</Text>
              <Text style={styles.tileValue}>Civil Lines</Text>
            </PressableScale>

            {/* Wishlist Tile */}
            <PressableScale
              onPress={() =>
                Alert.alert(
                  'Wishlist',
                  '6 curated pieces saved from Studio Anamika & Maheshwari Handlooms.'
                )
              }
              style={styles.tileBtn}
              accessibilityRole="button"
              accessibilityLabel="View wishlist"
            >
              <MaterialIcons
                name="favorite"
                size={20}
                color={colors.accentCrimson}
              />
              <Text style={styles.tileLabel}>Wishlist</Text>
              <Text style={styles.tileValue}>6 Pieces</Text>
            </PressableScale>
          </View>
        </View>

        {/* Boutique & Atelier Partner Mode */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerIconWrap}>
            <MaterialIcons
              name="storefront"
              size={22}
              color={colors.accentGold}
            />
          </View>

          <View style={styles.partnerInfoCol}>
            <View style={styles.partnerTitleRow}>
              <Text style={styles.partnerTitle}>Boutique & Atelier Mode</Text>
              <View style={styles.partnerBadge}>
                <Text style={styles.partnerBadgeText}>PARTNER</Text>
              </View>
            </View>
            <Text style={styles.partnerSubtitle}>
              Switch to artisan inventory & rapid dispatch pickups
            </Text>
          </View>

          <Switch
            value={isVendor}
            onValueChange={handleToggleVendor}
            trackColor={{
              false: 'rgba(0,0,0,0.1)',
              true: colors.accentCrimson,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Concierge & Preferences Section */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Concierge & Preferences</Text>

          {/* Doorstep Try & Buy */}
          <View style={styles.prefRow}>
            <View style={styles.prefIconWrap}>
              <MaterialIcons
                name="timer"
                size={18}
                color={colors.accentGold}
              />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>Doorstep Try & Buy (15m)</Text>
              <Text style={styles.prefSubtitle}>
                Rider waits while you inspect & drape
              </Text>
            </View>
            <View style={styles.statusActiveRow}>
              <Text style={styles.statusActiveText}>Enabled</Text>
              <MaterialIcons
                name="check-circle"
                size={15}
                color={colors.accentGold}
              />
            </View>
          </View>

          {/* Express 45-Min Corridor */}
          <View style={styles.prefRow}>
            <View style={styles.prefIconWrap}>
              <MaterialIcons
                name="bolt"
                size={18}
                color={colors.accentGold}
              />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>Express 45-Min Corridor</Text>
              <Text style={styles.prefSubtitle}>
                Sitabuldi · Dharampeth · Civil Lines
              </Text>
            </View>
            <Text style={styles.statusActiveText}>Active</Text>
          </View>

          {/* WhatsApp Stylist */}
          <PressableScale
            onPress={handleStylistChat}
            style={styles.actionRow}
            accessibilityRole="button"
            accessibilityLabel="Contact stylist on WhatsApp"
          >
            <View style={styles.prefIconWrap}>
              <MaterialIcons
                name="forum"
                size={18}
                color={colors.accentCrimson}
              />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>Nagpur Stylist Concierge</Text>
              <Text style={styles.prefSubtitle}>Instant response on WhatsApp</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.textAsh}
            />
          </PressableScale>

          {/* Care Hotline */}
          <PressableScale
            onPress={handleCallHotline}
            style={styles.actionRow}
            accessibilityRole="button"
            accessibilityLabel="Call care hotline"
          >
            <View style={styles.prefIconWrap}>
              <MaterialIcons
                name="support-agent"
                size={18}
                color={colors.accentGold}
              />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>Nagpur Care Hotline</Text>
              <Text style={styles.prefSubtitle}>+91 712 254 9900 (10 AM - 10 PM)</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.textAsh}
            />
          </PressableScale>
        </View>

        {/* Sign Out Button */}
        <PressableScale
          onPress={handleSignOut}
          style={styles.signOutBtn}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <MaterialIcons name="logout" size={17} color={colors.accentCrimson} />
          <Text style={styles.signOutText}>
            Sign Out of Sitabuldi Account
          </Text>
        </PressableScale>

        {/* Footer Edition Stamp */}
        <View style={styles.footerSection}>
          <Text style={styles.footerEdition}>
            Kya Pehnu? v2.5 · Nagpur Atelier Edition
          </Text>
          <Text style={styles.footerLocalities}>
            Sitabuldi · Dharampeth · Gandhibagh · Sadar
          </Text>
        </View>
      </ScrollView>
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
  topBarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  locationText: {
    color: colors.textObsidian,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  titleSection: {
    paddingHorizontal: 4,
    marginTop: spacing.xs,
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
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
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
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  tierText: {
    color: colors.accentGoldDeep,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userName: {
    color: colors.textObsidian,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  userMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  userMetaText: {
    color: colors.textAsh,
    fontSize: 11.5,
  },
  userMetaDivider: {
    color: colors.textAsh,
    fontSize: 10,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: spacing.sm,
  },
  tileBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  tileLabel: {
    color: colors.textSlate,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  tileValue: {
    color: colors.textObsidian,
    fontSize: 11.5,
    fontWeight: '700',
  },
  partnerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  partnerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInfoCol: {
    flex: 1,
  },
  partnerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partnerTitle: {
    color: colors.textObsidian,
    fontSize: 13.5,
    fontWeight: '700',
  },
  partnerBadge: {
    backgroundColor: 'rgba(18, 18, 20, 0.06)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 9999,
  },
  partnerBadgeText: {
    color: colors.textSlate,
    fontSize: 8.5,
    fontWeight: '700',
  },
  partnerSubtitle: {
    color: colors.textSlate,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    gap: spacing.sm + 2,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(210%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%)',
      },
    }),
  },
  sectionTitle: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  prefIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTextCol: {
    flex: 1,
  },
  prefTitle: {
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '600',
  },
  prefSubtitle: {
    color: colors.textAsh,
    fontSize: 11,
    marginTop: 1,
  },
  statusActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusActiveText: {
    color: colors.accentGoldDeep,
    fontSize: 11,
    fontWeight: '700',
  },
  signOutBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderRadius: radii.md,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  signOutText: {
    color: colors.accentCrimson,
    fontSize: 12.5,
    fontWeight: '700',
  },
  footerSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 2,
  },
  footerEdition: {
    color: colors.textAsh,
    fontSize: 11,
    fontWeight: '600',
  },
  footerLocalities: {
    color: colors.textSlate,
    fontSize: 10,
  },
});
