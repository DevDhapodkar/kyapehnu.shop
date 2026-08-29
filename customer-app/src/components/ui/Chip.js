import { StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../../theme/colors';
import { type } from '../../theme/tokens';

/**
 * Chip
 *
 * One primitive for every small labelled token in the app: filter tabs, size
 * swatches, category pills, and read-only metadata tags.
 *
 * Selection is signalled by *fill weight*, not by hue — an ivory-bordered,
 * lifted chip reads as chosen while crimson stays reserved for actions. A chip
 * with no `onPress` renders as a plain View, so a metadata tag is not
 * announced to a screen reader as something tappable.
 *
 * Props:
 *  - tone: 'neutral' | 'gold' | 'crimson' | 'jade' — the read-only tint
 */
const TONES = {
  neutral: { fill: colors.glassFill, border: colors.glassBorder, text: colors.platinum },
  gold: { fill: colors.goldWash, border: 'rgba(200, 162, 74, 0.4)', text: colors.gold },
  crimson: { fill: colors.crimsonWash, border: 'rgba(196, 36, 58, 0.4)', text: colors.crimsonGlow },
  jade: { fill: colors.jadeWash, border: 'rgba(78, 140, 106, 0.4)', text: colors.jade },
};

export default function Chip({
  label,
  icon,
  count,
  selected = false,
  tone = 'neutral',
  onPress,
  size = 'md',
  uppercase = true,
  style,
  accessibilityLabel,
}) {
  const skin = TONES[tone] ?? TONES.neutral;
  const compact = size === 'sm';

  const body = (
    <>
      {icon ? (
        <Icon
          name={icon}
          size={compact ? 'xs' : 'sm'}
          color={selected ? colors.ivory : skin.text}
        />
      ) : null}

      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: selected ? colors.ivory : skin.text },
          selected && styles.labelSelected,
        ]}
        numberOfLines={1}
      >
        {uppercase ? String(label).toUpperCase() : label}
      </Text>

      {count ? (
        <View style={[styles.count, selected && styles.countSelected]}>
          <Text style={[styles.countText, selected && styles.countTextSelected]}>{count}</Text>
        </View>
      ) : null}
    </>
  );

  const containerStyle = [
    styles.chip,
    compact && styles.chipCompact,
    { backgroundColor: skin.fill, borderColor: skin.border },
    selected && styles.chipSelected,
    style,
  ];

  if (!onPress) {
    return <View style={containerStyle}>{body}</View>;
  }

  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? String(label)}
      style={containerStyle}
    >
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipCompact: {
    paddingHorizontal: spacing.s + 2,
    paddingVertical: 5,
    gap: spacing.xxs,
  },
  chipSelected: {
    backgroundColor: colors.ivoryWash,
    borderColor: colors.glassBorderStrong,
  },
  label: {
    ...type.label,
    fontSize: 11,
    letterSpacing: 1.3,
  },
  labelCompact: {
    fontSize: 10,
    letterSpacing: 1,
  },
  labelSelected: {
    fontWeight: '700',
  },
  count: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.graphite,
    alignItems: 'center',
  },
  countSelected: {
    backgroundColor: colors.crimson,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.platinum,
    fontVariant: ['tabular-nums'],
  },
  countTextSelected: {
    color: colors.ivory,
  },
});
