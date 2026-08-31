import { StyleSheet, Text, View } from 'react-native';

import Gradient from './Gradient';
import PillButton from './PillButton';
import { colors, gradients, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * EmptyState
 *
 * One shape for every "there is nothing here yet" moment — an empty bag, a
 * quiet order queue, a catalogue with no listings. The glyph sits in a large
 * aurora-lit disc so the empty screen still looks composed rather than broken,
 * and the optional action gives the state somewhere to go.
 */
export default function EmptyState({ glyph = '◇', title, body, actionLabel, onAction, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.disc}>
        <Gradient pointerEvents="none" colors={gradients.dusk} style={styles.discFill} />
        <View pointerEvents="none" style={styles.discScrim} />
        <Text style={styles.glyph}>{glyph}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}

      {actionLabel && onAction ? (
        <PillButton label={actionLabel} onPress={onAction} icon="→" style={styles.action} />
      ) : null}
    </View>
  );
}

const DISC = 96;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  discFill: {
    ...StyleSheet.absoluteFillObject,
  },
  // The sweep is decoration, not the subject — knocking it back keeps the glyph
  // the brightest thing in the disc, while leaving the disc enough presence to
  // read against a wallpaper that is itself lit.
  discScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    opacity: 0.42,
  },
  glyph: {
    color: colors.ivory,
    fontSize: 34,
    lineHeight: 40,
  },
  title: {
    ...typography.h2,
    color: colors.ivory,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.ash,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 300,
  },
  action: {
    marginTop: spacing.md,
  },
});
