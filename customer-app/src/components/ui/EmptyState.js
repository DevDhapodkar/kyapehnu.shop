import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Button from './Button';
import Icon from './Icon';
import { colors, radii, spacing } from '../../theme/colors';
import { duration, easing, type } from '../../theme/tokens';

/**
 * EmptyState
 *
 * An empty screen is a dead end unless it says three things: what is missing,
 * why that is normal, and what to do next. This component makes all three
 * mandatory in shape — a glyph in a halo, a title, a line of explanation, and
 * (nearly always) an action — so no screen in the app can ship a bare
 * "Nothing here".
 *
 * The block fades up on mount rather than appearing, so arriving at an empty
 * list reads as a considered state rather than as a failed render.
 */
export default function EmptyState({
  icon = 'inbox',
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  tone = 'neutral',
  style,
}) {
  const tint = tone === 'error' ? colors.crimsonGlow : colors.gold;

  return (
    <Animated.View
      entering={FadeInDown.duration(duration.deliberate).easing(easing.out)}
      style={[styles.wrap, style]}
    >
      <View style={[styles.halo, { borderColor: tone === 'error' ? 'rgba(196, 36, 58, 0.28)' : 'rgba(200, 162, 74, 0.22)' }]}>
        <View style={[styles.haloInner, { backgroundColor: tone === 'error' ? colors.crimsonWashSoft : colors.goldWashSoft }]}>
          <Icon name={icon} size="xxl" color={tint} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.action}
        />
      ) : null}

      {secondaryLabel && onSecondary ? (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          variant="ghost"
          size="sm"
          style={styles.secondary}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  halo: {
    width: 116,
    height: 116,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  haloInner: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.heading,
    fontWeight: '300',
    fontSize: 22,
    textAlign: 'center',
  },
  body: {
    ...type.bodySmall,
    textAlign: 'center',
    marginTop: spacing.s,
    maxWidth: 300,
  },
  action: {
    marginTop: spacing.md,
    minWidth: 200,
  },
  secondary: {
    marginTop: spacing.s,
  },
});
