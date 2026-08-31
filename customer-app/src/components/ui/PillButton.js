import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import GlassPanel from './GlassPanel';
import Gradient from './Gradient';
import { colors, CONTINUOUS, gradients, radii, shadows, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * PillButton
 *
 * The single call-to-action primitive. Fully round, and — in its default
 * `light` variant — a near-white pill carrying ink type, which is the loudest
 * an element can be on a near-black page without spending colour on it.
 *
 * Variant hierarchy, strongest first. Only one of the top two belongs on a
 * screen at a time:
 *  - `gradient` — the aurora sweep. Reserved for the moment of conversion:
 *    placing an order, creating an account. One per screen, at most.
 *  - `light`    — the everyday primary. White pill, ink label.
 *  - `dark`     — primary *on* a light surface or a bright photograph.
 *  - `glass`    — secondary; a frosted pane that keeps the image behind it.
 *  - `ghost`    — tertiary; a hairline outline over the faintest veil. Not
 *    fully transparent: over a lit wallpaper a pure outline button loses its
 *    own label against the brighter lobes.
 *
 * `icon` renders inside a circular chip at the trailing edge, the way the
 * "View video ▶" and "Add to Cart +" affordances read in the reference: the
 * glyph gets its own disc rather than floating loose beside the label.
 */
const SIZES = {
  sm: { paddingVertical: 9, paddingHorizontal: 16, fontSize: 12, chip: 22 },
  md: { paddingVertical: 13, paddingHorizontal: 22, fontSize: 14, chip: 28 },
  lg: { paddingVertical: 17, paddingHorizontal: 26, fontSize: 15, chip: 32 },
};

export default function PillButton({
  label,
  onPress,
  variant = 'light',
  size = 'md',
  icon,
  caption,
  loading = false,
  disabled = false,
  full = false,
  accessibilityLabel,
  style,
}) {
  const metrics = SIZES[size] ?? SIZES.md;
  const inert = disabled || loading;

  const isGradient = variant === 'gradient';
  const onLight = variant === 'light';

  const labelColor = onLight ? colors.onLight : colors.ivory;
  const captionColor = onLight ? colors.onLightMuted : colors.platinum;
  // The icon chip inverts against the pill it sits on, so it stays a disc
  // rather than dissolving into the fill.
  const chipBackground = onLight ? colors.onLight : colors.light;
  const chipGlyphColor = onLight ? colors.light : colors.onLight;

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          paddingVertical: metrics.paddingVertical,
          paddingHorizontal: metrics.paddingHorizontal,
        },
        VARIANT_STYLES[variant] ?? VARIANT_STYLES.light,
        full && styles.full,
        inert && styles.inert,
        pressed && !inert && styles.pressed,
        style,
      ]}
    >
      {isGradient ? (
        <Gradient pointerEvents="none" colors={gradients.aurora} style={styles.fill} />
      ) : null}

      {variant === 'glass' ? (
        <GlassPanel
          pointerEvents="none"
          tone="regular"
          radius={radii.pill}
          specular={false}
          style={styles.fill}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <View style={styles.row}>
          <View style={styles.labelBlock}>
            <Text
              numberOfLines={1}
              style={[typography.button, { fontSize: metrics.fontSize, color: labelColor }]}
            >
              {label}
            </Text>
            {caption ? (
              <Text numberOfLines={1} style={[styles.caption, { color: captionColor }]}>
                {caption}
              </Text>
            ) : null}
          </View>

          {icon ? (
            <View
              style={[
                styles.chip,
                {
                  width: metrics.chip,
                  height: metrics.chip,
                  borderRadius: metrics.chip / 2,
                  backgroundColor: chipBackground,
                },
              ]}
            >
              <Text style={[styles.chipGlyph, { color: chipGlyphColor }]}>{icon}</Text>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const VARIANT_STYLES = StyleSheet.create({
  light: {
    backgroundColor: colors.light,
    ...shadows.low,
  },
  gradient: {
    backgroundColor: colors.iris,
    ...shadows.medium,
  },
  dark: {
    backgroundColor: colors.inkDeep,
    ...shadows.low,
  },
  glass: {
    backgroundColor: colors.transparent,
  },
  ghost: {
    backgroundColor: colors.glassThin,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
  },
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...CONTINUOUS,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  full: {
    alignSelf: 'stretch',
  },
  inert: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  labelBlock: {
    alignItems: 'center',
  },
  caption: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGlyph: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '700',
  },
});
