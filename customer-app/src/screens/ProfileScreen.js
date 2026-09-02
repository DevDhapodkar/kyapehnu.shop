import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import GlassCard from '../components/GlassCard';
import PressableScale from '../components/PressableScale';
import { API_BASE_URL, getAuthToken } from '../api/vendorApi';
import { selection } from '../utils/haptics';
import { colors, spacing } from '../theme/colors';
import useAuthStore, { ROLES } from '../store/useAuthStore';
import useVendorStore from '../store/useVendorStore';

/**
 * Profile / Settings — reachable from both flows, and the seam between them.
 *
 * The Vendor Mode switch is a testing affordance standing in for a real
 * sign-in: in production the role comes from whether the Firebase uid resolves
 * to a Vendor document on the backend. Flipping it swaps the entire navigator,
 * so the vendor working set is cleared on the way out to avoid one shop's
 * orders surviving into the next session.
 */
export default function ProfileScreen({ navigation }) {
  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);
  const vendorProfile = useAuthStore((state) => state.vendorProfile);
  const toggleVendorMode = useAuthStore((state) => state.toggleVendorMode);
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const signOut = useAuthStore((state) => state.signOut);
  const resetVendorState = useVendorStore((state) => state.reset);

  const isVendor = role === ROLES.VENDOR;

  const onToggle = (next) => {
    // Flipping the whole app between flows is a heavy, deliberate switch — the
    // selection detent confirms it registered.
    selection();
    if (!next) resetVendorState();
    toggleVendorMode();
  };

  // Signing out clears the session token, which drops the home screen back to
  // the logged-out marketing scrollytelling.
  const onSignOut = () => {
    resetVendorState();
    signOut();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlassCard compact style={styles.card}>
        <Text style={styles.sectionLabel}>SIGNED IN AS</Text>
        <Text style={styles.name}>{user?.displayName ?? 'Guest'}</Text>
        <Text style={styles.meta}>{user?.email ?? 'Not signed in'}</Text>
        <Text style={styles.meta}>Role · {role}</Text>
      </GlassCard>

      {isLoggedIn && !isVendor ? (
        <PressableScale
          onPress={() => navigation.navigate('MyOrders')}
          haptic={false}
          accessibilityLabel="My Orders"
          style={styles.navRow}
        >
          <Text style={styles.navRowText}>My Orders</Text>
          <Text style={styles.navRowChevron}>›</Text>
        </PressableScale>
      ) : null}

      <GlassCard compact style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>Vendor Mode</Text>
            <Text style={styles.toggleBody}>
              Swaps the app over to the shop owner’s order desk. Stands in for a real vendor
              sign-in while Firebase Auth is pending.
            </Text>
          </View>

          <Switch
            value={isVendor}
            onValueChange={onToggle}
            accessibilityLabel="Vendor mode"
            trackColor={{ false: colors.graphite, true: colors.crimson }}
            thumbColor={colors.ivory}
            ios_backgroundColor={colors.graphite}
          />
        </View>
      </GlassCard>

      {isVendor && vendorProfile ? (
        <GlassCard compact style={styles.card}>
          <Text style={styles.sectionLabel}>SHOP</Text>
          <Text style={styles.name}>{vendorProfile.shopName}</Text>
          <Text style={styles.meta}>
            {[vendorProfile.address?.area, vendorProfile.address?.city]
              .filter(Boolean)
              .join(', ')}
          </Text>
          <Text style={styles.meta}>WhatsApp · {vendorProfile.whatsappNumber}</Text>
        </GlassCard>
      ) : null}

      <GlassCard compact style={styles.card}>
        <Text style={styles.sectionLabel}>BACKEND</Text>
        <Text style={styles.meta}>{API_BASE_URL}</Text>
        <Text style={styles.meta}>
          Auth token · {getAuthToken() ? 'set' : 'none (set expo.extra.devAuthToken)'}
        </Text>
      </GlassCard>

      {isLoggedIn ? (
        <PressableScale
          onPress={onSignOut}
          haptic="medium"
          accessibilityLabel="Sign out"
          style={styles.signOut}
        >
          <Text style={styles.signOutLabel}>SIGN OUT</Text>
        </PressableScale>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    marginBottom: spacing.sm,
  },
  navRowText: { color: colors.ivory, fontSize: 15 },
  navRowChevron: { color: colors.ash, fontSize: 22, marginTop: -2 },
  sectionLabel: {
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.ivory,
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  meta: {
    color: colors.ash,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    color: colors.ivory,
    fontSize: 16,
    fontWeight: '400',
  },
  toggleBody: {
    color: colors.ash,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  signOut: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
  },
  signOutLabel: {
    color: colors.crimsonBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
