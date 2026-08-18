import { Dimensions, FlatList, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AuthCta from '../components/AuthCta';
import ProductCard from '../components/ProductCard';
import RevealText from '../components/RevealText';
import ScrollytellingSequence from '../components/ScrollytellingSequence';
import { formatINR } from '../data/mockStores';
import { DEPARTMENTS, departmentCover, sortProducts } from '../shop/catalog';
import { withDistance } from '../shop/distance';
import useCatalog from '../shop/useCatalog';
import useDeliveryLocation from '../hooks/useDeliveryLocation';
import { selectCartCount, selectCartTotal, useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  const { coords, areaLabel, status, refresh } = useDeliveryLocation();
  const cartCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);

  // The scrollytelling is a first-run marketing funnel: it only runs for a
  // visitor who has not signed in. Once there is a session token the home
  // screen is a returning customer's storefront, so the drone shot and the
  // pitch are dropped and the catalogue is shown straight away.
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));

  // The CTA opens the real Firebase login system. "Join now" lands on the
  // sign-up form, "Log in" on the sign-in form — same screen, two entry modes.
  const handleJoin = useCallback(() => {
    navigation.navigate('Auth', { mode: 'signup' });
  }, [navigation]);

  const handleLogin = useCallback(() => {
    navigation.navigate('Auth', { mode: 'signin' });
  }, [navigation]);

  const openProduct = (product) => navigation.navigate('ProductDetail', { product });
  const openShop = () => navigation.navigate('Shop');
  const openDepartment = (dept) =>
    navigation.navigate('ProductList', { department: dept.key, title: dept.label });
  const openSearch = (q) =>
    navigation.navigate('ProductList', q ? { query: q, title: `“${q}”` } : { title: 'All' });

  const header = (
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

      <View style={styles.headerRight}>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Profile and settings"
          style={({ pressed }) => [styles.profileButton, pressed && styles.bagPressed]}
        >
          <Text style={styles.profileGlyph}>◇</Text>
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

  if (isLoggedIn) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <Storefront
          insets={insets}
          coords={coords}
          onOpenProduct={openProduct}
          onOpenShop={openShop}
          onOpenDepartment={openDepartment}
          onSearch={openSearch}
        />
        {header}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <MarketingScrollytelling
        insets={insets}
        onJoin={handleJoin}
        onLogin={handleLogin}
      />
      {header}
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
    </>
  );
}

/**
 * The logged-in storefront: the proximity-sorted catalogue on the flat obsidian
 * base, with no 3D scene behind it.
 */
function Storefront({ insets, coords, onOpenProduct, onOpenShop, onOpenDepartment, onSearch }) {
  const [query, setQuery] = useState('');
  const { products, source } = useCatalog();

  // Live "nearest to you": distance from the shopper's GPS to each shop, nearest
  // first. Falls back gracefully — products with no store location just sort last.
  const nearest = sortProducts(withDistance(products, coords), 'proximity').slice(0, 12);
  const storeCount = new Set(products.map((p) => p.storeName).filter(Boolean)).size;

  return (
    <Animated.ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, styles.storefront]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Search — the fastest path to a specific piece. */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for shirts, dresses, watches…"
          placeholderTextColor={colors.slate}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => onSearch(query.trim())}
          returnKeyType="search"
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => onSearch(query.trim())}
          accessibilityRole="button"
          accessibilityLabel="Search products"
          style={styles.searchGo}
        >
          <Text style={styles.searchGoLabel}>GO</Text>
        </Pressable>
      </View>

      {/* Shop by department — the entry into the full filtered catalogue. */}
      <View style={styles.feed}>
        <View style={styles.deptHead}>
          <Text style={styles.feedEyebrow}>SHOP BY DEPARTMENT</Text>
          <Pressable onPress={onOpenShop} hitSlop={spacing.xs}>
            <Text style={styles.deptLink}>Browse all →</Text>
          </Pressable>
        </View>

        <FlatList
          data={DEPARTMENTS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const cover = departmentCover(item.key, products);
            return (
              <Pressable
                onPress={() => onOpenDepartment(item)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }) => [styles.deptTile, pressed && styles.deptTilePressed]}
              >
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.deptImage} contentFit="cover" transition={200} />
                ) : (
                  <View style={[styles.deptImage, styles.deptFallback]} />
                )}
                <View style={styles.deptScrim} pointerEvents="none" />
                <Text style={styles.deptLabel}>{item.label}</Text>
              </Pressable>
            );
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.feedList}
        />
      </View>

      <View style={[styles.feed, styles.feedSpaced]}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedEyebrow}>NEAREST TO YOU</Text>
          <Text style={styles.feedTitle}>In stock, minutes away.</Text>
          <Text style={styles.feedBody}>
            Sorted by distance from where you are standing, not by who paid for
            placement.
          </Text>
        </View>

        <FlatList
          data={nearest}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => onOpenProduct(item)} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.feedList}
          initialNumToRender={5}
        />

        <Pressable onPress={onOpenShop} style={styles.browseAll}>
          <Text style={styles.browseAllLabel}>BROWSE THE FULL CATALOGUE</Text>
        </Pressable>

        <Text style={styles.feedFootnote}>
          {products.length} pieces across {storeCount || 5} independent Nagpur stores
          {source === 'sample' ? '  ·  sample catalogue' : ''}.
        </Text>
      </View>

      <View style={{ height: insets.bottom + spacing.xl * 2 }} />
    </Animated.ScrollView>
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
  storefront: {
    // Clears the floating header the storefront scrolls under.
    paddingTop: SCREEN_HEIGHT * 0.14,
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

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.obsidian,
  },
  searchInput: {
    flex: 1,
    color: colors.ivory,
    fontSize: 15,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
  },
  searchGo: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.crimsonBright,
  },
  searchGoLabel: {
    color: colors.ivory,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Feed
  feed: {
    paddingTop: spacing.lg,
    // Opaque base so the 3D canvas stops showing through once the story ends.
    backgroundColor: colors.obsidian,
  },
  feedSpaced: {
    paddingTop: spacing.md,
  },
  feedHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  deptHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  deptLink: {
    color: colors.gold,
    fontSize: 12,
  },
  deptTile: {
    width: 128,
    height: 92,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginRight: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    justifyContent: 'flex-end',
  },
  deptTilePressed: {
    opacity: 0.82,
  },
  deptImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  deptFallback: {
    backgroundColor: colors.charcoalLight,
  },
  deptScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,6,0.4)',
  },
  deptLabel: {
    color: colors.ivory,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    padding: spacing.sm,
  },
  browseAll: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
  },
  browseAllLabel: {
    color: colors.platinum,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
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
    ...StyleSheet.absoluteFill,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileGlyph: {
    color: colors.platinum,
    fontSize: 14,
    lineHeight: 17,
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
