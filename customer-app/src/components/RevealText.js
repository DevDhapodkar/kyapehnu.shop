import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// RevealText
//
// The story copy is a PINNED layer of the scrollytelling, not text sitting in
// the scrolling page. It lives in an absolutely-positioned overlay that never
// travels with the ScrollView — exactly like the pre-rendered drone frames
// behind it. Instead of scrolling up and off the screen at finger speed, each
// beat is scrubbed off the shared `scrollY`: it JUMPS IN at a fixed spot on the
// screen, holds pinned while its beat of the drone shot is on, then JUMPS OUT
// before the next beat jumps in — with a short breath of pure image between
// captions. That is what makes the words feel welded to the camera move rather
// than printed on a transparent sheet gliding over it.
//
// Each beat owns a window of scroll centred on `index * SCREEN_HEIGHT` — the
// scroll offset at which the drone sits on that beat's quarter of the shot. The
// window has three phases:
//
//   enter  [center-0.42H .. center-0.12H]  copy precipitates up into place
//   hold   [center-0.12H .. center+0.12H]  copy settled, pinned, fully lit
//   exit   [center+0.12H .. center+0.42H]  copy dissolves up and out
//
// Outside its window a beat is at opacity 0, so only one caption is ever on
// screen and the gaps between windows show the drone shot alone.
//
// Within a beat the words still materialise out of the fabric: before it lands
// a run of text is a genuine optical blur (a real Gaussian `filter`, so the
// glyphs themselves are soft, not haloed), tracking blown wide so it reads as a
// diffuse smear of warm light, drawing tight and cooling to a thin ink halo as
// it resolves. Everything recomputes on the UI thread every frame off `scrollY`
// — no timers, no mount animations.
// ---------------------------------------------------------------------------

const BLUR_MAX = 14; // real Gaussian defocus on the glyphs at full dissolve, in px
const SHADOW_FLOOR = 2.5; // resting ink halo radius — keeps settled copy legible
const RISE_IN = 40; // px the copy climbs up from as it jumps in
const RISE_OUT = 44; // px the copy lifts away as it jumps out
const TRACK_SCATTER = 12; // extra letter-spacing (px) blown out while diffuse

// Beat window, in fractions of screen height relative to the beat's centre.
const ENTER_START = -0.42;
const ENTER_END = -0.12;
const EXIT_START = 0.12;
const EXIT_END = 0.42;

