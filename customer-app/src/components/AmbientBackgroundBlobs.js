import { Platform, StyleSheet, View } from 'react-native';

/**
 * AmbientBackgroundBlobs
 *
 * Implements Stitch's Floating Ambient Gradient Orbs for Frosted Glass Refraction:
 * 1. Glowing Crimson Orb: top-right (#f43f5e / #c4243a)
 * 2. Warm Amber / Gold Orb: mid-left (#f59e0b / #d97706)
 * 3. Soft Violet / Magenta Shimmer: mid-right (#8b5cf6 / #ec4899)
 * 4. Warm Champagne Glow: bottom-left (#fde68a)
 *
 * Glass cards and pills positioned over this layer create realistic frosted refraction.
 */
export default function AmbientBackgroundBlobs() {
  return (
    <View style={styles.container} pointerEvents="none" aria-hidden="true">
      {/* 1. Crimson Orb (Top Right) */}
      <View style={[styles.orb, styles.crimsonOrb]} />

      {/* 2. Amber Gold Orb (Mid Left) */}
      <View style={[styles.orb, styles.amberOrb]} />

      {/* 3. Soft Violet / Magenta Shimmer (Mid Right) */}
      <View style={[styles.orb, styles.violetOrb]} />

      {/* 4. Warm Champagne Glow (Bottom Left) */}
      <View style={[styles.orb, styles.champagneOrb]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
    backgroundColor: '#F4EFE7',
    ...Platform.select({
      web: {
        position: 'fixed',
      },
    }),
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  crimsonOrb: {
    top: -64,
    right: -64,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(244, 63, 94, 0.28)',
    ...Platform.select({
      web: {
        filter: 'blur(85px)',
        WebkitFilter: 'blur(85px)',
        background:
          'radial-gradient(circle, rgba(244,63,94,0.35) 0%, rgba(196,36,58,0.25) 55%, transparent 80%)',
      },
      default: {
        opacity: 0.6,
      },
    }),
  },
  amberOrb: {
    top: 320,
    left: -80,
    width: 288,
    height: 288,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
        WebkitFilter: 'blur(80px)',
        background:
          'radial-gradient(circle, rgba(245,158,11,0.30) 0%, rgba(217,119,6,0.20) 60%, transparent 80%)',
      },
      default: {
        opacity: 0.5,
      },
    }),
  },
  violetOrb: {
    top: 768,
    right: -56,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    ...Platform.select({
      web: {
        filter: 'blur(90px)',
        WebkitFilter: 'blur(90px)',
        background:
          'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(236,72,153,0.20) 60%, transparent 80%)',
      },
      default: {
        opacity: 0.5,
      },
    }),
  },
  champagneOrb: {
    bottom: 40,
    left: 40,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(253, 230, 138, 0.35)',
    ...Platform.select({
      web: {
        filter: 'blur(85px)',
        WebkitFilter: 'blur(85px)',
        background:
          'radial-gradient(circle, rgba(253,230,138,0.35) 0%, rgba(245,208,100,0.18) 60%, transparent 80%)',
      },
      default: {
        opacity: 0.6,
      },
    }),
  },
});
