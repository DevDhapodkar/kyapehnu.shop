import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme/colors';
import { type } from '../../theme/tokens';

/**
 * Divider
 *
 * A hairline rule, optionally with a centred label. The labelled variant is a
 * cheap way to break a long form or detail sheet into named regions without
 * spending a whole section header on it.
 */
export default function Divider({ label, spacingY = spacing.m, style }) {
  if (!label) {
    return <View style={[styles.rule, { marginVertical: spacingY }, style]} />;
  }

  return (
    <View style={[styles.labelled, { marginVertical: spacingY }, style]}>
      <View style={styles.flexRule} />
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={styles.flexRule} />
    </View>
  );
}

const styles = StyleSheet.create({
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
  },
  labelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flexRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
  },
  label: {
    ...type.eyebrow,
    color: colors.slate,
    fontSize: 9,
  },
});
