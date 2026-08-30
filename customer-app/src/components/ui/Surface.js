import { StyleSheet, View } from 'react-native';

import GlassPanel from './GlassPanel';
import { colors, CONTINUOUS, radii, shadows } from '../../theme/colors';

/**
 * Surface
 *
 * The card every screen is built out of. It is glass by default — `Surface`
 * delegates to `GlassPanel`, so a card blurs and refracts the aurora behind it
 * rather than sitting on the page as a grey rectangle.
 *
 * What `Surface` adds on top of the material is the part that is about *layout*
 * rather than optics: the corner radius, the drop shadow that separates a pane
 * from the page, and the choice of how much the pane obscures.
 *
 * Tones follow Apple's material vocabulary:
 *  - `thin`     — a pane sitting inside another pane, or a quiet control.
 *  - `regular`  — the default card.
 *  - `thick`    — a pane carrying primary type: docked bars, sheets, the dock.
 *  - `overImage`— dark glass, for a pane laid over a photograph. A white veil
 *    on a bright garment washes the picture out.
 *  - `solid`    — opaque. The escape hatch for the few places a second layer of
 *    translucency turns to mush: image wells and input backgrounds.
 *
 * `backdrop` is decoration painted inside the pane, behind the content and
 * outside its padding — a card that carries its own light rather than only
 * refracting the wallpaper.
 */
export default function Surface({
  children,
  backdrop,
  tone = 'regular',
  radius = radii.lg,
  elevation = 'medium',
  bordered = true,
  specular = true,
  style,
  ...rest
}) {
  const shadow = elevation === 'none' ? null : shadows[elevation] ?? shadows.medium;

  if (tone === 'solid') {
    return (
      <View
        style={[
          styles.solid,
          { borderRadius: radius },
          CONTINUOUS,
          bordered && styles.bordered,
          shadow,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <GlassPanel
      tone={tone}
      backdrop={backdrop}
      radius={radius}
      bordered={bordered}
      specular={specular}
      // The shadow rides on the panel itself: a shadow on a wrapper around a
      // clipping view would be clipped away with everything else.
      style={[shadow, style]}
      {...rest}
    >
      {children}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  solid: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
});
