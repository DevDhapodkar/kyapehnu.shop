import { StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, spacing } from '../../theme/colors';
import { type } from '../../theme/tokens';

/**
 * SectionHeader
 *
 * The eyebrow / title / description block that opens a section. Having one
 * component own it is what keeps the vertical rhythm identical from the
 * storefront to the vendor desk — every section starts at the same optical
 * position and the eye learns where to look.
 *
 * `action` renders a trailing text button, for the "See all"-shaped affordance
 * a section sometimes needs.
 */
export default function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  onActionPress,
  actionIcon = 'arrow-right',
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <View style={styles.text}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
          {title ? (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
        </View>

        {action && onActionPress ? (
          <PressableScale
            onPress={onActionPress}
            accessibilityRole="button"
            accessibilityLabel={action}
            style={styles.action}
            scaleTo={0.94}
          >
            <Text style={styles.actionLabel}>{action}</Text>
            <Icon name={actionIcon} size="sm" color={colors.platinum} />
          </PressableScale>
        ) : null}
      </View>

      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
  },
  eyebrow: {
    ...type.eyebrow,
    marginBottom: spacing.xs,
  },
  title: {
    ...type.title,
    fontSize: 24,
    lineHeight: 30,
  },
  description: {
    ...type.bodySmall,
    marginTop: spacing.s,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  actionLabel: {
    ...type.label,
    fontSize: 11,
    color: colors.platinum,
  },
});
