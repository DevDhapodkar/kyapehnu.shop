import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AuthCta from '../components/AuthCta';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import RevealText from '../components/RevealText';
import ScrollytellingSequence from '../components/ScrollytellingSequence';
import SpotlightCard from '../components/home/SpotlightCard';
import StorefrontAppBar from '../components/home/StorefrontAppBar';
import {
  BrandMark,
  Chip,
  EmptyState,
  Icon,
  LiveDot,
  SectionHeader,
  StatRow,
  StatTile,
  Surface,
} from '../components/ui';
import { formatINR } from '../data/mockStores';
import useDeliveryLocation from '../hooks/useDeliveryLocation';
import { useStorefrontStore } from '../store/useStorefrontStore';
import { selectCartCount, selectCartTotal, useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { colors, spacing } from '../theme/colors';
import { duration, easing, type } from '../theme/tokens';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// The story sells the product in four beats, each one timed to a beat of the
// drone shot behind it: what this is, where the clothes come from, how they are
// ranked, and what actually happens when you tap. A fifth panel — the sign-up
// call to action — closes it out over the drone's arrival on the dress.
const SECTIONS = [
  {
    eyebrow: 'Kya Pehnu?',
    title: 'Nagpur, delivered.',
    body: 'The clothes hanging in the shop two streets away, in your hands in under an hour. No warehouse. No mass market. Just the city you already live in.',
  },
  {
    eyebrow: 'Chapter I — The Shirt',
    title: 'Every piece has a shutter.',
    body: 'Obsidian cotton from an independent tailor in Sitabuldi. Nothing here is drop-shipped: each garment sits on a rail in a real Nagpur shop, and you are seeing what is in stock right now.',
  },
  {
    eyebrow: 'Chapter II — The Dress',
    title: 'Sorted by how close it is.',
    body: 'Not by who paid for placement. Turn on location and the whole catalogue reorders itself around you — the dress three lanes away comes before the one across the city.',
  },
  {
    eyebrow: 'How it works',
    title: 'Tap it. Wear it tonight.',
    body: 'Pick a piece, and the shop is told the moment you check out. A rider collects it from the counter and brings it over while you watch the map. One hour, door to door.',
  },
];

// Total scrollable distance the camera path is mapped onto. There are
// SECTIONS.length story panels plus one closing CTA panel, so the number of
// full-height gaps the drone move spans is exactly SECTIONS.length — the shot
// lands on the dress just as the CTA scrolls into frame.
const SCROLL_RANGE = SCREEN_HEIGHT * SECTIONS.length;

/** Two columns, with a gutter either side and one between. */
const GRID_GUTTER = spacing.m;
const GRID_GAP = spacing.sm;
const GRID_COLUMN_WIDTH = (SCREEN_WIDTH - GRID_GUTTER * 2 - GRID_GAP) / 2;

/** How many placeholder tiles stand in for the grid on a cold load. */
const SKELETON_COUNT = 6;

/** The chip that means "no category filter". */
const ALL = '__all__';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const { areaLabel, status, refresh } = useDeliveryLocation();
  const cartCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);

  // The scrollytelling is a first-run marketing funnel: it only runs for a
  // visitor who has not signed in. Once there is a session token the home
  // screen is a returning customer's storefront, so the drone shot and the
  // pitch are dropped and the catalogue is shown straight away.
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));

  // One shared offset drives both the app bar's condense and, on the logged-out
  // flow, the drone shot and the caption beats.
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // The CTA splits sign-up from sign-in: "Join Now" opens the Auth screen in
  // register mode, "Log in" in sign-in mode. The Firebase session, once
  // established, flips this screen to the storefront via the auth store.
  const openAuth = useCallback(
    (mode) => navigation.navigate('Auth', { mode }),
    [navigation]
  );

  const openProduct = useCallback(
    (product) => navigation.navigate('ProductDetail', { product }),
    [navigation]
  );

  const appBar = (
    <StorefrontAppBar
      scrollY={scrollY}
      insetTop={insets.top}
      areaLabel={areaLabel}
      locationStatus={status}
      onPressLocation={refresh}
      onPressProfile={() => navigation.navigate('Profile')}
      onPressBag={() => navigation.navigate('Cart')}
      cartCount={cartCount}
      cartTotal={cartTotal}
      formatTotal={formatINR}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {isLoggedIn ? (
        <Storefront
          insets={insets}
          scrollHandler={scrollHandler}
          onOpenProduct={openProduct}
        />
      ) : (
        <MarketingScrollytelling
          insets={insets}
          scrollY={scrollY}
          scrollHandler={scrollHandler}
          onJoin={() => openAuth('register')}
          onLogin={() => openAuth('signin')}
        />
      )}

      {appBar}
    </View>
  );
}

/**
 * The logged-out cinematic pitch: the 3D drone shot behind a stack of glass
 * story cards, closing on the sign-up CTA.
 */
