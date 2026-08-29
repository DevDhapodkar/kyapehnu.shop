import { StyleSheet, View } from 'react-native';

import Gradient from './Gradient';
import { colors, radii, spacing } from '../../theme/colors';
import { elevation } from '../../theme/tokens';

/**
 * Surface
 *
 * The frosted pane every card, sheet, and bar in the app is built from — the
 * successor to GlassCard, which faked glass with one flat translucent fill.
 *
 * What makes it read as glass rather than as a grey box is the stack, in order:
 *
 *   1. a gradient fill that falls off toward the bottom edge, so the pane has a
 *      light direction instead of a single flat tone;
 *   2. a hairline specular highlight along the top edge, where real glass
 *      catches the light;
 *   3. a hairline border, and a shadow sized to how far off the page the pane
 *      is meant to float.
 *
 * All three layers are absolutely positioned and non-interactive, so the card's
 * size is driven purely by its children and nothing steals a touch from them.
 *
 * Props:
 *  - tone:     'glass' (default) | 'raised' | 'chrome' | 'sunken' | 'accent'
 *  - padding:  'none' | 'compact' | 'default' | 'roomy'
 *  - radius:   key of `radii`, or a number
 *  - lift:     key of `elevation`
 *  - bordered: draw the hairline edge (default true)
 *  - accent:   colour of a rail down the leading edge, for cards that carry a
 *              triage signal ("this one is waiting on you"). Drawn by the
 *              Surface rather than by its children so it can sit outside the
 *              content padding without a negative-offset hack.
 */
const TONES = {
  /** Standard card over the page. */
  glass: { preset: 'surface', border: colors.glassBorder },
  /** A card that needs to separate from another card behind it. */
  raised: {
    colors: ['rgba(46, 46, 55, 0.9)', 'rgba(22, 22, 27, 0.95)'],
    border: colors.glassBorderStrong,
  },
  /** Headers and docked action bars sitting over content that scrolls under. */
  chrome: { preset: 'chrome', border: colors.glassBorder },
  /** An inset well — inputs, and rows nested inside another card. */
  sunken: {
    colors: ['rgba(6, 6, 8, 0.9)', 'rgba(12, 12, 15, 0.9)'],
    border: 'rgba(245, 243, 239, 0.07)',
  },
  /** Carries a call to action or a live state. */
  accent: {
    colors: ['rgba(196, 36, 58, 0.20)', 'rgba(142, 27, 41, 0.10)'],
    border: 'rgba(196, 36, 58, 0.42)',
  },
};

const PADDING = {
  none: 0,
  compact: spacing.m,
  default: spacing.md,
  roomy: spacing.lg,
};

export default function Surface({
  children,
  tone = 'glass',
  padding = 'default',
  radius = 'lg',
  lift = 'medium',
  bordered = true,
  accent,
  style,
  contentStyle,
}) {
  const skin = TONES[tone] ?? TONES.glass;
  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.lg);
  const pad = typeof padding === 'number' ? padding : (PADDING[padding] ?? PADDING.default);

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        bordered && { borderWidth: StyleSheet.hairlineWidth, borderColor: skin.border },
        elevation[lift] ?? elevation.medium,
        style,
      ]}
    >
      <Gradient fill preset={skin.preset} colors={skin.colors} />
      <View pointerEvents="none" style={styles.specular} />
      {accent ? (
        <View pointerEvents="none" style={[styles.accentRail, { backgroundColor: accent }]} />
      ) : null}

      <View style={[{ padding: pad }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    // Clips the gradient and the specular line to the rounded corners.
    overflow: 'hidden',
    backgroundColor: colors.charcoal,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
});
