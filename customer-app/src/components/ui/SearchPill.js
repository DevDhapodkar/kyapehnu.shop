import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, CONTINUOUS, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * The magnifier, drawn rather than typed.
 *
 * The obvious character for this (U+2315) is in the Miscellaneous Technical
 * block, which Roboto does not reliably cover — on the Android devices this app
 * targets it can land as a tofu box. A circle and a rotated bar cost two views
 * and render identically everywhere.
 */
function MagnifierGlyph({ color = colors.ash }) {
  return (
    <View style={styles.magnifier}>
      <View style={[styles.magnifierLens, { borderColor: color }]} />
      <View style={[styles.magnifierHandle, { backgroundColor: color }]} />
    </View>
  );
}

/**
 * SearchPill
 *
 * The rounded search field from the reference navigation bar: a magnifier at
 * the leading edge, type running to the trailing edge, all inside one pill.
 *
 * Two modes on purpose. With `onChangeText` it is a live text input. Without
 * one it collapses to a button — the same pill, but it navigates instead of
 * focusing, which is what a header wants where search is a screen of its own
 * rather than an inline filter.
 */
export default function SearchPill({
  value,
  onChangeText,
  onPress,
  placeholder = 'Search',
  style,
}) {
  const readOnly = !onChangeText;

  const content = (
    <>
      <MagnifierGlyph />

      {readOnly ? (
        <Text numberOfLines={1} style={[styles.input, styles.placeholder]}>
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.slate}
          returnKeyType="search"
          style={styles.input}
        />
      )}
    </>
  );

  if (readOnly) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.pill, style]}>{content}</View>;
}

const LENS = 13;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.glassThin,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    ...CONTINUOUS,
  },
  pressed: {
    opacity: 0.75,
  },
  magnifier: {
    width: LENS + 5,
    height: LENS + 5,
    justifyContent: 'flex-start',
  },
  magnifierLens: {
    width: LENS,
    height: LENS,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  magnifierHandle: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 6,
    height: 1.5,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.ivory,
    // A TextInput carries its own vertical padding on Android; zeroing it keeps
    // the text on the pill's centre line.
    paddingVertical: 0,
  },
  placeholder: {
    color: colors.slate,
  },
});
