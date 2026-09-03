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
import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
  FadeInDown,
  ReduceMotion,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AuthCta from '../components/AuthCta';
import PressableScale from '../components/PressableScale';
import ProductCard from '../components/ProductCard';
import RevealText from '../components/RevealText';
import ScrollytellingSequence from '../components/ScrollytellingSequence';
import StorefrontBoutiquesList from '../components/StorefrontBoutiquesList';
import StorefrontFilterPills from '../components/StorefrontFilterPills';
import StorefrontHeader from '../components/StorefrontHeader';
import StorefrontSpotlightCard from '../components/StorefrontSpotlightCard';
import StorefrontTabBar from '../components/StorefrontTabBar';
import useDeliveryLocation from '../hooks/useDeliveryLocation';
import useStorefrontStore from '../store/useStorefrontStore';
import { selectCartCount, useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { EASE_OUT, duration } from '../theme/motion';
import { colors, spacing } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Storefront first-view entrance. The header title precipitates in, then the
// rail of cards a beat later — a short cascade the returning customer sees once
// per open, not motion they pay for on every scroll.
const FEED_HEADER_ENTER = FadeInDown.duration(duration.enter)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
const FEED_LIST_ENTER = FadeInDown.duration(duration.enter)
  .delay(90)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);

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

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [guestExplore, setGuestExplore] = useState(false);

  const { areaLabel, status, refresh } = useDeliveryLocation();
  const cartCount = useCartStore(selectCartCount);
  const addToCart = useCartStore((state) => state.addToCart);

  // The returning customer check: if we already have an active session, this
  // screen is a returning customer's storefront, so the drone shot and the
  // pitch are dropped and the catalogue is shown straight away.
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const showStorefront = isLoggedIn || guestExplore;

  // The CTA splits sign-up from sign-in: "Join Now" opens the Auth screen in
  // register mode, "Log in" in sign-in mode. The Firebase session, once
  // established, flips this screen to the storefront via the auth store.
  const openAuth = useCallback(
    (mode) => navigation.navigate('Auth', { mode }),
    [navigation]
  );

  const openProduct = (product) => navigation.navigate('ProductDetail', { product });
  const openBag = () => navigation.navigate('Cart');
  const openProfile = () => (isLoggedIn ? navigation.navigate('Profile') : openAuth('signin'));

  if (showStorefront) {
    return (
      <View style={styles.storefrontRoot}>
        <StatusBar barStyle="dark-content" />
        <Storefront
          insets={insets}
          areaLabel={areaLabel}
          status={status}
          onSelectLocation={status === 'denied' ? refresh : undefined}
          onOpenProduct={openProduct}
          onOpenProfile={openProfile}
          onOpenBag={openBag}
          cartCount={cartCount}
          onQuickAdd={(product) => addToCart(product)}
          onNavigateOrders={() => (isLoggedIn ? navigation.navigate('Profile') : openAuth('signin'))}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <MarketingScrollytelling
        insets={insets}
        onJoin={() => openAuth('register')}
        onLogin={() => openAuth('signin')}
        onExploreGuest={() => setGuestExplore(true)}
      />
    </View>
  );
}

/**
 * The logged-out cinematic pitch: the 3D drone shot behind a stack of glass
 * story cards, closing on the sign-up CTA.
 */
