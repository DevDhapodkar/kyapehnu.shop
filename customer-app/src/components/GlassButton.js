import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../theme/colors';

/**
 * GlassButton
 *
 * The single call-to-action primitive. Two visual weights:
 *  - primary (default): crimson fill, the only saturated surface in the app
 *  - ghost:             frosted pane with a hairline border, for secondary paths
 *
 * Press feedback is a 0.97 scale (via PressableScale) rather than an opacity
 * dim, so the whole button — label and all — reads as one object the finger is
 * physically pressing, and a single quiet haptic confirms the tap landed. The
 * scale settles back on release; the disabled/loading state still dims.
 */
export default function GlassButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  caption,
  style,
  accessibilityLabel,
}) {
  const isPrimary = variant === 'primary';
  const inert = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inert}
      haptic={inert ? false : 'light'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        inert && styles.disabled,
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.highlight} />
      {loading ? (
        <ActivityIndicator color={colors.ivory} />
      ) : (
        <>
          <Text style={[styles.label, !isPrimary && styles.labelGhost]}>
            {label.toUpperCase()}
          </Text>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  primary: {
    backgroundColor: colors.crimson,
    borderColor: colors.crimsonBright,
    shadowColor: colors.crimson,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  ghost: {
    backgroundColor: colors.glassFill,
    borderColor: colors.glassBorder,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: colors.ivory,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
  },
  labelGhost: {
    color: colors.platinum,
    fontWeight: '400',
  },
  caption: {
    color: colors.platinum,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 4,
  },
});
