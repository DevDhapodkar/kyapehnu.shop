import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * Chip
 *
 * A small static or selectable pill: a product's category, a distance, a size,
 * an order's review state. Not a button primitive — anything that navigates or
 * commits belongs in `PillButton`; a chip either labels something or toggles a
 * local selection.
 *
 * `tint` paints a coloured chip at low alpha with the tint at full strength on
 * the border and label, so a status chip reads as tinted glass rather than a
 * solid badge shouting over the card it sits on.
 */
const TONES = {
  glass: { background: colors.glassFillStrong, label: colors.platinum, border: colors.glassBorder },
  surface: { background: colors.surfaceRaised, label: colors.platinum, border: colors.glassBorder },
  light: { background: colors.light, label: colors.onLight, border: colors.transparent },
  dark: { background: colors.inkDeep, label: colors.ivory, border: colors.glassBorder },
};

export default function Chip({
  label,
  tone = 'glass',
  tint,
  size = 'md',
  icon,
  onPress,
  selected = false,
  style,
}) {
  const palette = TONES[tone] ?? TONES.glass;
  const small = size === 'sm';

  const body = (
    <>
      {tint ? <View pointerEvents="none" style={[styles.tintFill, { backgroundColor: tint }]} /> : null}
      {icon ? <Text style={[styles.icon, { color: tint ?? palette.label }]}>{icon}</Text> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          small && styles.labelSm,
          { color: tint ?? palette.label },
          selected && styles.labelSelected,
        ]}
      >
        {label}
      </Text>
    </>
  );

  const containerStyle = [
    styles.chip,
    small && styles.chipSm,
    {
      backgroundColor: tint ? colors.transparent : palette.background,
      borderColor: tint ?? palette.border,
    },
    style,
  ];

  if (!onPress) {
    return <View style={containerStyle}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  chipSm: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tintFill: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 11,
    lineHeight: 14,
  },
  label: {
    ...typography.micro,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  labelSm: {
    fontSize: 9,
    letterSpacing: 1.2,
  },
  labelSelected: {
    fontWeight: '700',
  },
});
