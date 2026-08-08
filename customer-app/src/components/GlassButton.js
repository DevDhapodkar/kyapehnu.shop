import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/colors';

/**
 * GlassButton
 *
 * The single call-to-action primitive. Two visual weights:
 *  - primary (default): crimson fill, the only saturated surface in the app
 *  - ghost:             frosted pane with a hairline border, for secondary paths
 *
 * Pressed state dims via opacity rather than a colour swap so the glass layers
 * underneath stay visible through the transition.
 */
export default function GlassButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  caption,
  style,
}) {
  const isPrimary = variant === 'primary';
  const inert = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        inert && styles.disabled,
        pressed && !inert && styles.pressed,
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
    </Pressable>
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
  pressed: {
    opacity: 0.75,
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
