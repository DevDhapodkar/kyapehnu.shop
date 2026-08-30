import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows } from '../../theme/colors';

/**
 * IconButton
 *
 * The circular glyph button that punctuates the whole interface: back arrows on
 * a hero, the ↗ in a card's corner, ♡ on a product, + on a stepper. It is
 * always a perfect disc — the radius is derived from the size rather than
 * passed in, so no call site can accidentally ship a rounded square.
 *
 * `badge` renders the small count disc used by the bag button. It is offset
 * outside the circle, so the parent must not clip it.
 */
const TONE_STYLES = {
  glass: { backgroundColor: colors.glassFillStrong, glyph: colors.ivory, bordered: true },
  surface: { backgroundColor: colors.surfaceRaised, glyph: colors.ivory, bordered: true },
  light: { backgroundColor: colors.light, glyph: colors.onLight, bordered: false },
  dark: { backgroundColor: colors.inkDeep, glyph: colors.ivory, bordered: false },
  clear: { backgroundColor: colors.transparent, glyph: colors.platinum, bordered: false },
};

export default function IconButton({
  glyph,
  onPress,
  tone = 'glass',
  size = 44,
  glyphSize,
  badge,
  disabled = false,
  accessibilityLabel,
  style,
}) {
  const palette = TONE_STYLES[tone] ?? TONE_STYLES.glass;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.backgroundColor,
        },
        palette.bordered && styles.bordered,
        tone !== 'clear' && shadows.low,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.glyph,
          { color: palette.glyph, fontSize: glyphSize ?? Math.round(size * 0.4) },
        ]}
      >
        {glyph}
      </Text>

      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },
  glyph: {
    fontWeight: '500',
    // Centring a glyph by its own line box is more reliable across platforms
    // than relying on the container's justifyContent alone.
    textAlign: 'center',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  badgeText: {
    color: colors.ivory,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },
});
