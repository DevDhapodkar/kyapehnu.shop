import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AuthCta from '../components/AuthCta';
import ProductCard from '../components/ProductCard';
import RevealText from '../components/RevealText';
import ScrollytellingSequence from '../components/ScrollytellingSequence';
import HeroPanel from '../components/storefront/HeroPanel';
import StatStrip from '../components/storefront/StatStrip';
import StorefrontHeader from '../components/storefront/StorefrontHeader';
import { EmptyState, SectionHeader, SegmentedTabs, TabDock } from '../components/ui';
import { CUSTOMER_TABS, useTabNavigation } from '../navigation/customerTabs';
import useDeliveryLocation from '../hooks/useDeliveryLocation';
import useStorefrontStore from '../store/useStorefrontStore';
import { selectCartCount, useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Height the storefront must clear to scroll out from under the floating header. */
const HEADER_CLEARANCE = 118;
/** Height the dock covers at the foot of every scrolling customer screen. */
const DOCK_CLEARANCE = 96;

const ALL = '__all__';

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

/** "WOMEN" → "Women"; anything already mixed-case is left alone. */
const toTabLabel = (value) =>
  value === value.toUpperCase() ? value.charAt(0) + value.slice(1).toLowerCase() : value;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const { areaLabel, status, refresh } = useDeliveryLocation();
  const cartCount = useCartStore(selectCartCount);

  // The header's search pill filters the grid in place rather than opening a
  // screen of its own: the catalogue is one city's worth of stock, so a live
  // filter over what is already loaded answers the query faster than a round
  // trip would.
  const [query, setQuery] = useState('');

  // The scrollytelling is a first-run marketing funnel: it only runs for a
  // visitor who has not signed in. Once there is a session token the home
  // screen is a returning customer's storefront, so the drone shot and the
  // pitch are dropped and the catalogue is shown straight away.
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const userName = useAuthStore((state) => state.user?.displayName ?? state.user?.email);

  // The CTA splits sign-up from sign-in: "Join Now" opens the Auth screen in
  // register mode, "Log in" in sign-in mode. The Firebase session, once
  // established, flips this screen to the storefront via the auth store.
  const openAuth = useCallback((mode) => navigation.navigate('Auth', { mode }), [navigation]);

  const openProduct = useCallback(
    (product) => navigation.navigate('ProductDetail', { product }),
    [navigation]
  );

  const onTabChange = useTabNavigation(navigation, 'home');

  const header = (
    <StorefrontHeader
      areaLabel={areaLabel}
      locationStatus={status}
      onRefreshLocation={refresh}
      cartCount={cartCount}
      userName={userName}
      onOpenCart={() => navigation.navigate('Cart')}
      onOpenProfile={() => navigation.navigate('Profile')}
      query={query}
      onQueryChange={isLoggedIn ? setQuery : undefined}
      topInset={insets.top}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {isLoggedIn ? (
        <>
          <Storefront insets={insets} query={query} onOpenProduct={openProduct} />
          {header}
          <TabDock items={CUSTOMER_TABS} value="home" onChange={onTabChange} />
        </>
      ) : (
        <>
          <MarketingScrollytelling
            insets={insets}
            onJoin={() => openAuth('register')}
            onLogin={() => openAuth('signin')}
          />
          {header}
        </>
      )}
    </View>
  );
}

/**
 * The logged-out cinematic pitch: the 3D drone shot behind a stack of glass
 * story cards, closing on the sign-up CTA.
 */
function MarketingScrollytelling({ insets, onJoin, onLogin }) {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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
    </>
  );
}

/**
 * The logged-in storefront: a hero panel, a figures band, and the
 * proximity-sorted catalogue as a two-column bento grid.
 *
 * The grid is the list — the hero and the tabs ride in `ListHeaderComponent`
 * rather than in a ScrollView wrapping a FlatList, so the catalogue keeps its
 * virtualisation however long it gets.
 */
