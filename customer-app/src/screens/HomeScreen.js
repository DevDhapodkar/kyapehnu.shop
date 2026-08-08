import { Dimensions, FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassCard from '../components/GlassCard';
import ProductCard from '../components/ProductCard';
import ScrollytellingScene from '../components/ScrollytellingScene';
import { formatINR, productsByProximity } from '../data/mockStores';
import useDeliveryLocation from '../hooks/useDeliveryLocation';
import { selectCartCount, selectCartTotal, useCartStore } from '../store/useCartStore';
import { colors, radii, spacing } from '../theme/colors';

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

// Total scrollable distance the camera path is mapped onto. The product feed
// below adds more content height, but the drone move still completes at the end
// of the third chapter and holds there.
const SCROLL_RANGE = SCREEN_HEIGHT * (SECTIONS.length - 1);

export default function HomeScreen({ navigation }) {
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const { areaLabel, status, refresh } = useDeliveryLocation();
  const cartCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const openProduct = (product) => navigation.navigate('ProductDetail', { product });

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

        {/* Commerce feed — the scrollytelling hands off to the catalogue here. */}
        <View style={styles.feed}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedEyebrow}>NEAREST TO YOU</Text>
            <Text style={styles.feedTitle}>In stock, minutes away.</Text>
            <Text style={styles.feedBody}>
              Sorted by distance from where you are standing, not by who paid for
              placement.
            </Text>
          </View>

          <FlatList
            data={productsByProximity}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => openProduct(item)} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.feedList}
            // The parent ScrollView already virtualises the vertical axis; this
            // row is short enough that windowing it adds jank rather than saving.
            initialNumToRender={5}
          />

          <Text style={styles.feedFootnote}>
            {productsByProximity.length} pieces across 5 independent Nagpur stores.
          </Text>
        </View>

        <View style={{ height: insets.bottom + spacing.xl * 2 }} />
      </Animated.ScrollView>

      {/* Floating glass header — sits above the scroll, below nothing. */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View pointerEvents="none" style={styles.headerFill} />

        <Pressable
          onPress={status === 'denied' ? refresh : undefined}
          style={styles.headerLeft}
        >
          <Text style={styles.headerEyebrow}>DELIVERING TO</Text>
          <Text style={styles.headerArea} numberOfLines={1}>
            {areaLabel}
            {status === 'denied' ? '  ·  enable GPS' : ''}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Cart')}
          style={({ pressed }) => [styles.bagButton, pressed && styles.bagPressed]}
        >
          <Text style={styles.bagLabel}>BAG</Text>
          <Text style={styles.bagValue}>
            {cartCount > 0 ? formatINR(cartTotal) : '—'}
          </Text>
          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
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

  // Feed
  feed: {
    paddingTop: spacing.lg,
    // Opaque base so the 3D canvas stops showing through once the story ends.
    backgroundColor: colors.obsidian,
  },
  feedHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  feedEyebrow: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  feedTitle: {
    color: colors.ivory,
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
  },
  feedBody: {
    color: colors.ash,
    fontSize: 13,
    lineHeight: 20,
  },
  feedList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  feedFootnote: {
    color: colors.slate,
    fontSize: 11,
    letterSpacing: 0.6,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
    overflow: 'hidden',
  },
  headerFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glassFillStrong,
  },
  headerLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerEyebrow: {
    color: colors.ash,
    fontSize: 9,
    letterSpacing: 2.5,
  },
  headerArea: {
    color: colors.ivory,
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  bagButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'flex-end',
    minWidth: 84,
  },
  bagPressed: {
    opacity: 0.7,
  },
  bagLabel: {
    color: colors.ash,
    fontSize: 9,
    letterSpacing: 2,
  },
  bagValue: {
    color: colors.ivory,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.crimsonBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.ivory,
    fontSize: 10,
    fontWeight: '700',
  },
});
