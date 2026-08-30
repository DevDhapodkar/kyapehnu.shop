import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Chip, FloatingCard, Gradient, PillButton } from '../ui';
import { formatINR } from '../../data/mockStores';
import { colors, gradients, radii, shadows, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * HeroPanel
 *
 * The storefront's opening statement, built as one large bento card: a
 * photograph running to all four corners, the pitch in wide uppercase display
 * type over it, and a frosted card floating at the lower edge carrying the
 * piece the shot is actually of.
 *
 * It features a real product rather than stock art — the nearest thing to the
 * buyer right now — so the loudest element on the screen is also a live
 * destination. Everything in it routes to the same product, which is why the
 * button and the floating card share one handler.
 */
export default function HeroPanel({ product, onOpen, style }) {
  if (!product) return null;

  const eta = typeof product.etaMinutes === 'number' ? `${product.etaMinutes} min` : null;
  const distance = typeof product.distanceKm === 'number' ? `${product.distanceKm} km away` : null;

  return (
    <View style={[styles.card, style]}>
      <Image
        source={{ uri: product.image }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={280}
      />

      {/* Two scrims, not one. The top holds the eyebrow under the floating
          header; the bottom carries the display line and the card. */}
      <Gradient
        pointerEvents="none"
        colors={gradients.topScrim}
        direction="vertical"
        steps={16}
        style={styles.topScrim}
      />
      <Gradient
        pointerEvents="none"
        colors={gradients.imageScrim}
        direction="vertical"
        steps={28}
        style={styles.bottomScrim}
      />

      <View style={styles.body}>
        <View style={styles.chips}>
          <Chip label="Nearest to you" size="sm" tone="glass" />
          {eta ? <Chip label={eta} size="sm" tone="light" /> : null}
        </View>

        <Text style={styles.display}>IN STOCK,{'\n'}MINUTES AWAY.</Text>

        <Text style={styles.blurb} numberOfLines={2}>
          Live from independent Nagpur shops. On a rail, and a rider away.
        </Text>

        <PillButton
          label="See the piece"
          icon="→"
          onPress={onOpen}
          style={styles.cta}
        />
      </View>

      <FloatingCard
        thumbnail={product.image}
        eyebrow={product.storeName}
        title={product.name}
        subtitle={[formatINR(product.price), distance].filter(Boolean).join('  ·  ')}
        onPress={onOpen}
        style={styles.floating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 470,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    ...shadows.high,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '72%',
  },
  body: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    // Clears the floating card, which overhangs the panel's lower edge.
    bottom: 96,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  display: {
    ...typography.display,
    color: colors.ivory,
  },
  blurb: {
    ...typography.body,
    color: colors.platinum,
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  floating: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
  },
});
