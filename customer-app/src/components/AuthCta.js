import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, PillButton } from './ui';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

/**
 * AuthCta
 *
 * The closing frame of the logged-out scrollytelling. The drone shot arrives on
 * the dress behind this panel, and the panel is the pay-off: the single place
 * the marketing funnel converts a browsing visitor into a signed-in customer.
 *
 * This is the one screen in the app that earns the aurora gradient. It is the
 * conversion moment, and the accent is rationed precisely so that landing on it
 * after four monochrome story beats reads as an arrival.
 *
 * The copy sits directly on the film with no card behind it — a panel here
 * would put a wall between the shot and the pitch — so every run of type
 * carries its own dark halo to stay legible wherever the frame settles bright.
 *
 * Props:
 *  - onJoin:  called when the visitor commits (Join Now / Sign up)
 *  - onLogin: called when a returning customer taps Log in
 */
export default function AuthCta({ onJoin, onLogin }) {
  return (
    <View style={styles.card}>
      <Chip label="Your city is open" tone="regular" style={styles.chip} />

      <Text style={styles.title}>Join now.{'\n'}Wear it tonight.</Text>

      <Text style={styles.body}>
        Create an account to see what is in stock two streets away and have it at
        your door within the hour.
      </Text>

      <PillButton
        label="Join now"
        variant="gradient"
        size="lg"
        icon="→"
        onPress={onJoin}
        full
        style={styles.primary}
      />

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
  chip: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    fontSize: 36,
    lineHeight: 42,
    color: colors.ivory,
    marginBottom: spacing.sm,
    // No card behind the copy — a soft dark halo keeps it legible where the
    // drone shot settles bright behind it.
    textShadowColor: colors.ink,
    textShadowRadius: 10,
  },
  body: {
    ...typography.bodyLg,
    color: colors.platinum,
    marginBottom: spacing.lg,
    textShadowColor: colors.ink,
    textShadowRadius: 8,
  },
  primary: {
    alignSelf: 'stretch',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  secondaryText: {
    ...typography.body,
    color: colors.platinum,
    textShadowColor: colors.ink,
    textShadowRadius: 6,
  },
  secondaryLink: {
    ...typography.body,
    fontWeight: '700',
    color: colors.ivory,
    textDecorationLine: 'underline',
  },
});
