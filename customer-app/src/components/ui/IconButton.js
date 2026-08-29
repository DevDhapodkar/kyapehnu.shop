import { StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, radii } from '../../theme/colors';
import { elevation, HIT_TARGET } from '../../theme/tokens';

/**
 * IconButton
 *
 * The circular frosted control used for chrome — back, bag, profile, close.
 *
 * Every one of these takes an `accessibilityLabel`, because a glyph alone is
 * silent to a screen reader. `badge` renders the count overlay the bag and the
 * order desk both need, positioned outside the circle so it never sits on top
 * of the glyph.
 */
export default function IconButton({
  icon,
  onPress,
  size = HIT_TARGET,
  tone = 'glass',
  badge,
  accessibilityLabel,
  disabled = false,
  style,
}) {
  const accented = tone === 'accent';

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: accented ? colors.crimsonWash : colors.glassFillStrong,
          borderColor: accented ? 'rgba(196, 36, 58, 0.5)' : colors.glassBorder,
        },
        elevation.low,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size="md" color={accented ? colors.crimsonGlow : colors.ivory} />

      {badge ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.4,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.crimsonBright,
    borderWidth: 1.5,
    borderColor: colors.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.ivory,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    fontVariant: ['tabular-nums'],
  },
});
