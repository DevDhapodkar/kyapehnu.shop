import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

import { MaterialIcons } from '@expo/vector-icons';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import WelcomeScreen from './WelcomeScreen';
import AuthCta from '../components/AuthCta';
import PressableScale from '../components/PressableScale';
import RevealText from '../components/RevealText';
import ScrollytellingSequence from '../components/ScrollytellingSequence';
import StorefrontAmbientBoutiquesList from '../components/StorefrontAmbientBoutiquesList';
import StorefrontAmbientFilterPills from '../components/StorefrontAmbientFilterPills';
import StorefrontAmbientHeader from '../components/StorefrontAmbientHeader';
import StorefrontAmbientProductCard from '../components/StorefrontAmbientProductCard';
import StorefrontAmbientSpotlightCard from '../components/StorefrontAmbientSpotlightCard';
import StorefrontAmbientTabBar from '../components/StorefrontAmbientTabBar';
import useDeliveryLocation from '../hooks/useDeliveryLocation';
import { useStorefrontStore } from '../store/useStorefrontStore';
import { selectCartCount, useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { getDeliveryPillLabel, getUserInitials } from '../utils/deliveryPillLabel';
import { EASE_OUT, duration } from '../theme/motion';
import { colors, radii, spacing } from '../theme/colors';

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
  const guestExplore = useStorefrontStore((state) => state.guestExplore);
  const setGuestExplore = useStorefrontStore((state) => state.setGuestExplore);

  const cartCount = useCartStore(selectCartCount);
  const addToCart = useCartStore((state) => state.addToCart);

  // The returning customer check: if we already have an active session, this
  // screen is a returning customer's storefront, so the drone shot and the
  // pitch are dropped and the catalogue is shown straight away.
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  // GPS still resolves for proximity sorting inside the hook; the pill never
  // invents a neighbourhood — only a saved doorstep address counts.
  useDeliveryLocation();
  const areaLabel = getDeliveryPillLabel({
    savedAddresses: profile?.savedAddresses,
  });
  const avatarUri = user?.photoURL || null;
  const initials = getUserInitials({
    name: profile?.name || user?.displayName,
    email: profile?.email || user?.email,
  });
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
          avatarUri={avatarUri}
          initials={initials}
          isSignedIn={isLoggedIn}
          onSelectLocation={() => navigation.navigate('Address')}
          onOpenProduct={openProduct}
          onOpenProfile={openProfile}
          onOpenBag={openBag}
          cartCount={cartCount}
          onQuickAdd={(product) => addToCart(product)}
          onNavigateOrders={() => (isLoggedIn ? navigation.navigate('MyOrders') : openAuth('signin'))}
          onViewStory={() => setGuestExplore(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <WelcomeScreen
        navigation={navigation}
        onGetStarted={() => openAuth('register')}
        onSignIn={() => openAuth('signin')}
        onExploreGuest={() => setGuestExplore(true)}
        onRegisterShop={() => navigation.navigate('VendorRegister')}
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

      {/* Top Floating Pill to Skip Straight into Storefront */}
      <View
        style={[
          styles.skipToStorefrontWrap,
          { top: insets.top + 8 },
        ]}
        pointerEvents="box-none"
      >
        <PressableScale
          onPress={onExploreGuest}
          style={styles.skipToStorefrontBtn}
          accessibilityRole="button"
          accessibilityLabel="Enter Storefront"
        >
          <Text style={styles.skipToStorefrontText}>
            Storefront
          </Text>
          <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
        </PressableScale>
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
  avatarUri,
  initials,
  isSignedIn,
  onSelectLocation,
  onOpenProduct,
  onOpenProfile,
  onOpenBag,
  cartCount,
  onQuickAdd,
  onNavigateOrders,
  onViewStory,
}) {
  const products = useStorefrontStore((state) => state.products);
  const loading = useStorefrontStore((state) => state.loading);
  const loaded = useStorefrontStore((state) => state.loaded);
  const error = useStorefrontStore((state) => state.error);
  const load = useStorefrontStore((state) => state.load);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectBoutique = (boutique) => {
    setSelectedBoutique((prev) => (prev === boutique.name ? null : boutique.name));
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedBoutique) {
      list = list.filter((p) => {
        const brand = (p.brand || '').toLowerCase();
        const store = (p.storeName || '').toLowerCase();
        const needle = selectedBoutique.toLowerCase();
        return brand.includes(needle) || store.includes(needle);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const pName = (p.name || '').toLowerCase();
        const pBrand = (p.brand || '').toLowerCase();
        const pStore = (p.storeName || '').toLowerCase();
        const pMat = (p.material || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        return (
          pName.includes(q) ||
          pBrand.includes(q) ||
          pStore.includes(q) ||
          pMat.includes(q) ||
          pDesc.includes(q) ||
          pCat.includes(q)
        );
      });
    }

    if (selectedCategory === 'all') return list;
    const cat = selectedCategory.toLowerCase();
    return list.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      const pSub = (p.subCategory || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      const pGender = (p.gender || '').toLowerCase();
      const pMat = (p.material || '').toLowerCase();

      if (cat === 'women') {
        return (
          pGender === 'women' ||
          pCat.includes('women') ||
          pSub.includes('women') ||
          pName.includes('angrakha') ||
          pName.includes('co-ord') ||
          pName.includes('saree') ||
          pName.includes('anarkali') ||
          pName.includes('dress') ||
          pName.includes('slip')
        );
      }
      if (cat === 'men') {
        return (
          pGender === 'men' ||
          pCat.includes('men') ||
          pSub.includes('men') ||
          pName.includes('kurta') ||
          pName.includes('waistcoat') ||
          pName.includes('shirt')
        );
      }
      if (cat === 'tops') {
        return (
          pSub.includes('top') ||
          pSub.includes('tee') ||
          pName.includes('tee') ||
          pName.includes('co-ord') ||
          pName.includes('angrakha') ||
          pCat.includes('top')
        );
      }
      if (cat === 'shirts') {
        return (
          pSub.includes('shirt') ||
          pName.includes('shirt') ||
          pName.includes('waistcoat') ||
          pName.includes('overshirt') ||
          pCat.includes('shirt')
        );
      }
      if (cat === 'drapes') {
        return (
          pSub.includes('drape') ||
          pSub.includes('saree') ||
          pName.includes('saree') ||
          pName.includes('angrakha') ||
          pCat.includes('silk')
        );
      }
      if (cat === 'silks') {
        return (
          pCat.includes('silk') ||
          pMat.includes('silk') ||
          pName.includes('silk') ||
          pSub.includes('silk') ||
          pName.includes('angrakha') ||
          pName.includes('kurta') ||
          pName.includes('waistcoat') ||
          pName.includes('saree')
        );
      }
      if (cat === 'evening') {
        return (
          pCat.includes('evening') ||
          pName.includes('angrakha') ||
          pName.includes('waistcoat') ||
          pName.includes('slip') ||
          pName.includes('shirt')
        );
      }
      if (cat === 'linen') {
        return (
          pCat.includes('linen') ||
          pMat.includes('linen') ||
          pName.includes('linen') ||
          pSub.includes('linen') ||
          pName.includes('co-ord')
        );
      }
      if (cat === 'festive') {
        return (
          pCat.includes('festive') ||
          pMat.includes('zardozi') ||
          pMat.includes('zari') ||
          pName.includes('anarkali') ||
          pName.includes('saree') ||
          pName.includes('waistcoat') ||
          pName.includes('festive') ||
          pName.includes('angrakha') ||
          pName.includes('kurta')
        );
      }
      return true;
    });
  }, [products, selectedCategory, selectedBoutique, searchQuery]);

  const spotlightProduct = products[0] || null;

  const railProducts = useMemo(() => {
    if (!searchQuery && selectedCategory === 'all') {
      return filteredProducts.filter((p) => p.id !== spotlightProduct?.id);
    }
    return filteredProducts;
  }, [filteredProducts, searchQuery, selectedCategory, spotlightProduct]);

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'bag') {
      onOpenBag?.();
    } else if (tabId === 'orders') {
      onNavigateOrders?.();
    } else if (tabId === 'search') {
      setIsSearchOpen(true);
    } else if (tabId === 'explore') {
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isEmpty = loaded && !loading && products.length === 0;

  return (
    <View style={styles.storefrontRoot}>
      {/* Floating Ambient Gradient Orbs for Frosted Glass Refraction */}
      <AmbientBackgroundBlobs />

      {/* 1. Floating Frosted Glass Capsule Header */}
      <StorefrontAmbientHeader
        insets={insets}
        areaLabel={areaLabel}
        onSelectLocation={onSelectLocation}
        onOpenProfile={onOpenProfile}
        onViewStory={onViewStory}
        avatarUri={avatarUri}
        initials={initials}
        isSignedIn={isSignedIn}
      />

      {/* 2. Scrollable Commerce Feed */}
      <Animated.ScrollView
        style={styles.storefrontScroll}
        contentContainerStyle={[
          styles.storefrontContent,
          {
            paddingTop: insets.top + 70,
            paddingBottom: insets.bottom + 96,
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
        {/* Streamlined Apple-Style Header Banner (Decluttered, Matching Stitch) */}
        <Animated.View style={styles.heroBanner} entering={FEED_HEADER_ENTER}>
          <View style={styles.bannerEyebrowRow}>
            <MaterialIcons name="bolt" size={14} color={colors.accentGold} />
            <Text style={styles.bannerEyebrow}>NAGPUR EXPRESS</Text>
          </View>
          <Text style={styles.bannerTitle}>In stock, near you</Text>
        </Animated.View>

        {/* Real-time Frosted Glass Search Bar */}
        {(isSearchOpen || activeTab === 'search' || searchQuery.length > 0) && (
          <View style={styles.searchBarWrap}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={18} color={colors.accentGold} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search silhouettes, silks, boutiques in Nagpur..."
                placeholderTextColor={colors.textAsh}
                style={styles.searchInput}
                autoFocus={isSearchOpen}
                returnKeyType="search"
              />
              {searchQuery ? (
                <PressableScale onPress={() => setSearchQuery('')} hitSlop={8}>
                  <MaterialIcons name="close" size={17} color={colors.textAsh} />
                </PressableScale>
              ) : null}
            </View>
            {searchQuery ? (
              <View style={styles.searchNoticeRow}>
                <Text style={styles.searchNoticeText}>
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
                </Text>
                <PressableScale onPress={() => setSearchQuery('')}>
                  <Text style={styles.resetSearchText}>Clear</Text>
                </PressableScale>
              </View>
            ) : null}
          </View>
        )}

        {/* Frosted Glass Filter Pill Rails */}
        <StorefrontAmbientFilterPills
          selectedId={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Search empty state if query has no matches */}
        {searchQuery && filteredProducts.length === 0 ? (
          <View style={styles.emptySearchCard}>
            <MaterialIcons name="search-off" size={36} color={colors.accentGold} />
            <Text style={styles.emptySearchTitle}>No Pieces Found</Text>
            <Text style={styles.emptySearchSubtitle}>
              {`No garments match "${searchQuery}" in this radius.`}
            </Text>
            <PressableScale
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedBoutique(null);
              }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Clear Search & Filters</Text>
            </PressableScale>
          </View>
        ) : (
          <>
            {/* Hero Spotlight Garment Card: Hidden while actively searching */}
            {!searchQuery && spotlightProduct ? (
              <StorefrontAmbientSpotlightCard
                product={spotlightProduct}
                onPress={onOpenProduct}
                onBagNow={onQuickAdd}
              />
            ) : null}

            {/* Horizontal Scroll Rail: Express Ateliers (Under 45 Minutes) */}
            <View style={styles.railSection}>
              <View style={styles.railHeaderRow}>
                <Text style={styles.railTitle}>
                  {searchQuery ? 'Matching Pieces' : 'Under 45 Minutes'}
                </Text>
                <PressableScale
                  onPress={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  style={styles.viewAllBtn}
                >
                  <Text style={styles.viewAllText}>
                    {searchQuery ? 'Reset' : 'View All'}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={16}
                    color={colors.accentCrimson}
                  />
                </PressableScale>
              </View>

              {loading && !products.length ? (
                <ActivityIndicator
                  color={colors.accentCrimson}
                  style={styles.loader}
                />
              ) : isEmpty ? (
                <View style={styles.emptyCatalogueCard}>
                  <View style={styles.emptyCatalogueIconCircle}>
                    <MaterialIcons name="storefront" size={26} color={colors.accentCrimson} />
                  </View>
                  <Text style={styles.emptyCatalogueTitle}>
                    {error ? 'Catalogue Connection' : 'Nagpur Collections Updating'}
                  </Text>
                  <Text style={styles.emptyCatalogueDesc}>
                    {error
                      ? `Atelier feed connection note: ${error}. Tap below to reconnect.`
                      : 'Sitabuldi & Dharampeth boutiques are cataloguing their daily handloom arrivals. Check back shortly or tap to refresh.'}
                  </Text>
                  <PressableScale
                    onPress={load}
                    style={styles.emptyCatalogueBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh Nagpur Catalogue"
                  >
                    <MaterialIcons name="refresh" size={15} color="#FFFFFF" />
                    <Text style={styles.emptyCatalogueBtnText}>Refresh Catalogue</Text>
                  </PressableScale>
                </View>
              ) : (
                <Animated.View entering={FEED_LIST_ENTER}>
                  <FlatList
                    data={railProducts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <StorefrontAmbientProductCard
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
          </>
        )}

        {/* Curating Boutiques Section (Decluttered Frosted Glass) */}
        <StorefrontAmbientBoutiquesList
          onSelectBoutique={handleSelectBoutique}
          selectedBoutiqueId={selectedBoutique}
        />
      </Animated.ScrollView>

      {/* 3. Frosted Glass Floating Tab Bar */}
      <StorefrontAmbientTabBar
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
    backgroundColor: '#FAF9F5',
  },
  storefrontRoot: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  storefrontScroll: {
    flex: 1,
  },
  storefrontContent: {
    backgroundColor: 'transparent',
  },
  heroBanner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  bannerEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bannerEyebrowIcon: {
    color: colors.accentGold,
    fontSize: 14,
  },
  bannerEyebrow: {
    color: colors.accentGold,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: colors.textObsidian,
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: -0.4,
    lineHeight: 38,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', 'Playfair Display', Georgia, serif",
    }),
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: colors.textSlate,
    fontSize: 13,
    lineHeight: 19,
  },
  railSection: {
    marginTop: 28,
  },
  railHeaderRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
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
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    color: colors.accentCrimson,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.0,
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
  emptyCatalogueCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
  emptyCatalogueIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(196, 36, 58, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyCatalogueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textObsidian,
    textAlign: 'center',
    letterSpacing: -0.2,
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  emptyCatalogueDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 8,
  },
  emptyCatalogueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    backgroundColor: colors.accentCrimson,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  emptyCatalogueBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  skipToStorefrontWrap: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 999,
  },
  skipToStorefrontBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipToStorefrontText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  storyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  storyPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.accentGoldDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  searchBarWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textObsidian,
    paddingVertical: 0,
  },
  searchNoticeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: 6,
  },
  searchNoticeText: {
    fontSize: 11.5,
    color: colors.textSlate,
    fontWeight: '500',
  },
  resetSearchText: {
    fontSize: 11,
    color: colors.accentCrimson,
    fontWeight: '600',
  },
  emptySearchCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.lg,
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  emptySearchSubtitle: {
    fontSize: 12.5,
    color: colors.textSlate,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    backgroundColor: colors.accentCrimson,
  },
  resetBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
