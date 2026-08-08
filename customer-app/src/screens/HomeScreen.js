import { Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import GlassCard from '../components/GlassCard';
import ScrollytellingScene from '../components/ScrollytellingScene';
import { colors, spacing } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SECTIONS = [
  {
    eyebrow: 'Kya Pehnu?',
    title: 'Nagpur, delivered.',
    body: 'The clothes hanging in the shop two streets away, in your hands in under an hour. No warehouse. No mass market. Just the city you already live in.',
  },
  {
    eyebrow: 'Chapter I — The Shirt',
    title: 'Cut for the evening.',
    body: 'Obsidian cotton from an independent tailor in Sitabuldi. Every piece on this app comes from a shop with a name, a shutter, and an owner who picked the fabric.',
  },
  {
    eyebrow: 'Chapter II — The Dress',
    title: 'Red, and nothing else.',
    body: 'Scroll to fall past the shirt and land on the dress. Local fashion, indexed by how close it is to you — then brought to your door.',
  },
];

// Total scrollable distance: three full-screen sections minus the viewport.
const SCROLL_RANGE = SCREEN_HEIGHT * (SECTIONS.length - 1);

export default function HomeScreen() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* 3D canvas sits behind everything and never intercepts touches. */}
      <ScrollytellingScene scrollY={scrollY} scrollRange={SCROLL_RANGE} />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {SECTIONS.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <GlassCard style={styles.card} strong={index === 0}>
              <Text style={styles.eyebrow}>{section.eyebrow.toUpperCase()}</Text>
              <Text style={styles.title}>{section.title}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </GlassCard>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  scrollContent: {
    backgroundColor: colors.transparent,
  },
  section: {
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 1.5,
  },
  card: {
    width: '100%',
  },
  eyebrow: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ivory,
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.platinum,
    fontSize: 15,
    lineHeight: 23,
  },
});