function MarketingScrollytelling({ insets, scrollY, scrollHandler, onJoin, onLogin }) {
  // The scroll hint is only honest before the user has scrolled; once they
  // have, it is noise sitting on top of the film.
  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCREEN_HEIGHT * 0.25],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // A hairline chapter rail down the right edge: the one piece of chrome that
  // tells the viewer this is a finite story with an end, not an endless page.
  const railStyle = useAnimatedStyle(() => ({
    height: `${interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [4, 100],
      Extrapolation.CLAMP,
    )}%`,
  }));

  return (
    <>
      {/* Pre-rendered drone-shot frames sit behind everything and never
          intercept touches. */}
      <ScrollytellingSequence scrollY={scrollY} scrollRange={SCROLL_RANGE} />

      {/* The ScrollView is now just the scroll *engine*: empty full-height
          spacers give the drone move its distance and carry the closing CTA.
          The story copy is NOT in here — it rides the pinned overlay below, so
          it reads as a layer of the film rather than text scrolling over it. */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section} />
        ))}

        {/* Closing frame — the drone arrives on the dress as this scrolls in. */}
        <View style={[styles.section, styles.ctaSection]}>
          <AuthCta onJoin={onJoin} onLogin={onLogin} />
        </View>

        <View style={{ height: insets.bottom + spacing.xl }} />
      </Animated.ScrollView>

      {/* Pinned caption layer: each beat jumps in, holds, and jumps out off the
          shared scrollY. pointerEvents:none so the ScrollView underneath still
          takes the drag and the CTA buttons stay tappable. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {SECTIONS.map((section, index) => (
          <RevealText
            key={section.title}
            scrollY={scrollY}
            index={index}
            eyebrow={section.eyebrow}
            title={section.title}
            body={section.body}
          />
        ))}
      </View>

      {/* Chapter rail. */}
      <View style={[styles.rail, { top: insets.top + 100 }]} pointerEvents="none">
        <Animated.View style={[styles.railFill, railStyle]} />
      </View>

      {/* Scroll affordance — a still frame with no visible control reads as a
          splash screen that has hung. */}
      <Animated.View
        style={[styles.scrollHint, { bottom: insets.bottom + spacing.m }, hintStyle]}
        pointerEvents="none"
      >
        <Text style={styles.scrollHintText}>SCROLL</Text>
        <Icon name="chevron-down" size="sm" color={colors.gold} />
      </Animated.View>
    </>
  );
}

/**
 * The logged-in storefront: the proximity-sorted catalogue on the flat obsidian
 * base, with no 3D scene behind it.
 */
