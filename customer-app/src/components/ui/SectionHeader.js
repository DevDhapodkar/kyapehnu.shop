import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * SectionHeader
 *
 * Eyebrow over a title, with an optional text action on the right. Every list
 * and grid on the page is introduced by one of these, which is what gives the
 * bento layout its rhythm — the eye finds the same shape at the top of each
 * band.
 */
export default function SectionHeader({ eyebrow, title, caption, actionLabel, onAction, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.text}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
  },
  eyebrow: {
    ...typography.eyebrow,
    letterSpacing: 0.2,
    color: colors.ember,
    marginBottom: 6,
  },
  title: {
    ...typography.h2,
    color: colors.ivory,
  },
  caption: {
    ...typography.body,
    color: colors.ash,
    marginTop: 6,
  },
  action: {
    paddingBottom: 3,
  },
  pressed: {
    opacity: 0.6,
  },
  actionLabel: {
    ...typography.micro,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.platinum,
  },
});
