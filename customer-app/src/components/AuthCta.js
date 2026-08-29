import { StyleSheet, Text, View } from 'react-native';

import Button from './ui/Button';
import Icon from './ui/Icon';
import PressableScale from './ui/PressableScale';
import { colors, radii, spacing } from '../theme/colors';
import { type } from '../theme/tokens';

/**
 * AuthCta
 *
 * The closing frame of the logged-out scrollytelling. The drone shot arrives on
 * the dress behind this panel, and the panel is the pay-off: the single place
 * the marketing funnel converts a browsing visitor into a signed-in customer.
 *
 * There is no card behind the copy — the film is the background — so every run
 * of text carries its own dark halo. That is what keeps the panel legible over
 * whatever the last frame happens to be, without dropping a grey box over the
 * shot it spent four beats setting up.
 *
 * Props:
 *  - onJoin:  called when the visitor commits (Join Now / Sign up)
 *  - onLogin: called when a returning customer taps Log in
 */
const PROOF = [
  { icon: 'map-pin', label: 'Shops near you' },
  { icon: 'clock', label: 'Under an hour' },
  { icon: 'credit-card', label: 'Cash on delivery' },
];

export default function AuthCta({ onJoin, onLogin }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>YOUR CITY IS OPEN</Text>
      <Text style={styles.title}>Join now. Wear it tonight.</Text>
      <Text style={styles.body}>
        Create an account to see what is in stock two streets away and have it at
        your door within the hour.
      </Text>

      {/* The three promises, restated as glyphs — the last thing read before
          the tap, and short enough to be taken in at a glance. */}
      <View style={styles.proofRow}>
        {PROOF.map((item) => (
          <View key={item.label} style={styles.proof}>
            <Icon name={item.icon} size="sm" color={colors.goldBright} />
            <Text style={styles.proofLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Button
        label="Join now"
        icon="arrow-right"
        onPress={onJoin}
        size="lg"
        fullWidth
        accessibilityLabel="Join now"
      />

      <View style={styles.secondaryRow}>
        <Text style={styles.secondaryText}>Already have an account?</Text>
        <PressableScale
          onPress={onLogin}
          haptic="selection"
          scaleTo={0.94}
          accessibilityRole="button"
          accessibilityLabel="Log in"
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLink}>Log in</Text>
        </PressableScale>
      </View>
    </View>
  );
}

/** Dark halo settings shared by every run of copy sitting on the film. */
const halo = {
  textShadowColor: colors.obsidian,
  textShadowOffset: { width: 0, height: 0 },
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  eyebrow: {
    ...type.eyebrow,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: spacing.sm,
    ...halo,
    textShadowRadius: 6,
  },
  title: {
    ...type.display,
    fontSize: 34,
    lineHeight: 40,
    marginBottom: spacing.sm,
    ...halo,
    textShadowRadius: 10,
  },
  body: {
    ...type.body,
    marginBottom: spacing.m,
    ...halo,
    textShadowRadius: 8,
  },
  proofRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.md,
  },
  proof: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.scrimStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  proofLabel: {
    ...type.caption,
    color: colors.platinum,
    fontSize: 10,
    textAlign: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.m,
  },
  secondaryText: {
    ...type.bodySmall,
    ...halo,
    textShadowRadius: 6,
  },
  secondaryButton: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xxs,
  },
  secondaryLink: {
    ...type.bodySmall,
    color: colors.ivory,
    fontWeight: '600',
    textDecorationLine: 'underline',
    ...halo,
    textShadowRadius: 6,
  },
});
