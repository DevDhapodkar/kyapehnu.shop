import { Pressable, StyleSheet, Text, View } from 'react-native';

import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../theme/colors';

/**
 * AuthCta
 *
 * The closing frame of the logged-out scrollytelling. The drone shot arrives on
 * the dress behind this panel, and the panel is the pay-off: the single place
 * the marketing funnel converts a browsing visitor into a signed-in customer.
 *
 * Three affordances, one intent — get an account. "Join Now" is the primary
 * (sign up), with a quieter "Log in" for returning customers. All routes land
 * on the same handler for now; a real Firebase flow will split sign-up from
 * sign-in behind `onJoin` / `onLogin`.
 *
 * Props:
 *  - onJoin:  called when the visitor commits (Join Now / Sign up)
 *  - onLogin: called when a returning customer taps Log in
 */
export default function AuthCta({ onJoin, onLogin }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>YOUR CITY IS OPEN</Text>
      <Text style={styles.title}>Join now. Wear it tonight.</Text>
      <Text style={styles.body}>
        Create an account to see what is in stock two streets away and have it at
        your door within the hour.
      </Text>

      <PressableScale
        onPress={onJoin}
        haptic="medium"
        accessibilityLabel="Join now"
        style={styles.primary}
      >
        <Text style={styles.primaryLabel}>JOIN NOW</Text>
      </PressableScale>

      <View style={styles.secondaryRow}>
        <Text style={styles.secondaryText}>Already have an account?</Text>
        <Pressable
          onPress={onLogin}
          accessibilityRole="button"
          accessibilityLabel="Log in"
          hitSlop={spacing.xs}
        >
          <Text style={styles.secondaryLink}>Log in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: spacing.sm,
    // No card behind the copy any more — a soft dark halo keeps it legible where
    // the drone shot settles bright behind it.
    textShadowColor: colors.obsidian,
    textShadowRadius: 6,
  },
  title: {
    color: colors.ivory,
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textShadowColor: colors.obsidian,
    textShadowRadius: 8,
  },
  body: {
    color: colors.platinum,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.lg,
    textShadowColor: colors.obsidian,
    textShadowRadius: 6,
  },
  primary: {
    backgroundColor: colors.crimsonBright,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  primaryLabel: {
    color: colors.ivory,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  secondaryText: {
    color: colors.ash,
    fontSize: 13,
  },
  secondaryLink: {
    color: colors.ivory,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