function clamp01(v) {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// The beat's raw enter/exit progress at the current scroll offset. `e` climbs
// 0→1 as the copy jumps in; `x` climbs 0→1 as it jumps out. `center` is the
// scroll offset (px) at which the beat is fully settled.
function beatProgress(scrollY, center) {
  'worklet';
  const y = scrollY.value;
  const e = clamp01(
    (y - (center + ENTER_START * SCREEN_HEIGHT)) / ((ENTER_END - ENTER_START) * SCREEN_HEIGHT),
  );
  const x = clamp01(
    (y - (center + EXIT_START * SCREEN_HEIGHT)) / ((EXIT_END - EXIT_START) * SCREEN_HEIGHT),
  );
  return { e, x };
}

// Stagger an element's own enter within the beat: it starts blooming once the
// beat's enter passes `start` and is full 0.5 of enter-range later.
function elementEnter(e, start) {
  'worklet';
  return clamp01((e - start) / 0.5);
}

// Shared per-frame appearance for a materialising run of text.
//  - er: this element's own 0→1 enter (staggered)
//  - x:  the beat's 0→1 exit (shared, so the whole block leaves as one)
//  - baseTracking: settled letterSpacing; `scatter` blows it wide while diffuse
//    (pass 0 on wrapping copy so the paragraph does not reflow every frame)
function materialiseStyle(er, x, baseTracking, blurScale, scatter) {
  'worklet';
  const r = er * (1 - x); // full only during the hold, 0 before enter and after exit
  const soft = 1 - r;
  // Jump in from below, settle at 0, then lift away upward as it exits.
  const translateY = (1 - er) * RISE_IN - x * RISE_OUT;
  return {
    opacity: interpolate(r, [0, 0.15, 1], [0, 0.35, 1]),
    transform: [{ translateY }, { scale: 0.9 + r * 0.1 }],
    // Real optical defocus on the letterforms — this is what makes the copy read
    // as forming out of the air rather than snapping in crisp.
    filter: [{ blur: soft * soft * BLUR_MAX * blurScale }],
    // Tracking blown wide while diffuse, drawing tight as it resolves.
    letterSpacing: baseTracking + soft * scatter,
    // Warm amber light (the sunset end of the aurora ramp, lifted off the
    // dress) cooling to a thin ink halo as the words settle.
    textShadowColor: interpolateColor(r, [0, 0.55, 1], [colors.amber, colors.amber, colors.sceneDeep]),
    textShadowRadius: SHADOW_FLOOR + soft * 10,
  };
}

function Word({ scrollY, center, start, children, last }) {
  const style = useAnimatedStyle(() => {
    const { e, x } = beatProgress(scrollY, center);
    // A word is a single unwrapped run — safe to blow its tracking wide.
    return materialiseStyle(elementEnter(e, start), x, -0.8, 1, TRACK_SCATTER);
  });

  return (
    <Animated.Text style={[styles.title, !last && styles.titleWordGap, style]}>
      {children}
    </Animated.Text>
  );
}

function Line({ scrollY, center, start, textStyle, baseTracking, blurScale, scatter = 0, children }) {
  const style = useAnimatedStyle(() => {
    const { e, x } = beatProgress(scrollY, center);
    return materialiseStyle(elementEnter(e, start), x, baseTracking, blurScale, scatter);
  });

  return <Animated.Text style={[textStyle, style]}>{children}</Animated.Text>;
}

export default function RevealText({ scrollY, index, eyebrow, title, body }) {
  // The beat is fully settled when the drone sits on its quarter of the shot,
  // i.e. when the ScrollView offset equals index * SCREEN_HEIGHT.
  const center = index * SCREEN_HEIGHT;
  const words = title.split(' ');

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.block}>
        <Line
          scrollY={scrollY}
          center={center}
          start={0}
          textStyle={styles.eyebrow}
          baseTracking={3}
          blurScale={0.6}
          scatter={TRACK_SCATTER}
        >
          {eyebrow.toUpperCase()}
        </Line>

        <View style={styles.titleRow}>
          {words.map((word, i) => (
            <Word
              key={`${word}-${i}`}
              scrollY={scrollY}
              center={center}
              // Cascade word by word: later words start blooming a touch later.
              start={0.06 + i * 0.05}
              last={i === words.length - 1}
            >
              {word}
            </Word>
          ))}
        </View>

        <Line
          scrollY={scrollY}
          center={center}
          start={0.22}
          textStyle={styles.body}
          baseTracking={0}
          blurScale={0.8}
        >
          {body}
        </Line>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pinned to the screen — the copy sits in the lower third and never scrolls
  // with the page. Each mounted beat occupies the same spot; only one is lit at
  // a time, so they never visually collide.
  // Anchored to the screen's lower third with an explicit bottom offset and NO
  // top/height, so the view hugs its own content. Every beat uses the same
  // anchor, so all four overlap in one pinned spot instead of stacking into a
  // second scrolling column — only the lit one is visible at a time.
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xl * 2,
    paddingHorizontal: spacing.md,
  },
  block: {
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.amber,
    fontSize: 11,
    marginBottom: spacing.sm,
    // The halo colour + radius are driven per-frame by the worklet; these are
    // just the offset (kept at origin so the bloom is symmetric).
    textShadowColor: colors.sceneDeep,
    textShadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: colors.onScene,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
    textShadowColor: colors.sceneDeep,
    textShadowOffset: { width: 0, height: 0 },
  },
  titleWordGap: {
    marginRight: 10,
  },
  body: {
    ...typography.bodyLg,
    color: colors.onSceneMuted,
    fontSize: 16,
    lineHeight: 24,
    textShadowColor: colors.sceneDeep,
    textShadowOffset: { width: 0, height: 0 },
  },
});
