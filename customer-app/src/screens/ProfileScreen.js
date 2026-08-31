import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  Chip,
  GlassHeader,
  GLASS_HEADER_HEIGHT,
  Glow,
  Gradient,
  IconButton,
  PillButton,
  StatRow,
  Surface,
  TabDock,
} from '../components/ui';
import { CUSTOMER_TABS, useTabNavigation } from '../navigation/customerTabs';
import { API_BASE_URL, getAuthToken } from '../api/vendorApi';
import { selectCartCount, useCartStore } from '../store/useCartStore';
import { colors, gradients, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import useAuthStore, { ROLES } from '../store/useAuthStore';
import useVendorStore from '../store/useVendorStore';

/**
 * ProfileScreen — reachable from both flows, and the seam between them.
 *
 * Built as an identity card first: a lit banner carrying the avatar, name and
 * account state, with the figures strip beneath it, then the settings as
 * separate bento panels. The order is deliberate — who you are, then what that
 * gets you, then the switches.
 *
 * The Vendor Mode switch is a testing affordance standing in for a real
 * sign-in: in production the role comes from whether the Firebase uid resolves
 * to a Vendor document on the backend. Flipping it swaps the entire navigator,
 * so the vendor working set is cleared on the way out to avoid one shop's
 * orders surviving into the next session.
 */
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);
  const vendorProfile = useAuthStore((state) => state.vendorProfile);
  const toggleVendorMode = useAuthStore((state) => state.toggleVendorMode);
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const signOut = useAuthStore((state) => state.signOut);
  const resetVendorState = useVendorStore((state) => state.reset);
  const cartCount = useCartStore(selectCartCount);

  const isVendor = role === ROLES.VENDOR;
  const onTabChange = useTabNavigation(navigation, 'profile');

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

  // Every figure here is already in memory. The strip deliberately makes no
  // network call: a profile that has to load before it can say who you are is
  // a worse profile than one that shows three true things instantly.
  const stats = [
    { value: String(cartCount), label: 'In your bag' },
    { value: isVendor ? 'Vendor' : 'Buyer', label: 'Account' },
    { value: 'Nagpur', label: 'Delivering to' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + GLASS_HEADER_HEIGHT + spacing.md,
            paddingBottom: insets.bottom + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Surface
          tone="regular"
          radius={radii.xl}
          elevation="high"
          style={[styles.banner, styles.bannerBody]}
          backdrop={
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Gradient
                pointerEvents="none"
                colors={gradients.dusk}
                style={StyleSheet.absoluteFill}
              />
              <View pointerEvents="none" style={styles.bannerScrim} />
              <Glow color={colors.ember} size={300} intensity={0.34} style={styles.bannerGlow} />
            </View>
          }
        >
          <Avatar name={user?.displayName ?? user?.email} size={72} ring />

          <Text style={styles.name} numberOfLines={1}>
            {user?.displayName ?? 'Guest'}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email ?? 'Not signed in'}
          </Text>

          {/* Vendor mode is a state worth flagging, so it takes a tint. Being
              a customer is just the default, and a green badge for "normal"
              spends colour on nothing. */}
          {isVendor ? (
            <Chip label="Vendor mode" tint={colors.amber} size="sm" style={styles.roleChip} />
          ) : (
            <Chip label="Customer" tone="regular" size="sm" style={styles.roleChip} />
          )}
        </Surface>

        <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.statCard}>
          <StatRow items={stats} divided />
        </Surface>

        {isLoggedIn && !isVendor ? (
          <PillButton
            label="My orders"
            variant="gradient"
            size="lg"
            icon="→"
            full
            onPress={() => navigation.navigate('MyOrders')}
            style={styles.primaryAction}
          />
        ) : null}

        <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.cardTitle}>Vendor Mode</Text>
              <Text style={styles.cardBody}>
                Swaps the app over to the shop owner’s order desk. Stands in for a real vendor
                sign-in while Firebase Auth is pending.
              </Text>
            </View>

            <Switch
              value={isVendor}
              onValueChange={onToggle}
              accessibilityLabel="Vendor mode"
              trackColor={{ false: colors.surfaceHigh, true: colors.ember }}
              thumbColor={colors.ivory}
              ios_backgroundColor={colors.surfaceHigh}
            />
          </View>
        </Surface>

        {isVendor && vendorProfile ? (
          <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.card}>
            <View style={styles.shopRow}>
              <Avatar name={vendorProfile.shopName} size={44} />
              <View style={styles.shopText}>
                <Text style={styles.sectionLabel}>Your shop</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {vendorProfile.shopName}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {[vendorProfile.address?.area, vendorProfile.address?.city]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
              <IconButton
                glyph="≡"
                tone="glass"
                size={38}
                onPress={() => navigation.navigate('CatalogManager')}
                accessibilityLabel="Open catalog"
              />
            </View>

            <Text style={styles.meta}>WhatsApp · {vendorProfile.whatsappNumber}</Text>
          </Surface>
        ) : null}

        <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.card}>
          <Text style={styles.sectionLabel}>Backend</Text>
          <Text style={styles.meta}>{API_BASE_URL}</Text>
          <Text style={styles.meta}>
            Auth token · {getAuthToken() ? 'set' : 'none (set expo.extra.devAuthToken)'}
          </Text>
        </Surface>

        {isLoggedIn ? (
          <PillButton
            label="Sign out"
            variant="ghost"
            full
            onPress={onSignOut}
            style={styles.signOut}
          />
        ) : (
          <PillButton
            label="Sign in"
            icon="→"
            full
            onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
            style={styles.signOut}
          />
        )}
      </ScrollView>

      <GlassHeader title="Profile" onBack={() => navigation.goBack()} />

      {!isVendor ? (
        <TabDock items={CUSTOMER_TABS} value="profile" onChange={onTabChange} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
  },

  banner: {
    marginBottom: spacing.sm,
  },
  bannerBody: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  /**
   * The sweep is the light source, not the subject.
   *
   * This has to be `ink` — an earlier pass that made every screen container
   * transparent so the wallpaper could show through caught this scrim too, and
   * a transparent scrim knocks nothing back: the banner rendered as a solid
   * block of violet rather than a lit pane.
   */
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    opacity: 0.78,
  },
  bannerGlow: {
    position: 'absolute',
    top: -150,
    right: -110,
  },
  name: {
    ...typography.h1,
    color: colors.ivory,
    marginTop: spacing.sm + 2,
  },
  email: {
    ...typography.body,
    color: colors.platinum,
    marginTop: 3,
  },
  roleChip: {
    marginTop: spacing.sm,
  },

  statCard: {
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  primaryAction: {
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.ash,
    marginBottom: 5,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.ivory,
  },
  cardBody: {
    ...typography.caption,
    color: colors.ash,
    marginTop: 5,
  },
  meta: {
    ...typography.caption,
    color: colors.ash,
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
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shopText: {
    flex: 1,
    minWidth: 0,
  },
  signOut: {
    marginTop: spacing.xs,
  },
});
