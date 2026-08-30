import { Pressable, StyleSheet, Text, View } from 'react-native';

import GlassPanel from './GlassPanel';
import { colors, CONTINUOUS, radii, shadows } from '../../theme/colors';

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
 *
 * `glass` is a real frosted disc — these buttons float directly over
 * photography and over the aurora, which is exactly where a blur earns its
 * cost. It takes the *thick* white material and a bright rim: the catalogue's
 * photography runs very dark, and a thinner material there leaves nothing but a
 * faint ring floating in the image. A disc you can only find by its badge is
 * not a control.
 *
 * `light`, `dark` and `clear` are flat by design — a white disc is meant to be
 * the most solid thing on the screen, not another pane.
 */
const TONE_STYLES = {
  glass: { glyph: colors.ivory },
  light: { backgroundColor: colors.light, glyph: colors.onLight },
  dark: { backgroundColor: colors.inkDeep, glyph: colors.ivory },
  clear: { backgroundColor: colors.transparent, glyph: colors.platinum },
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
  const isGlass = tone === 'glass';

  const face = (
    <Text
      style={[
        styles.glyph,
        { color: palette.glyph, fontSize: glyphSize ?? Math.round(size * 0.4) },
      ]}
    >
      {glyph}
    </Text>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2 },
        CONTINUOUS,
        tone !== 'clear' && shadows.low,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {isGlass ? (
        <GlassPanel
          tone="thick"
          radius={size / 2}
          borderColor={colors.glassBorderStrong}
          // A specular edge on a 40pt disc reads as a smudge, not as light.
          specular={false}
          style={[styles.fill, styles.base]}
        >
          {face}
        </GlassPanel>
      ) : (
        <View
          style={[
            styles.base,
            styles.fill,
            { borderRadius: size / 2, backgroundColor: palette.backgroundColor },
          ]}
        >
          {face}
        </View>
      )}

      {/* Outside the disc, not inside it: the pane clips to its own radius, so
          a badge rendered within it loses the half that overhangs. */}
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
  fill: {
    ...StyleSheet.absoluteFillObject,
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
