import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * AmbientBackgroundBlobs
 *
 * Implements Stitch's Floating Ambient Gradient Orbs for Frosted Glass Refraction:
 * 1. Glowing Crimson Orb: top-right (#f43f5e / #c4243a)
 * 2. Warm Amber / Gold Orb: mid-left (#f59e0b / #d97706)
 * 3. Soft Violet / Magenta Shimmer: mid-right (#8b5cf6 / #ec4899)
 * 4. Warm Champagne Glow: bottom-left (#fde68a)
 *
 * All 4 orbs smoothly drift, bounce, and pulse using multi-frequency sine wave
 * animations, creating realistic living refraction through the frosted glass cards.
 */
export default function AmbientBackgroundBlobs() {
  // 1. Crimson Orb shared values
  const crimsonX = useSharedValue(-20);
  const crimsonY = useSharedValue(0);
  const crimsonScale = useSharedValue(1.0);

  // 2. Amber Orb shared values
  const amberX = useSharedValue(10);
  const amberY = useSharedValue(-15);
  const amberScale = useSharedValue(0.96);

  // 3. Violet Orb shared values
  const violetX = useSharedValue(0);
  const violetY = useSharedValue(20);
  const violetScale = useSharedValue(1.02);

  // 4. Champagne Orb shared values
  const champagneX = useSharedValue(15);
  const champagneY = useSharedValue(-10);
  const champagneScale = useSharedValue(0.95);

  useEffect(() => {
    // Crimson orb motion (~7-8.5s loop)
    crimsonX.value = withRepeat(
      withTiming(25, { duration: 7200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    crimsonY.value = withRepeat(
      withTiming(30, { duration: 8600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    crimsonScale.value = withRepeat(
      withTiming(1.15, { duration: 6200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Amber orb motion (~8-9.5s loop)
    amberX.value = withRepeat(
      withTiming(35, { duration: 9100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    amberY.value = withRepeat(
      withTiming(25, { duration: 7800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    amberScale.value = withRepeat(
      withTiming(1.12, { duration: 8400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Violet orb motion (~8.5-10s loop)
    violetX.value = withRepeat(
      withTiming(-30, { duration: 8400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    violetY.value = withRepeat(
      withTiming(35, { duration: 9800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    violetScale.value = withRepeat(
      withTiming(1.16, { duration: 7600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Champagne orb motion (~9-11s loop)
    champagneX.value = withRepeat(
      withTiming(-25, { duration: 10200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    champagneY.value = withRepeat(
      withTiming(25, { duration: 8200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    champagneScale.value = withRepeat(
      withTiming(1.10, { duration: 9200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [
    crimsonX,
    crimsonY,
    crimsonScale,
    amberX,
    amberY,
    amberScale,
    violetX,
    violetY,
    violetScale,
    champagneX,
    champagneY,
    champagneScale,
  ]);

  const crimsonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: crimsonX.value },
      { translateY: crimsonY.value },
      { scale: crimsonScale.value },
    ],
  }));

  const amberAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: amberX.value },
      { translateY: amberY.value },
      { scale: amberScale.value },
    ],
  }));

  const violetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: violetX.value },
      { translateY: violetY.value },
      { scale: violetScale.value },
    ],
  }));

  const champagneAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: champagneX.value },
      { translateY: champagneY.value },
      { scale: champagneScale.value },
    ],
  }));

  return (
    <View style={styles.container} pointerEvents="none" aria-hidden="true">
      {/* 1. Crimson Orb (Top Right) */}
      <Animated.View
        style={[styles.orb, styles.crimsonOrb, crimsonAnimatedStyle]}
      />

      {/* 2. Amber Gold Orb (Mid Left) */}
      <Animated.View
        style={[styles.orb, styles.amberOrb, amberAnimatedStyle]}
      />

      {/* 3. Soft Violet / Magenta Shimmer (Mid Right) */}
      <Animated.View
        style={[styles.orb, styles.violetOrb, violetAnimatedStyle]}
      />

      {/* 4. Warm Champagne Glow (Bottom Left) */}
      <Animated.View
        style={[styles.orb, styles.champagneOrb, champagneAnimatedStyle]}
      />
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
    width: 340,
    height: 340,
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
    width: 300,
    height: 300,
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
    width: 340,
    height: 340,
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
    width: 340,
    height: 340,
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
