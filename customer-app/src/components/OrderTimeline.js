import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme/colors';
import { ORDER_TIMELINE, STEP_LABELS, stepIndex, isCancelled } from '../utils/orderStatus';

/**
 * Vertical progress timeline for an order. Completed steps are filled crimson,
 * the current step glows, upcoming steps are muted. A cancelled order collapses
 * to a single cancelled row.
 */
export default function OrderTimeline({ status }) {
  if (isCancelled(status)) {
    return (
      <View style={styles.cancelledRow}>
        <View style={[styles.dot, styles.dotCancelled]} />
        <Text style={styles.cancelledText}>Order cancelled</Text>
      </View>
    );
  }

  const current = stepIndex(status);

  return (
    <View style={styles.wrap}>
      {ORDER_TIMELINE.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const isLast = index === ORDER_TIMELINE.length - 1;

        return (
          <View key={step} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              />
              {!isLast ? <View style={[styles.line, done && styles.lineDone]} /> : null}
            </View>
            <Text
              style={[
                styles.label,
                (done || active) && styles.labelReached,
                active && styles.labelActive,
              ]}
            >
              {STEP_LABELS[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 12;

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  rail: { alignItems: 'center', width: DOT + 6 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1.5,
    borderColor: colors.graphite,
    backgroundColor: colors.obsidianDeep,
  },
  dotDone: { backgroundColor: colors.crimson, borderColor: colors.crimson },
  dotActive: { backgroundColor: colors.crimsonBright, borderColor: colors.crimsonBright },
  dotCancelled: { backgroundColor: colors.crimson, borderColor: colors.crimson },
  line: { width: 1.5, flex: 1, minHeight: 22, backgroundColor: colors.graphite, marginVertical: 2 },
  lineDone: { backgroundColor: colors.crimson },
  label: {
    color: colors.slate,
    fontSize: 13,
    marginLeft: spacing.sm,
    paddingBottom: spacing.sm,
    marginTop: -2,
  },
  labelReached: { color: colors.platinum },
  labelActive: { color: colors.ivory, fontWeight: '600' },
  cancelledRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  cancelledText: { color: colors.crimsonBright, fontSize: 13, marginLeft: spacing.sm },
});