function Storefront({ insets, query, onOpenProduct }) {
  const products = useStorefrontStore((state) => state.products);
  const loading = useStorefrontStore((state) => state.loading);
  const loaded = useStorefrontStore((state) => state.loaded);
  const error = useStorefrontStore((state) => state.error);
  const load = useStorefrontStore((state) => state.load);

  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = useMemo(() => {
    const seen = [];
    for (const product of products) {
      if (product.category && !seen.includes(product.category)) seen.push(product.category);
    }

    return [
      { key: ALL, label: 'All' },
      ...seen.map((value) => ({ key: value, label: toTabLabel(value) })),
    ];
  }, [products]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return products.filter((product) => {
      if (category !== ALL && product.category !== category) return false;
      if (!needle) return true;

      // Name, shop and category are the three things a buyer actually types.
      return [product.name, product.storeName, product.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle));
    });
  }, [products, category, query]);

  const stats = useMemo(() => {
    const shops = new Set(products.map((p) => p.storeId).filter(Boolean)).size;

    return [
      { value: String(products.length), label: 'Pieces live near you' },
      { value: String(shops), label: shops === 1 ? 'Shop open now' : 'Shops open now' },
      { value: '< 1 hr', label: 'Door to door' },
    ];
  }, [products]);

  const hero = products[0] ?? null;
  const isEmpty = loaded && !loading && products.length === 0;

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      numColumns={2}
      style={styles.scroll}
      columnWrapperStyle={styles.column}
      contentContainerStyle={[
        styles.gridContent,
        { paddingBottom: insets.bottom + DOCK_CLEARANCE },
      ]}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={load}
          tintColor={colors.platinum}
          colors={[colors.platinum]}
          progressBackgroundColor={colors.surface}
          progressViewOffset={HEADER_CLEARANCE}
        />
      }
      renderItem={({ item }) => (
        <ProductCard product={item} onPress={() => onOpenProduct(item)} style={styles.tile} />
      )}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <HeroPanel product={hero} onOpen={() => hero && onOpenProduct(hero)} />

          {products.length ? <StatStrip items={stats} style={styles.stats} /> : null}

          {products.length ? (
            <>
              <SectionHeader
                eyebrow="The feed"
                title="Closest first."
                caption="Ranked by how far the rail is from your door, never by who paid."
                style={styles.sectionHeader}
              />

              {tabs.length > 1 ? (
                <SegmentedTabs
                  options={tabs}
                  value={category}
                  onChange={setCategory}
                  scrollable={tabs.length > 3}
                  style={styles.tabs}
                />
              ) : null}
            </>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        loading && !loaded ? (
          <ActivityIndicator color={colors.platinum} style={styles.loader} />
        ) : isEmpty ? (
          <EmptyState
            glyph="◇"
            title={error ? 'Storefront unavailable' : 'Nothing live yet'}
            body={
              error
                ? `${error}. Pull down to try again.`
                : 'Newly approved pieces from local shops land here the moment a shop lists them.'
            }
          />
        ) : (
          <Text style={styles.filterEmpty}>
            {query.trim()
              ? `Nothing matching “${query.trim()}” nearby.`
              : 'Nothing in this category right now — try another.'}
          </Text>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.transparent,
  },

  // Marketing scrollytelling
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

  // Storefront grid
  gridContent: {
    paddingHorizontal: spacing.md,
    // Clears the floating header the storefront scrolls under.
    paddingTop: HEADER_CLEARANCE,
    backgroundColor: colors.ink,
  },
  headerBlock: {
    marginBottom: spacing.md,
  },
  stats: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    marginTop: spacing.lg,
  },
  tabs: {
    marginTop: spacing.sm + 2,
  },
  column: {
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  loader: {
    paddingVertical: spacing.xl,
  },
  filterEmpty: {
    ...typography.body,
    color: colors.ash,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