function Storefront({ insets, scrollHandler, onOpenProduct }) {
  const products = useStorefrontStore((state) => state.products);
  const loading = useStorefrontStore((state) => state.loading);
  const loaded = useStorefrontStore((state) => state.loaded);
  const error = useStorefrontStore((state) => state.error);
  const load = useStorefrontStore((state) => state.load);

  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    load();
  }, [load]);

  // The category strip is derived from what is actually in stock rather than
  // from a fixed list, so it can never offer a filter that returns nothing.
  const categories = useMemo(() => {
    const seen = new Map();
    for (const product of products) {
      const name = product.category;
      if (!name) continue;
      seen.set(name, (seen.get(name) ?? 0) + 1);
    }
    return [...seen.entries()].map(([name, count]) => ({ name, count }));
  }, [products]);

  const visible = useMemo(
    () => (category === ALL ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

  // Headline numbers for the informatics strip. `distanceKm` is only present
  // once the backend returns a geo-sorted feed, so both stats degrade to a dash
  // rather than rendering "NaN km".
  const stats = useMemo(() => {
    const shops = new Set(products.map((p) => p.storeId).filter(Boolean)).size;
    const distances = products
      .map((p) => p.distanceKm)
      .filter((d) => typeof d === 'number');
    const nearest = distances.length ? Math.min(...distances) : null;
    return { shops, nearest };
  }, [products]);

  const coldLoading = loading && products.length === 0;
  const isEmpty = loaded && !loading && products.length === 0;

  const [spotlight, ...rest] = visible;
  // The spotlight already shows the first piece; repeating it as the first grid
  // tile would read as a duplicate listing.
  const gridData = coldLoading
    ? Array.from({ length: SKELETON_COUNT }, (_, index) => ({ id: `skeleton-${index}` }))
    : rest;

  const header = (
    <View style={styles.storefrontHeader}>
      <Animated.View
        entering={FadeInDown.duration(duration.slow).easing(easing.out)}
        style={styles.intro}
      >
        <View style={styles.liveRow}>
          <LiveDot size={6} color={colors.jade} />
          <Text style={styles.liveText}>LIVE STOCK · NAGPUR</Text>
        </View>

        <Text style={styles.introTitle}>In stock, minutes away.</Text>
        <Text style={styles.introBody}>
          Every piece here is on a rail in a real shop near you — approved, in stock, and
          ready for a rider tonight.
        </Text>
      </Animated.View>

      {!coldLoading && products.length > 0 ? (
        <Surface tone="glass" padding="compact" lift="low" style={styles.statCard}>
          <StatRow>
            <StatTile
              icon="layers"
              value={String(products.length)}
              label={products.length === 1 ? 'piece live' : 'pieces live'}
            />
            <StatTile
              icon="shopping-bag"
              value={String(stats.shops)}
              label={stats.shops === 1 ? 'shop' : 'shops'}
              emphasis="gold"
            />
            <StatTile
              icon="navigation"
              value={stats.nearest !== null ? `${stats.nearest} km` : '—'}
              label="nearest"
              emphasis="jade"
            />
          </StatRow>
        </Surface>
      ) : null}

      {error && products.length > 0 ? (
        <Surface tone="accent" padding="compact" lift="low" style={styles.banner}>
          <View style={styles.bannerRow}>
            <Icon name="wifi-off" size="sm" color={colors.crimsonGlow} />
            <Text style={styles.bannerText}>
              Showing the last catalogue we loaded — {error}
            </Text>
          </View>
        </Surface>
      ) : null}

      {spotlight ? (
        <SpotlightCard product={spotlight} onPress={() => onOpenProduct(spotlight)} />
      ) : null}

      {categories.length > 1 ? (
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}
        >
          <Chip
            label="All"
            count={products.length}
            selected={category === ALL}
            onPress={() => setCategory(ALL)}
          />
          {categories.map(({ name, count }) => (
            <Chip
              key={name}
              label={name}
              count={count}
              selected={category === name}
              onPress={() => setCategory(name)}
            />
          ))}
        </Animated.ScrollView>
      ) : null}

      {gridData.length > 0 ? (
        <SectionHeader
          eyebrow={category === ALL ? 'The rest of the rail' : category}
          title={`${gridData.length} more ${gridData.length === 1 ? 'piece' : 'pieces'}`}
          style={styles.gridHeader}
        />
      ) : null}
    </View>
  );

  const renderItem = useCallback(
    ({ item, index }) =>
      coldLoading ? (
        <ProductCardSkeleton width={GRID_COLUMN_WIDTH} />
      ) : (
        <ProductCard
          product={item}
          index={index}
          width={GRID_COLUMN_WIDTH}
          onPress={() => onOpenProduct(item)}
        />
      ),
    [coldLoading, onOpenProduct],
  );

  return (
    <Animated.FlatList
      data={gridData}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={[
        styles.gridContent,
        {
          // Clears the floating app bar the storefront scrolls under.
          paddingTop: insets.top + 76,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isEmpty ? (
          <EmptyState
            icon={error ? 'wifi-off' : 'inbox'}
            tone={error ? 'error' : 'neutral'}
            title={error ? 'Could not reach the storefront' : 'No listings yet'}
            body={
              error
                ? `${error}. Pull down to try again once you are back on a signal.`
                : 'Newly approved pieces from shops around you land here first. Pull down to check again.'
            }
            actionLabel="Retry"
            onAction={load}
          />
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={loading && products.length > 0}
          onRefresh={load}
          tintColor={colors.platinum}
          colors={[colors.crimsonBright]}
          progressBackgroundColor={colors.charcoal}
        />
      }
      ListFooterComponent={
        !coldLoading && visible.length > 0 ? (
          <Animated.View entering={FadeIn.duration(duration.slow)} style={styles.footer}>
            <BrandMark size={26} />
            <Text style={styles.footerText}>
              {visible.length} {visible.length === 1 ? 'piece' : 'pieces'} within reach ·
              hyper-local since the first shutter
            </Text>
          </Animated.View>
        ) : null
      }
    />
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
  ctaSection: {
    // The CTA reads as the resting frame, so it sits a touch higher than the
    // story cards rather than hard against the bottom edge.
    justifyContent: 'center',
  },

  // Marketing chrome
  rail: {
    position: 'absolute',
    right: spacing.s,
    bottom: spacing.xl * 2,
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(245, 243, 239, 0.08)',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  railFill: {
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.gold,
  },
  scrollHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 2,
  },
  scrollHintText: {
    ...type.eyebrow,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 3,
  },

  // Storefront
  gridContent: {
    paddingHorizontal: GRID_GUTTER,
    flexGrow: 1,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  storefrontHeader: {
    marginBottom: spacing.sm,
  },
  intro: {
    marginBottom: spacing.m,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.xs,
  },
  liveText: {
    ...type.eyebrow,
    color: colors.jade,
    fontSize: 9,
    letterSpacing: 2.4,
  },
  introTitle: {
    ...type.title,
    fontSize: 30,
    lineHeight: 36,
  },
  introBody: {
    ...type.bodySmall,
    marginTop: spacing.s,
  },
  statCard: {
    marginBottom: spacing.m,
  },
  banner: {
    marginBottom: spacing.m,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  bannerText: {
    ...type.caption,
    color: colors.platinum,
    flex: 1,
  },
  categoryScroll: {
    flexGrow: 0,
    marginTop: spacing.m,
    // Bleed the strip to the screen edges so the last chip is clearly cut off,
    // which is what tells the eye the row keeps going.
    marginHorizontal: -GRID_GUTTER,
  },
  categoryRow: {
    gap: spacing.s,
    paddingHorizontal: GRID_GUTTER,
    paddingVertical: spacing.xxs,
  },
  gridHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.s,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    ...type.caption,
    color: colors.slate,
    textAlign: 'center',
    lineHeight: 18,
  },
});
