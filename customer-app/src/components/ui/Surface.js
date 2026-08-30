import { StyleSheet, View } from 'react-native';

import Gradient from './Gradient';
import { colors, gradients, radii, shadows } from '../../theme/colors';

/**
 * Surface
 *
 * The bento panel every screen is built out of. One component owns the
 * relationship between fill, border, corner radius and shadow, so a card on the
 * vendor desk and a card on the storefront are the same object.
 *
 * Tones split into two families:
 *  - **Opaque** (`surface`, `raised`, `high`) for panels on the page. Elevation
 *    reads as a lighter fill, which is why these carry no heavy border.
 *  - **Glass** (`glass`, `glassStrong`, `glassDense`) for panels over a
 *    photograph or the 3D scene, where an opaque fill would blank the image.
 *
 * `sheen` adds the hairline lit edge along the top that makes a flat panel read
 * as a physical pane. It is a gradient rather than a 1px line so it fades out
 * across the width instead of stopping dead at the corner radius.
 */
const TONE_FILLS = {
  surface: colors.surface,
  raised: colors.surfaceRaised,
  high: colors.surfaceHigh,
  glass: colors.glassFill,
  glassStrong: colors.glassFillStrong,
  glassDense: colors.glassFillDense,
  clear: colors.transparent,
};

export default function Surface({
  children,
  tone = 'surface',
  radius = radii.lg,
  elevation = 'medium',
  bordered = true,
  sheen = false,
  style,
  ...rest
}) {
  const fill = TONE_FILLS[tone] ?? TONE_FILLS.surface;
  const shadow = elevation === 'none' ? null : shadows[elevation] ?? shadows.medium;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: fill, borderRadius: radius },
        bordered && styles.bordered,
        shadow,
        style,
      ]}
      {...rest}
    >
      {sheen ? (
        <Gradient
          pointerEvents="none"
          colors={gradients.sheen}
          direction="vertical"
          steps={10}
          style={styles.sheen}
        />
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    // Corners have to clip: every child that bleeds to the edge (hero images,
    // gradients, sheens) relies on the parent's radius to shape it.
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  sheen: {
    // Only the top third catches the light; below that the panel is flat.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
  },
});
