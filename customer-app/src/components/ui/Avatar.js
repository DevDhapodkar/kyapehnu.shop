import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import Gradient from './Gradient';
import { colors, gradients, radii } from '../../theme/colors';

/**
 * Avatar
 *
 * A circular identity disc. With a `uri` it shows the photograph; without one it
 * falls back to initials over the aurora sweep, so an account with no picture
 * still reads as a person rather than an empty grey circle.
 *
 * `ring` adds the hairline halo used where the avatar sits directly on a
 * photograph and needs an edge to separate it from the image.
 */
const initialsFrom = (name) => {
  if (!name) return '·';

  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '·';

  // One name gives one letter; two or more take the first and the last, which
  // is what a "Priya Deshmukh" reads as on a counter — PD, not PR.
  const letters =
    words.length === 1 ? words[0][0] : words[0][0] + words[words.length - 1][0];

  return letters.toUpperCase();
};

export default function Avatar({ name, uri, size = 40, ring = false, style }) {
  const radius = size / 2;

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius },
        ring && styles.ring,
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" transition={180} />
      ) : (
        <>
          <Gradient pointerEvents="none" colors={gradients.dusk} style={styles.fill} />
          <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>
            {initialsFrom(name)}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
  },
  ring: {
    borderWidth: 1.5,
    borderColor: colors.glassBorderStrong,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
  },
  initials: {
    color: colors.ivory,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
