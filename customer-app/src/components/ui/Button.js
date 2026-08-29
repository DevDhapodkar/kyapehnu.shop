import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import Gradient from './Gradient';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../../theme/colors';
import { elevation, type, HIT_TARGET } from '../../theme/tokens';

/**
 * Button
 *
 * The app's call-to-action primitive. Four weights, and the weight is the
 * *only* thing that signals importance — there is exactly one `primary` on any
 * given screen, so the eye never has to choose between two crimson fills.
 *
 *  - primary:   gradient crimson, the committed action
 *  - secondary: frosted pane with a bright border, the parallel path
 *  - ghost:     text and a hairline, for a path the user probably will not take
 *  - danger:    destructive, and visually distinct from primary so a cancel is
 *               never one muscle-memory tap away from a confirm
 *
 * Loading swaps the label for a spinner *in place* rather than collapsing the
 * button, so the layout does not shift under a finger that is still on screen,
 * and the control is disabled for the duration so a double-tap cannot fire the
 * action twice.
 */
const VARIANTS = {
  primary: {
    gradient: 'crimson',
    border: colors.crimsonGlow,
    label: colors.ivory,
    lift: 'accent',
    haptic: 'medium',
  },
  secondary: {
    fill: colors.ivoryWash,
    border: colors.glassBorderStrong,
    label: colors.ivory,
    lift: 'low',
    haptic: 'light',
  },
  ghost: {
    fill: colors.glassFill,
    border: colors.glassBorder,
    label: colors.platinum,
    lift: 'flat',
    haptic: 'light',
  },
  danger: {
    fill: 'rgba(142, 27, 41, 0.18)',
    border: 'rgba(196, 36, 58, 0.55)',
    label: colors.crimsonGlow,
    lift: 'flat',
    haptic: 'medium',
  },
};

const SIZES = {
  sm: { paddingVertical: 10, paddingHorizontal: spacing.m, fontSize: 11, minHeight: 38 },
  md: { paddingVertical: 15, paddingHorizontal: spacing.lg, fontSize: 12, minHeight: HIT_TARGET },
  lg: { paddingVertical: 18, paddingHorizontal: spacing.lg, fontSize: 13, minHeight: 56 },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  caption,
  fullWidth = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) {
  const skin = VARIANTS[variant] ?? VARIANTS.primary;
  const metrics = SIZES[size] ?? SIZES.md;
  const inert = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inert}
      haptic={skin.haptic}
      scaleTo={0.975}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={[
        styles.base,
        {
          paddingVertical: metrics.paddingVertical,
          paddingHorizontal: metrics.paddingHorizontal,
          minHeight: metrics.minHeight,
          borderColor: skin.border,
          backgroundColor: skin.fill ?? colors.transparent,
        },
        elevation[skin.lift] ?? elevation.flat,
        fullWidth && styles.fullWidth,
        inert && styles.inert,
        style,
      ]}
    >
      {skin.gradient ? <Gradient fill preset={skin.gradient} angle="diagonal" /> : null}
      <View pointerEvents="none" style={styles.specular} />

      {loading ? (
        <ActivityIndicator color={skin.label} />
      ) : (
        <>
          <View style={styles.row}>
            {icon ? <Icon name={icon} size="sm" color={skin.label} /> : null}
            <Text
              style={[styles.label, { color: skin.label, fontSize: metrics.fontSize }]}
              numberOfLines={1}
            >
              {String(label).toUpperCase()}
            </Text>
            {iconRight ? <Icon name={iconRight} size="sm" color={skin.label} /> : null}
          </View>

          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  inert: {
    opacity: 0.42,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  label: {
    ...type.label,
    letterSpacing: 1.8,
  },
  caption: {
    ...type.caption,
    color: colors.platinum,
    marginTop: 3,
    letterSpacing: 0.8,
  },
});
