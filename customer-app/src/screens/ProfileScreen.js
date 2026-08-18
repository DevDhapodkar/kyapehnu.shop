import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import GlassCard from '../components/GlassCard';
import { API_BASE_URL, getAuthToken } from '../api/vendorApi';
import { colors, spacing } from '../theme/colors';
import useAuthStore, { ROLES } from '../store/useAuthStore';
import useVendorStore from '../store/useVendorStore';

/**
 * Profile / Settings — reachable from both flows, and the seam between them.
 *
 * The signed-in identity is the real Firebase account; role comes from the
 * account's Firestore profile. The Vendor Mode switch is a local testing
 * override that lets one account preview the shop-owner desk without a second
 * login — the authoritative role still comes from the profile on next launch.
 * Flipping it swaps the entire navigator, so the vendor working set is cleared
 * on the way out to avoid one shop's orders surviving into the next session.
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
        {user?.phone ? <Text style={styles.meta}>{user.phone}</Text> : null}
        <Text style={styles.meta}>Role · {role}</Text>
      </GlassCard>

      <GlassCard compact style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>Vendor Mode</Text>
            <Text style={styles.toggleBody}>
              Swaps the app over to the shop owner’s order desk. A local preview toggle —
              your real role comes from your account profile.
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

      {isLoggedIn && !isVendor ? (
        <Pressable
          onPress={() => navigation.navigate('VendorApplication')}
          accessibilityRole="button"
          accessibilityLabel="Apply to become a vendor"
          style={({ pressed }) => [pressed && styles.applyPressed]}
        >
          <GlassCard compact style={styles.card}>
            <Text style={styles.sectionLabel}>FOR SHOP OWNERS</Text>
            <Text style={styles.name}>Sell on Kya Pehnu?</Text>
            <Text style={styles.meta}>
              Run a clothing shop in Nagpur? Apply to become a vendor and start taking
              orders from buyers nearby.
            </Text>
            <Text style={styles.applyCta}>Apply to become a vendor →</Text>
          </GlassCard>
        </Pressable>
      ) : null}

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
          Auth token · {getAuthToken() ? 'set (Firebase ID token)' : 'none'}
        </Text>
      </GlassCard>

      {isLoggedIn ? (
        <Pressable
          onPress={onSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        >
          <Text style={styles.signOutLabel}>SIGN OUT</Text>
        </Pressable>
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
  applyPressed: {
    opacity: 0.75,
  },
  applyCta: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: spacing.sm,
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
  signOutPressed: {
    opacity: 0.7,
  },
  signOutLabel: {
    color: colors.crimsonBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
