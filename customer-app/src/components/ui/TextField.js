import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../../theme/colors';
import { duration, easing, reduceMotion, type, HIT_TARGET } from '../../theme/tokens';

/**
 * TextField
 *
 * One input for every form in the app. Previously each form screen carried its
 * own private `Field`, which is how the two of them drifted apart.
 *
 * The focus ring is animated rather than swapped: a border that changes colour
 * on the frame the keyboard opens is easy to miss on a dark surface, where a
 * ring that *grows* into place under the finger is not. Nothing else on the
 * screen moves, so the animation is unambiguous about which field is live.
 *
 * Props:
 *  - label:   wide-tracked caption above the input
 *  - icon:    leading Feather glyph
 *  - error:   message shown under the field; also tints the ring
 *  - hint:    supporting copy shown when there is no error
 *  - secure:  password entry, with a reveal toggle
 */
export default function TextField({
  label,
  icon,
  error,
  hint,
  secure = false,
  multiline = false,
  style,
  inputStyle,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const focus = useSharedValue(0);

  const onFocus = (event) => {
    setFocused(true);
    focus.value = withTiming(1, {
      duration: duration.fast,
      easing: easing.out,
      ...reduceMotion,
    });
    inputProps.onFocus?.(event);
  };

  const onBlur = (event) => {
    setFocused(false);
    focus.value = withTiming(0, {
      duration: duration.base,
      easing: easing.out,
      ...reduceMotion,
    });
    inputProps.onBlur?.(event);
  };

  const ringStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [{ scale: 0.985 + focus.value * 0.015 }],
  }));

  const ringColor = error ? colors.crimsonGlow : colors.goldBright;

  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label.toUpperCase()}</Text> : null}

      <View style={[styles.shell, error && styles.shellError, multiline && styles.shellMultiline]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.ring, { borderColor: ringColor }, ringStyle]}
        />

        {icon ? (
          <Icon
            name={icon}
            size="sm"
            color={focused ? colors.goldBright : colors.slate}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          {...inputProps}
          onFocus={onFocus}
          onBlur={onBlur}
          multiline={multiline}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={colors.slate}
          selectionColor={colors.crimsonGlow}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
        />

        {secure ? (
          <PressableScale
            onPress={() => setRevealed((current) => !current)}
            haptic="selection"
            scaleTo={0.86}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={styles.reveal}
          >
            <Icon name={revealed ? 'eye-off' : 'eye'} size="sm" color={colors.ash} />
          </PressableScale>
        ) : null}
      </View>

      {error ? (
        <View style={styles.messageRow}>
          <Icon name="alert-circle" size="xs" color={colors.crimsonGlow} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.sm,
  },
  label: {
    ...type.caption,
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HIT_TARGET,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.obsidianDeep,
  },
  shellError: {
    borderColor: 'rgba(196, 36, 58, 0.5)',
  },
  shellMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.s,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.sm,
    borderWidth: 1.5,
  },
  icon: {
    marginRight: spacing.s,
  },
  input: {
    flex: 1,
    color: colors.ivory,
    fontSize: 15,
    paddingVertical: 11,
  },
  inputMultiline: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  reveal: {
    paddingLeft: spacing.s,
    paddingVertical: spacing.xs,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  error: {
    ...type.caption,
    color: colors.crimsonGlow,
    flex: 1,
  },
  hint: {
    ...type.caption,
    color: colors.slate,
    marginTop: 6,
  },
});
