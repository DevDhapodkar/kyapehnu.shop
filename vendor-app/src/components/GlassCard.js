import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../theme/colors';

/**
 * GlassCard
 *
 * Simulates a frosted-glass overlay without a native blur dependency: an
 * absolutely-positioned semi-transparent dark fill sits behind the content,
 * with a second absolutely-positioned hairline highlight along the top edge to
 * fake the specular line real glass picks up. Because both layers are absolute,
 * the card's size is driven purely by its children.
 *
 * Props:
 *  - strong:  use the denser fill (for cards sitting over lighter surfaces)
 *  - padded:  set false when the child manages its own insets (list rows)
 *  - style:   extra container styles (margins, width, alignment)
 */
export default function GlassCard({ children, strong = false, padded = true, style }) {
  return (
    <View style={[styles.container, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.fill,
          { backgroundColor: strong ? colors.glassFillStrong : colors.glassFill },
        ]}
      />
      <View pointerEvents="none" style={styles.highlight} />
      <View style={padded ? styles.content : null}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  content: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
