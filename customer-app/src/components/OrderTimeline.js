import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, statusColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ORDER_TIMELINE, STEP_LABELS, stepIndex, isCancelled } from '../utils/orderStatus';

/**
 * OrderTimeline
 *
 * Vertical progress rail for one order. Completed steps are filled and joined
 * by a lit connector; the current step carries a halo ring so the eye lands on
 * "where is it right now" before reading any label. A cancelled order collapses
 * to a single row — there is no progress left to show.
 *
 * Each dot takes the tint its own status carries in `statusColors`, so the rail
 * reads as the same temperature ramp the status pill uses rather than inventing
 * a second colour language for the same lifecycle.
 */
export default function OrderTimeline({ status }) {
  if (isCancelled(status)) {
    return (
      <View style={styles.cancelledRow}>
        <View style={[styles.dot, { backgroundColor: colors.rose, borderColor: colors.rose }]} />
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
        const tint = statusColors[step] ?? colors.ash;

        return (
          <View key={step} style={styles.row}>
            <View style={styles.rail}>
              {/* The halo is a sibling rather than a border so it can extend
                  past the dot without changing its size mid-rail. */}
              {active ? <View style={[styles.halo, { backgroundColor: tint }]} /> : null}

              <View
                style={[
                  styles.dot,
                  (done || active) && { backgroundColor: tint, borderColor: tint },
                ]}
              />

              {!isLast ? (
                <View style={[styles.line, done && { backgroundColor: tint }]} />
              ) : null}
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

const DOT = 11;
const HALO = 21;

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rail: {
    alignItems: 'center',
    width: HALO,
  },
  halo: {
    position: 'absolute',
    top: (DOT - HALO) / 2,
    width: HALO,
    height: HALO,
    borderRadius: radii.pill,
    opacity: 0.22,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.surfaceHigh,
    backgroundColor: colors.inkDeep,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 22,
    borderRadius: 1,
    backgroundColor: colors.surfaceHigh,
    marginVertical: 3,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    color: colors.slate,
    marginLeft: spacing.sm,
    paddingBottom: spacing.sm,
    marginTop: -2,
  },
  labelReached: {
    color: colors.platinum,
  },
  labelActive: {
    color: colors.ivory,
    fontWeight: '700',
  },
  cancelledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  cancelledText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.rose,
    marginLeft: spacing.sm,
  },
});
