import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import Icon from './ui/Icon';
import LiveDot from './ui/LiveDot';
import ProgressBar from './ui/ProgressBar';
import { colors, radii, spacing } from '../theme/colors';
import { duration, easing, stagger, type } from '../theme/tokens';
import { ORDER_TIMELINE, STEP_LABELS, stepIndex, isCancelled } from '../utils/orderStatus';

/** The glyph each fulfilment step carries. Names are Feather icons. */
const STEP_ICONS = {
  PENDING: 'edit-3',
  ACCEPTED: 'check',
  PACKED: 'package',
  READY_FOR_PICKUP: 'shopping-bag',
  IN_TRANSIT: 'navigation',
  DELIVERED: 'home',
};

/**
 * OrderTimeline
 *
 * Where an order sits in the fulfilment lifecycle.
 *
 * Two things carry the meaning. First, each step is a *glyph* in a ring rather
 * than an anonymous dot — a customer glancing at the card can tell "packed"
 * from "out for delivery" without reading. Second, the step that is live is the
 * only animated element on the card: it carries a pulse, so the eye lands on
 * the present state before it reads any of the history above it.
 *
 * `compact` collapses the whole thing to a single labelled progress rail, for
 * places where the order is one row among many.
 */
export default function OrderTimeline({ status, compact = false, style }) {
  if (isCancelled(status)) {
    return (
      <View style={[styles.cancelled, style]}>
        <Icon name="x-circle" size="sm" color={colors.crimsonGlow} />
        <Text style={styles.cancelledText}>Order cancelled</Text>
      </View>
    );
  }

  const current = stepIndex(status);
  const total = ORDER_TIMELINE.length;
  // A delivered order reads as a full rail; anything earlier is a fraction of
  // the way along. `current` can be -1 for a status the app does not know.
  const progress = current < 0 ? 0 : (current + 1) / total;

  if (compact) {
    return (
      <View style={style}>
        <View style={styles.compactRow}>
          <Icon
            name={STEP_ICONS[ORDER_TIMELINE[Math.max(current, 0)]] ?? 'clock'}
            size="sm"
            color={colors.ivory}
          />
          <Text style={styles.compactLabel}>
            {STEP_LABELS[ORDER_TIMELINE[Math.max(current, 0)]] ?? 'Placed'}
          </Text>
          <Text style={styles.compactCount}>
            {Math.max(current + 1, 1)} of {total}
          </Text>
        </View>
        <ProgressBar value={progress} height={3} style={styles.compactRail} />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {ORDER_TIMELINE.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const isLast = index === ORDER_TIMELINE.length - 1;
        const reached = done || active;

        return (
          <Animated.View
            key={step}
            entering={FadeIn.delay(stagger(index, 40))
              .duration(duration.base)
              .easing(easing.out)}
            style={styles.row}
          >
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  done && styles.nodeDone,
                  active && styles.nodeActive,
                ]}
              >
                {active ? (
                  <LiveDot size={5} color={colors.ivory} />
                ) : (
                  <Icon
                    name={done ? 'check' : (STEP_ICONS[step] ?? 'circle')}
                    size={11}
                    color={done ? colors.ivory : colors.slate}
                  />
                )}
              </View>

              {!isLast ? <View style={[styles.line, done && styles.lineDone]} /> : null}
            </View>

            <View style={styles.labelBlock}>
              <Text
                style={[
                  styles.label,
                  reached && styles.labelReached,
                  active && styles.labelActive,
                ]}
              >
                {STEP_LABELS[step]}
              </Text>
              {active ? <Text style={styles.nowTag}>NOW</Text> : null}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const NODE = 26;

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
    width: NODE,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.graphite,
    backgroundColor: colors.obsidianDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: {
    backgroundColor: colors.crimson,
    borderColor: colors.crimson,
  },
  nodeActive: {
    backgroundColor: colors.crimsonBright,
    borderColor: colors.crimsonGlow,
  },
  line: {
    width: 1.5,
    flex: 1,
    minHeight: 20,
    backgroundColor: colors.graphite,
    marginVertical: 3,
  },
  lineDone: {
    backgroundColor: colors.crimson,
  },
  labelBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginLeft: spacing.sm,
    // Optically centres the label against its node.
    marginTop: 4,
    paddingBottom: spacing.m,
  },
  label: {
    ...type.bodySmall,
    color: colors.slate,
  },
  labelReached: {
    color: colors.platinum,
  },
  labelActive: {
    color: colors.ivory,
    fontWeight: '600',
  },
  nowTag: {
    ...type.caption,
    color: colors.crimsonGlow,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    backgroundColor: colors.crimsonWash,
    overflow: 'hidden',
  },

  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  compactLabel: {
    ...type.bodySmall,
    color: colors.ivory,
    flex: 1,
  },
  compactCount: {
    ...type.caption,
    color: colors.slate,
    fontVariant: ['tabular-nums'],
  },
  compactRail: {
    marginTop: 2,
  },

  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.xs,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.crimsonWashSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196, 36, 58, 0.3)',
  },
  cancelledText: {
    ...type.bodySmall,
    color: colors.crimsonGlow,
  },
});
