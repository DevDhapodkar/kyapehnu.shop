import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View } from 'react-native';

import Gradient from './Gradient';
import { useBlurTarget } from './BlurTarget';
import { colors, CONTINUOUS, gradients, radii } from '../../theme/colors';

/**
 * GlassPanel
 *
 * A real pane of frosted glass: it blurs what is behind it, tints that blur,
 * and catches a lit edge along its top. Every card, sheet, header, dock and
 * action bar in the app is one of these.
 *
 * Three implementations, best first:
 *
 *  1. **Liquid Glass** (iOS 26+). `GlassView` hands the pane to the system,
 *     which lends it the same material the OS uses — real-time refraction,
 *     specular highlights, and the shimmer under motion. Nothing drawn in JS
 *     matches it, so where it exists it wins and this component adds no fill or
 *     border of its own.
 *  2. **Backdrop blur** (everything else). `BlurView` gives a true backdrop
 *     blur on iOS < 26, on Android via Dimezis, and on web via CSS
 *     `backdrop-filter`. A white veil and a specular top edge are drawn over
 *     it, which is what turns a blur into a *material*.
 *  3. Where a blur cannot be had at all, the veil and edge still render over a
 *     slightly heavier fill, so the pane reads as translucent rather than
 *     vanishing.
 *
 * The tone names follow Apple's material vocabulary — thin, regular, thick —
 * and mean the same thing: how much the pane obscures what is behind it.
 *
 * `backdrop` renders inside the pane, behind its children — for a card that
 * carries its own light, like the profile banner.
 *
 * Children are direct children of the pane, not wrapped in a content view. The
 * blur, the veil, the backdrop and the trim are all absolutely positioned and
 * so take part in no layout, which means a caller's `flexDirection`, `padding`
 * and `alignItems` reach the children exactly as they would on a plain `View`.
 * An intermediate wrapper would swallow every one of those and quietly relayout
 * any card that used them.
 */
const TONES = {
  thin: { fill: colors.glassThin, intensity: 45 },
  regular: { fill: colors.glassRegular, intensity: 75 },
  thick: { fill: colors.glassThick, intensity: 95 },
  /** Dark material, for glass laid over a photograph rather than the backdrop. */
  overImage: { fill: colors.glassOverImage, intensity: 60 },
};

/**
 * Android's blur is expensive enough that Expo gates it behind an opt-in, and
 * below SDK 31 it is not worth the frame cost — `dimezisBlurViewSdk31Plus`
 * takes the fast path where it exists and falls back to a plain fill where it
 * does not. It also needs a `blurTarget`, which `BlurTargetProvider` supplies.
 */
const ANDROID_BLUR_METHOD = 'dimezisBlurViewSdk31Plus';

export default function GlassPanel({
  children,
  backdrop,
  tone = 'regular',
  radius = radii.lg,
  bordered = true,
  borderColor = colors.glassBorder,
  specular = true,
  style,
  ...rest
}) {
  const material = TONES[tone] ?? TONES.regular;
  const blurTarget = useBlurTarget();
  const shape = [{ borderRadius: radius }, CONTINUOUS];

  const trim = (
    <>
      {/* The lit top edge. Drawn rather than borrowed from a border, because a
          border lights all four sides evenly and real glass does not. */}
      {specular ? (
        <Gradient
          pointerEvents="none"
          colors={gradients.specular}
          direction="vertical"
          style={styles.specular}
        />
      ) : null}

      {bordered ? (
        <View pointerEvents="none" style={[styles.border, shape, { borderColor }]} />
      ) : null}
    </>
  );

  // iOS 26+: hand the whole pane to the system material.
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive={false}
        style={[styles.panel, shape, style]}
        {...rest}
      >
        {backdrop}
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.panel, shape, style]} {...rest}>
      <BlurView
        pointerEvents="none"
        tint="light"
        intensity={material.intensity}
        blurMethod={ANDROID_BLUR_METHOD}
        blurTarget={blurTarget ?? undefined}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.veil, { backgroundColor: material.fill }]} />

      {backdrop}
      {trim}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    // Corners have to clip: the blur, the veil and the specular edge all bleed
    // to the pane's bounds and are shaped by it.
    overflow: 'hidden',
    // Android composites the blur beneath its own background; leaving this
    // transparent is what lets the backdrop through.
    backgroundColor: colors.transparent,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
  // A hairline drawn as an overlay rather than set on the panel, so it sits
  // above the veil instead of being tinted by it.
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 46,
  },
});