function MarketingScrollytelling({ insets, onJoin, onLogin, onExploreGuest }) {
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
          <AuthCta
            onJoin={onJoin}
            onLogin={onLogin}
            onExploreGuest={onExploreGuest}
          />
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
 * The Apple Glass storefront: Ivory Studio Luxury aesthetic directly based on
 * Stitch Screen 3d6d813c978a4d408e4911aa14703b08.
 */
function Storefront({
  insets,
  areaLabel,
  onSelectLocation,
  onOpenProduct,
  onOpenProfile,
  onOpenBag,
  cartCount,
  onQuickAdd,
  onNavigateOrders,
}) {
  const products = useStorefrontStore((state) => state.products);
  const loading = useStorefrontStore((state) => state.loading);
  const loaded = useStorefrontStore((state) => state.loaded);
  const error = useStorefrontStore((state) => state.error);
  const load = useStorefrontStore((state) => state.load);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    load();
  }, [load]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    const cat = selectedCategory.toLowerCase();
    return products.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      if (cat === 'silks') {
        return (
          pCat.includes('silk') ||
          pCat.includes('sari') ||
          pCat.includes('kurta') ||
          pName.includes('silk') ||
          pName.includes('angrakha')
        );
      }
      if (cat === 'evening') {
        return (
          pCat.includes('evening') ||
          pCat.includes('dress') ||
          pName.includes('dress') ||
          pName.includes('gown')
        );
      }
      if (cat === 'linen') {
        return (
          pCat.includes('linen') ||
          pCat.includes('co-ord') ||
          pName.includes('linen') ||
          pName.includes('coord')
        );
      }
      if (cat === 'festive') {
        return (
          pCat.includes('festive') ||
          pCat.includes('lehenga') ||
          pName.includes('festive') ||
          pName.includes('zardozi')
        );
      }
      return true;
    });
  }, [products, selectedCategory]);

  const spotlightProduct = products[0] || null;

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'bag') {
      onOpenBag?.();
    } else if (tabId === 'orders') {
      onNavigateOrders?.();
    }
  };

  const isEmpty = loaded && !loading && products.length === 0;

  return (
    <View style={styles.storefrontRoot}>
      {/* 1. Apple Glass Pinned Header */}
      <StorefrontHeader
        insets={insets}
        areaLabel={areaLabel}
        onSelectLocation={onSelectLocation}
        onOpenProfile={onOpenProfile}
        onOpenBag={onOpenBag}
        cartCount={cartCount}
      />

      {/* 2. Scrollable Commerce Feed */}
      <Animated.ScrollView
        style={styles.storefrontScroll}
        contentContainerStyle={[
          styles.storefrontContent,
          {
            paddingTop: insets.top + 58,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.accentCrimson}
          />
        }
      >
        {/* Apple Minimal Banner */}
        <Animated.View style={styles.heroBanner} entering={FEED_HEADER_ENTER}>
          <View style={styles.bannerEyebrowRow}>
            <Text style={styles.bannerEyebrowIcon}>✦</Text>
            <Text style={styles.bannerEyebrow}>NAGPUR RAPID CONCIERGE</Text>
          </View>
          <Text style={styles.bannerTitle}>In stock, minutes away.</Text>
          <Text style={styles.bannerSubtitle}>
            Curated designer garments from local ateliers, delivered to your
            doorstep in 15–40 minutes.
          </Text>
        </Animated.View>

        {/* Category Filters (Horizontal Apple Glass Pills) */}
        <StorefrontFilterPills
          selectedId={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Hero Spotlight Garment Card */}
        <StorefrontSpotlightCard
          product={spotlightProduct}
          onPress={onOpenProduct}
          onBagNow={onQuickAdd}
        />

        {/* Rapid Dispatch Horizontal Rail (Under 45 Minutes Away) */}
        <View style={styles.railSection}>
          <View style={styles.railHeaderRow}>
            <View>
              <Text style={styles.railEyebrow}>RAPID DISPATCH</Text>
              <Text style={styles.railTitle}>Under 45 Minutes Away</Text>
            </View>
            <PressableScale
              onPress={() => setSelectedCategory('all')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Text style={styles.viewAllArrow}>→</Text>
            </PressableScale>
          </View>

          {loading && !products.length ? (
            <ActivityIndicator
              color={colors.accentCrimson}
              style={styles.loader}
            />
          ) : isEmpty ? (
            <Text style={styles.emptyText}>
              {error
                ? `Could not load catalogue: ${error}`
                : 'No listings currently available in this radius.'}
            </Text>
          ) : (
            <Animated.View entering={FEED_LIST_ENTER}>
              <FlatList
                data={filteredProducts.length > 0 ? filteredProducts : products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    onPress={() => onOpenProduct(item)}
                    onQuickAdd={onQuickAdd}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.railList}
                initialNumToRender={5}
              />
            </Animated.View>
          )}
        </View>

        {/* Stores Curating in Nagpur */}
        <StorefrontBoutiquesList onSelectBoutique={onOpenProduct} />
      </Animated.ScrollView>

      {/* 3. Floating Frosted Glass Bottom Navigation Bar */}
      <StorefrontTabBar
        insets={insets}
        activeTab={activeTab}
        cartCount={cartCount}
        onSelectTab={handleTabSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  storefrontRoot: {
    flex: 1,
    backgroundColor: colors.groundBase,
  },
  storefrontScroll: {
    flex: 1,
  },
  storefrontContent: {
    backgroundColor: colors.groundBase,
  },
  heroBanner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.xs,
  },
  bannerEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  bannerEyebrowIcon: {
    color: colors.accentGold,
    fontSize: 12,
  },
  bannerEyebrow: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: colors.textObsidian,
    fontSize: 30,
    fontWeight: '400',
    letterSpacing: -0.4,
    lineHeight: 36,
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: colors.textSlate,
    fontSize: 13,
    lineHeight: 19,
  },
  railSection: {
    marginTop: spacing.xl,
  },
  railHeaderRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  railEyebrow: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  railTitle: {
    color: colors.textObsidian,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    color: colors.accentCrimson,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  viewAllArrow: {
    color: colors.accentCrimson,
    fontSize: 12,
    fontWeight: '700',
  },
  railList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textAsh,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.md,
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
    justifyContent: 'center',
  },
});
