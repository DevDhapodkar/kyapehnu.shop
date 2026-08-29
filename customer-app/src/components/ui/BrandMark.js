import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme/colors';
import { elevation, type } from '../../theme/tokens';

const MARK = require('../../../assets/brand/mark.png');
const WATERMARK = require('../../../assets/brand/watermark.png');

/**
 * BrandMark
 *
 * The hanger, rendered from the vector source in scripts/brand. Screens import
 * this rather than the PNG so the asset path, the gold halo, and the wordmark's
 * tracking live in one place.
 *
 * Variants:
 *  - 'mark'    the hanger alone
 *  - 'lockup'  hanger + wordmark, stacked or inline
 */
export default function BrandMark({
  size = 40,
  variant = 'mark',
  tagline,
  glow = false,
  inline = false,
  style,
}) {
  const mark = (
    <Image
      source={MARK}
      style={[{ width: size, height: size }, glow && elevation.gold]}
      contentFit="contain"
      // Decorative here — the wordmark beside it already carries the name, and
      // on the bare mark the parent supplies the accessible label.
      accessibilityRole="image"
      accessibilityLabel="Kya Pehnu?"
      transition={200}
    />
  );

  if (variant === 'mark') {
    return <View style={style}>{mark}</View>;
  }

  return (
    <View style={[inline ? styles.lockupInline : styles.lockupStacked, style]}>
      {mark}
      <View style={inline ? styles.wordsInline : styles.wordsStacked}>
        <Text style={[styles.wordmark, { fontSize: size * 0.44 }]}>KYA PEHNU?</Text>
        {tagline ? <Text style={styles.tagline}>{tagline.toUpperCase()}</Text> : null}
      </View>
    </View>
  );
}

/**
 * A very low-contrast hanger laid behind a panel — the app's letterhead. Sits
 * under the content and never takes a touch.
 */
export function BrandWatermark({ size = 260, opacity = 0.035, style }) {
  return (
    <Image
      source={WATERMARK}
      pointerEvents="none"
      style={[styles.watermark, { width: size, height: size, opacity }, style]}
      contentFit="contain"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  lockupInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockupStacked: {
    alignItems: 'center',
    gap: spacing.s,
  },
  wordsInline: {
    justifyContent: 'center',
  },
  wordsStacked: {
    alignItems: 'center',
  },
  wordmark: {
    color: colors.ivory,
    fontWeight: '300',
    letterSpacing: 3.4,
  },
  tagline: {
    ...type.caption,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 2.8,
    marginTop: 3,
  },
  watermark: {
    position: 'absolute',
  },
});
