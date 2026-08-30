import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import IconButton from './IconButton';
import { colors, radii, shadows, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * FloatingCard
 *
 * The small frosted card that sits *on* a hero image rather than under it: a
 * thumbnail, two lines of type, and a circular action at the trailing edge.
 * It is what turns a photograph into a piece of interface — the image keeps its
 * full bleed, and the card carries the one fact worth reading off it.
 *
 * Deliberately dense: it is never the primary target on a screen, so the type
 * is small and the whole card is the press target, with the disc reading as an
 * affordance rather than a second, competing button.
 */
export default function FloatingCard({
  thumbnail,
  eyebrow,
  title,
  subtitle,
  actionGlyph = '›',
  onPress,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed, style]}
    >
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.thumb} contentFit="cover" transition={200} />
      ) : null}

      <View style={styles.body}>
        {eyebrow ? (
          <Text numberOfLines={1} style={styles.eyebrow}>
            {eyebrow.toUpperCase()}
          </Text>
        ) : null}
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onPress ? (
        // The disc mirrors the card's own press rather than owning a second
        // action, so a miss on the glyph still activates the card.
        <IconButton
          glyph={actionGlyph}
          tone="light"
          size={34}
          onPress={onPress}
          accessibilityLabel={title}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 9,
    paddingRight: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.glassFillDense,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    ...shadows.high,
  },
  pressed: {
    opacity: 0.85,
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceHigh,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 1.6,
    color: colors.ash,
    marginBottom: 3,
  },
  title: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ivory,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.platinum,
    marginTop: 2,
  },
});
