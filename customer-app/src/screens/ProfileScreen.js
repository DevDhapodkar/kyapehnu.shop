import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  BrandMark,
  Button,
  Divider,
  Icon,
  PressableScale,
  Surface,
} from '../components/ui';
import { API_BASE_URL, getAuthToken } from '../api/vendorApi';
import { colors, radii, spacing } from '../theme/colors';
import { duration, easing, stagger, type } from '../theme/tokens';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { useVendorStore } from '../store/useVendorStore';
import { tapMedium } from '../utils/haptics';

/** Initials for the avatar, from whatever name the account actually has. */
const initialsOf = (name, email) => {
  const source = (name || email || 'G').trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'G').concat(parts[1]?.[0] ?? '').toUpperCase();
};

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
    tapMedium();
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(duration.slow).easing(easing.out)}>
        <Surface padding="default" lift="medium">
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {initialsOf(user?.displayName, user?.email)}
              </Text>
            </View>

            <View style={styles.identityBody}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.displayName ?? 'Guest'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email ?? 'Not signed in'}
              </Text>

              <View style={[styles.roleTag, isVendor && styles.roleTagVendor]}>
                <Icon
                  name={isVendor ? 'shopping-bag' : 'user'}
                  size="xs"
                  color={isVendor ? colors.gold : colors.platinum}
                />
                <Text style={[styles.roleText, isVendor && styles.roleTextVendor]}>
                  {isVendor ? 'SHOP OWNER' : 'CUSTOMER'}
                </Text>
              </View>
            </View>
          </View>
        </Surface>
      </Animated.View>

      {isLoggedIn && !isVendor ? (
        <NavRow
          index={0}
          icon="package"
          label="My orders"
          hint="Live status and delivery history"
          onPress={() => navigation.navigate('MyOrders')}
        />
      ) : null}

      {!isLoggedIn ? (
        <NavRow
          index={0}
          icon="log-in"
          label="Sign in"
          hint="See your orders and check out faster"
          onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
        />
      ) : null}

      <Animated.View
        entering={FadeInDown.delay(stagger(1)).duration(duration.slow).easing(easing.out)}
      >
        <Surface padding="default" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleIcon}>
              <Icon name="repeat" size="md" color={isVendor ? colors.gold : colors.ash} />
            </View>

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
        </Surface>
      </Animated.View>

      {isVendor && vendorProfile ? (
        <Animated.View
          entering={FadeInDown.delay(stagger(2)).duration(duration.slow).easing(easing.out)}
        >
          <Surface padding="default" style={styles.card}>
            <Text style={styles.sectionLabel}>YOUR SHOP</Text>
            <Text style={styles.name}>{vendorProfile.shopName}</Text>

            <Divider spacingY={spacing.sm} />

            <MetaRow
              icon="map-pin"
              value={
                [vendorProfile.address?.area, vendorProfile.address?.city]
                  .filter(Boolean)
                  .join(', ') || 'Address not set'
              }
            />
            <MetaRow icon="message-circle" value={vendorProfile.whatsappNumber} />
          </Surface>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.delay(stagger(3)).duration(duration.slow).easing(easing.out)}
      >
        <Surface tone="sunken" padding="default" lift="flat" style={styles.card}>
          <Text style={styles.sectionLabel}>CONNECTION</Text>
          <MetaRow icon="server" value={API_BASE_URL} />
          <MetaRow
            icon={getAuthToken() ? 'check-circle' : 'alert-circle'}
            tone={getAuthToken() ? 'jade' : 'gold'}
            value={
              getAuthToken()
                ? 'Auth token set'
                : 'No auth token — set expo.extra.devAuthToken'
            }
          />
        </Surface>
      </Animated.View>

      {isLoggedIn ? (
        <Button
          label="Sign out"
          icon="log-out"
          variant="danger"
          onPress={onSignOut}
          fullWidth
          style={styles.signOut}
        />
      ) : null}

      <View style={styles.footer}>
        <BrandMark size={24} />
        <Text style={styles.footerText}>Kya Pehnu? · Hyper-local fashion, Nagpur</Text>
      </View>
    </ScrollView>
  );
}

/** A tappable settings row: glyph, label, supporting line, chevron. */
function NavRow({ icon, label, hint, onPress, index = 0 }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(stagger(index)).duration(duration.slow).easing(easing.out)}
    >
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={styles.navRow}
      >
        <View style={styles.navIcon}>
          <Icon name={icon} size="md" color={colors.platinum} />
        </View>

        <View style={styles.navBody}>
          <Text style={styles.navLabel}>{label}</Text>
          {hint ? <Text style={styles.navHint}>{hint}</Text> : null}
        </View>

        <Icon name="chevron-right" size="md" color={colors.slate} />
      </PressableScale>
    </Animated.View>
  );
}

/** A read-only glyph + value line inside a card. */
function MetaRow({ icon, value, tone = 'neutral' }) {
  const tint = tone === 'jade' ? colors.jade : tone === 'gold' ? colors.gold : colors.slate;

  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size="sm" color={tint} />
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.charcoalLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
  },
  avatarText: {
    ...type.heading,
    fontSize: 20,
    letterSpacing: 1,
  },
  identityBody: {
    flex: 1,
  },
  name: {
    ...type.heading,
    fontWeight: '300',
  },
  email: {
    ...type.caption,
    color: colors.ash,
    marginTop: 3,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: spacing.s,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.ivoryWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  roleTagVendor: {
    backgroundColor: colors.goldWashSoft,
    borderColor: 'rgba(200, 162, 74, 0.32)',
  },
  roleText: {
    ...type.caption,
    color: colors.platinum,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  roleTextVendor: {
    color: colors.gold,
  },

  card: {
    marginTop: 0,
  },
  sectionLabel: {
    ...type.eyebrow,
    color: colors.slate,
    fontSize: 9,
    marginBottom: spacing.s,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.m,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  navIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.charcoalLight,
  },
  navBody: {
    flex: 1,
  },
  navLabel: {
    ...type.subheading,
    fontSize: 15,
    fontWeight: '400',
  },
  navHint: {
    ...type.caption,
    color: colors.slate,
    marginTop: 2,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.charcoalLight,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    ...type.subheading,
    fontSize: 15,
    fontWeight: '400',
  },
  toggleBody: {
    ...type.caption,
    color: colors.ash,
    marginTop: 4,
    lineHeight: 17,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.xs,
  },
  metaValue: {
    ...type.caption,
    color: colors.ash,
    flex: 1,
    lineHeight: 17,
  },

  signOut: {
    marginTop: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.s,
    paddingTop: spacing.md,
  },
  footerText: {
    ...type.caption,
    color: colors.slate,
    fontSize: 10,
  },
});
