import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { FRAMES } from '../../assets/scrollytelling/frames.generated';
import { colors } from '../theme/colors';

// ---------------------------------------------------------------------------
// ScrollytellingSequence
//
// The logged-out marketing drone shot, played back as a pre-rendered image
// sequence rather than a live 3D scene. The garments are rendered offline into
// a WebP frame sequence (scripts/render-scrollytelling) and this component swaps
// the frame that matches the current scroll position.
//
// Playback uses a *load-gated* double buffer. Two stacked layers hold a frame
// each; only one is on top at a time. When the scroll lands on a new index we
// write it to the layer that is currently *behind* and leave the visible layer
// untouched — then we promote the back layer to the front only once its bitmap
// has actually decoded (its onLoad fires). That gate is the whole point: a plain
// <Image> whose source swaps in place keeps painting its PREVIOUS bitmap until
// the new one decodes, so bringing a layer forward before it has loaded flashes
// stale content — the glitch. Because we never promote an undecoded layer, the
// visible frame only ever cuts to a frame that is ready, so the scrub is clean.
//
// Requests that arrive mid-decode are coalesced: we remember only the latest
// desired index and, when the in-flight decode finishes, jump straight to it —
// intermediate frames under a fast flick are skipped rather than queued, so the
// buffer never falls behind the finger.
//
// Props:
//  - scrollY:     Reanimated shared value holding the ScrollView offset in px
//  - scrollRange: px of scroll that maps to the full 0..1 sequence
// ---------------------------------------------------------------------------

const LAST_FRAME = FRAMES.length - 1;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function clamp01(v) {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export default function ScrollytellingSequence({ scrollY, scrollRange = 1 }) {
  // Only these two drive rendering. Everything else is a ref so the scrub logic
  // never triggers a render on its own — React reconciles at most once per
  // committed frame swap, not once per scroll event.
  const [layers, setLayers] = useState([0, 0]); // frame index shown by [A, B]
  const [topLayer, setTopLayer] = useState(0);   // 0 => A in front, 1 => B in front

  const topRef = useRef(0);       // which layer is currently visible
  const shownRef = useRef(0);     // frame index currently on that visible layer
  const desiredRef = useRef(0);   // latest frame the scroll wants
  const loadingRef = useRef(false); // a back-layer decode is in flight
  const pendingRef = useRef(0);   // frame index that back layer is decoding
  // Mirror of `layers` read by the (render-independent) scrub logic so it never
  // sees a stale closure value.
  const layersRef = useRef([0, 0]);

  // Bring a layer that is known to already hold `frame` to the front.
  const promote = useCallback((layerIndex, frame) => {
    topRef.current = layerIndex;
    shownRef.current = frame;
    setTopLayer(layerIndex);
  }, []);

  // Advance the buffer toward the latest desired frame. Coalesces: only ever
  // chases desiredRef, never a queue of intermediate indices.
  const pump = useCallback(() => {
    if (loadingRef.current) return;
    // Loop so we can fast-forward through any frame the back layer already holds
    // (a ping-pong back to a recently shown index) without a self-recursive call.
    for (;;) {
      const want = desiredRef.current;
      if (want === shownRef.current) return;
      const back = topRef.current === 0 ? 1 : 0;

      // Back layer already holds the wanted frame — no decode is coming, so cut
      // immediately. Waiting on an onLoad that will never fire (the source did
      // not change) would freeze the sequence.
      if (layersRef.current[back] === want) {
        promote(back, want);
        continue;
      }

      // Otherwise write it to the back layer and wait for its onLoad to promote.
      pendingRef.current = want;
      loadingRef.current = true;
      layersRef.current = layersRef.current.slice();
      layersRef.current[back] = want;
      setLayers(layersRef.current);
      return;
    }
  }, [promote]);

  // Fired by whichever layer just finished decoding an image.
  const handleLoaded = useCallback((layerIndex) => {
    // Ignore the visible layer (re-decodes of the frame already on screen) and
    // any load that is not the decode we are currently waiting on.
    if (layerIndex === topRef.current) return;
    if (!loadingRef.current) return;
    if (layersRef.current[layerIndex] !== pendingRef.current) return;

    // The back layer's bitmap is ready — cut to it, then chase any newer frame
    // that arrived while it decoded.
    loadingRef.current = false;
    promote(layerIndex, pendingRef.current);
    pump();
  }, [promote, pump]);

  // Reanimated can only call plain JS functions via runOnJS; this records the
  // target and pumps the buffer.
  const setDesired = useCallback((next) => {
    desiredRef.current = next;
    pump();
  }, [pump]);

  // Map scroll offset to a frame index on the UI thread and only cross back to
  // JS when the index actually changes.
  useAnimatedReaction(
    () => {
      const range = scrollRange > 0 ? scrollRange : 1;
      return Math.round(clamp01(scrollY.value / range) * LAST_FRAME);
    },
    (next, prev) => {
      if (next !== prev) runOnJS(setDesired)(next);
    },
    [scrollRange],
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {/* React Native's core <Image>, not expo-image: on this Expo/RN build
          expo-image silently no-ops on numeric require() frame sources (never
          fires onLoad), which would strand this load-gated buffer on frame 0.
          Core <Image> fires onLoad reliably for bundled assets. */}
      <Image
        style={[styles.frame, { zIndex: topLayer === 0 ? 1 : 0 }]}
        source={FRAMES[layers[0]]}
        resizeMode="cover"
        fadeDuration={0}
        onLoad={() => handleLoaded(0)}
      />
      <Image
        style={[styles.frame, { zIndex: topLayer === 1 ? 1 : 0 }]}
        source={FRAMES[layers[1]]}
        resizeMode="cover"
        fadeDuration={0}
        onLoad={() => handleLoaded(1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
  },
  frame: {
    // position:absolute keeps the frame painting *behind* the story ScrollView
    // and explicit width/height give contentFit a concrete box.
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
