import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, CONTINUOUS, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * Field
 *
 * The labelled text input. Sign-in, shop registration and the catalogue
 * composer each grew their own copy of this before the redesign; they now share
 * one, so a change to input height or focus treatment lands everywhere.
 *
 * The well is *darker* than the pane it sits in rather than lighter. On glass a
 * recessed input reads as somewhere to put something, while a lighter one
 * competes with the buttons — and a second frosted layer inside a frosted card
 * turns both to mush.
 */
export default function Field({
  label,
  hint,
  multiline = false,
  containerStyle,
  style,
  ...inputProps
}) {
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={colors.slate}
        style={[styles.input, multiline && styles.inputMultiline, style]}
      />

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    color: colors.platinum,
    marginBottom: 7,
  },
  input: {
    ...typography.bodyLg,
    color: colors.ivory,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 13,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassWell,
    ...CONTINUOUS,
  },
  inputMultiline: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  hint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.slate,
    marginTop: 6,
  },
});
