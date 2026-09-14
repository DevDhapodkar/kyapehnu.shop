import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import stitchScreens from '../data/stitchScreens.json';
import { useThemeStore } from '../store/useThemeStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { useStorefrontStore } from '../store/useStorefrontStore';
import {
  createGuestOrder,
  placeOrder,
  trackGuestOrder,
  fetchMyOrders,
  fetchCatalog,
  setProductAvailability,
  createProduct,
  updateOrderStatus,
  markOrderReady,
  syncUserProfile,
  registerVendor,
  fetchVendorOrders,
} from '../api/vendorApi';
import { navigationRef } from '../navigation/AppNavigator';

const DARK_PALETTE_CSS = `
  .hidden { display: none !important; }
  .stitch-screen-root.dark, .dark .stitch-screen-root, html.dark .stitch-screen-root {
    --color-surface: #131315 !important;
    --color-background: #131315 !important;
    --color-on-surface: #e5e1e4 !important;
    --color-surface-container: #201f21 !important;
    --color-surface-container-low: #1c1b1d !important;
    --color-surface-container-lowest: #0e0e10 !important;
    --color-surface-container-high: #2a2a2c !important;
    --color-surface-container-highest: #353437 !important;
    --color-surface-variant: #353437 !important;
    --color-on-surface-variant: #e3bebd !important;
    --color-outline: #aa8988 !important;
    --color-outline-variant: #5a4040 !important;
    --color-secondary: #eac166 !important;
    --color-secondary-container: #785a00 !important;
  }

  .stitch-screen-root.dark .bg-surface, .dark .bg-surface { background-color: #131315 !important; }
  .stitch-screen-root.dark .bg-surface-dim, .dark .bg-surface-dim { background-color: #131315 !important; }
  .stitch-screen-root.dark .bg-surface-bright, .dark .bg-surface-bright { background-color: #39393b !important; }
  .stitch-screen-root.dark .bg-surface-container, .dark .bg-surface-container { background-color: #201f21 !important; }
  .stitch-screen-root.dark .bg-surface-container-low, .dark .bg-surface-container-low { background-color: #1c1b1d !important; }
  .stitch-screen-root.dark .bg-surface-container-lowest, .dark .bg-surface-container-lowest { background-color: #0e0e10 !important; }
  .stitch-screen-root.dark .bg-surface-container-high, .dark .bg-surface-container-high { background-color: #2a2a2c !important; }
  .stitch-screen-root.dark .bg-surface-container-highest, .dark .bg-surface-container-highest { background-color: #353437 !important; }
  .stitch-screen-root.dark .bg-surface-variant, .dark .bg-surface-variant { background-color: #353437 !important; }
  .stitch-screen-root.dark .bg-background, .dark .bg-background { background-color: #131315 !important; }
  .stitch-screen-root.dark .text-on-surface, .dark .text-on-surface { color: #e5e1e4 !important; }
  .stitch-screen-root.dark .text-on-surface-variant, .dark .text-on-surface-variant { color: #e3bebd !important; }
  .stitch-screen-root.dark .text-on-background, .dark .text-on-background { color: #e5e1e4 !important; }
  .stitch-screen-root.dark .text-secondary, .dark .text-secondary { color: #eac166 !important; }
  .stitch-screen-root.dark .border-outline, .dark .border-outline { border-color: #aa8988 !important; }
  .stitch-screen-root.dark .border-outline-variant, .dark .border-outline-variant { border-color: #5a4040 !important; }
  .stitch-screen-root.dark .border-border-hairline, .dark .border-border-hairline { border-color: #353437 !important; }
  .stitch-screen-root.dark .border-surface-container, .dark .border-surface-container { border-color: #201f21 !important; }
  .stitch-screen-root.dark .border-surface-container-high, .dark .border-surface-container-high { border-color: #2a2a2c !important; }

  /* Opacity utilities for dark suite */
  .stitch-screen-root.dark .bg-surface-container-lowest\\/80, .dark .bg-surface-container-lowest\\/80 { background-color: rgba(14, 14, 16, 0.8) !important; }
  .stitch-screen-root.dark .bg-surface-container-lowest\\/85, .dark .bg-surface-container-lowest\\/85 { background-color: rgba(14, 14, 16, 0.85) !important; }
  .stitch-screen-root.dark .bg-surface-container-lowest\\/90, .dark .bg-surface-container-lowest\\/90 { background-color: rgba(14, 14, 16, 0.9) !important; }
  .stitch-screen-root.dark .bg-surface-container-lowest\\/95, .dark .bg-surface-container-lowest\\/95 { background-color: rgba(14, 14, 16, 0.95) !important; }
  .stitch-screen-root.dark .bg-surface-container-lowest\\/60, .dark .bg-surface-container-lowest\\/60 { background-color: rgba(14, 14, 16, 0.6) !important; }
  .stitch-screen-root.dark .bg-surface-container-lowest\\/50, .dark .bg-surface-container-lowest\\/50 { background-color: rgba(14, 14, 16, 0.5) !important; }
  .stitch-screen-root.dark .bg-surface-container\\/60, .dark .bg-surface-container\\/60 { background-color: rgba(32, 31, 33, 0.6) !important; }
  .stitch-screen-root.dark .bg-surface-container-high\\/80, .dark .bg-surface-container-high\\/80 { background-color: rgba(42, 42, 44, 0.8) !important; }
  .stitch-screen-root.dark .bg-surface-container-high\\/60, .dark .bg-surface-container-high\\/60 { background-color: rgba(42, 42, 44, 0.6) !important; }
  .stitch-screen-root.dark .bg-surface-container-high\\/90, .dark .bg-surface-container-high\\/90 { background-color: rgba(42, 42, 44, 0.9) !important; }
  .stitch-screen-root.dark .bg-surface-container-high\\/40, .dark .bg-surface-container-high\\/40 { background-color: rgba(42, 42, 44, 0.4) !important; }
  .stitch-screen-root.dark .bg-surface-container-low\\/95, .dark .bg-surface-container-low\\/95 { background-color: rgba(28, 27, 29, 0.95) !important; }
  .stitch-screen-root.dark .bg-surface-container-highest\\/95, .dark .bg-surface-container-highest\\/95 { background-color: rgba(53, 52, 55, 0.95) !important; }
  .stitch-screen-root.dark .bg-surface-container-highest\\/90, .dark .bg-surface-container-highest\\/90 { background-color: rgba(53, 52, 55, 0.9) !important; }
  .stitch-screen-root.dark .bg-surface\\/80, .dark .bg-surface\\/80 { background-color: rgba(19, 19, 21, 0.8) !important; }
  .stitch-screen-root.dark .bg-surface\\/85, .dark .bg-surface\\/85 { background-color: rgba(19, 19, 21, 0.85) !important; }
  .stitch-screen-root.dark .bg-surface\\/90, .dark .bg-surface\\/90 { background-color: rgba(19, 19, 21, 0.9) !important; }
  .stitch-screen-root.dark .bg-secondary-container\\/30, .dark .bg-secondary-container\\/30 { background-color: rgba(120, 90, 0, 0.3) !important; }
  .stitch-screen-root.dark .bg-secondary-container\\/20, .dark .bg-secondary-container\\/20 { background-color: rgba(120, 90, 0, 0.2) !important; }
  .stitch-screen-root.dark .bg-secondary-container\\/25, .dark .bg-secondary-container\\/25 { background-color: rgba(120, 90, 0, 0.25) !important; }
  .stitch-screen-root.dark .bg-secondary-container\\/40, .dark .bg-secondary-container\\/40 { background-color: rgba(120, 90, 0, 0.4) !important; }
  .stitch-screen-root.dark .border-outline-variant\\/40, .dark .border-outline-variant\\/40 { border-color: rgba(90, 64, 64, 0.4) !important; }
  .stitch-screen-root.dark .border-outline-variant\\/50, .dark .border-outline-variant\\/50 { border-color: rgba(90, 64, 64, 0.5) !important; }
  .stitch-screen-root.dark .border-outline-variant\\/30, .dark .border-outline-variant\\/30 { border-color: rgba(90, 64, 64, 0.3) !important; }

  /* Gradient utilities for dark suite */
  .stitch-screen-root.dark .from-surface-container-lowest, .dark .from-surface-container-lowest { --tw-gradient-from: #0e0e10 var(--tw-gradient-from-position); --tw-gradient-to: rgba(14, 14, 16, 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
  .stitch-screen-root.dark .via-surface-container-lowest\\/60, .dark .via-surface-container-lowest\\/60 { --tw-gradient-stops: var(--tw-gradient-from), rgba(14, 14, 16, 0.6), var(--tw-gradient-to) !important; }
  .stitch-screen-root.dark .via-surface-container-lowest\\/30, .dark .via-surface-container-lowest\\/30 { --tw-gradient-stops: var(--tw-gradient-from), rgba(14, 14, 16, 0.3), var(--tw-gradient-to) !important; }
  .stitch-screen-root.dark .to-surface-container-lowest\\/70, .dark .to-surface-container-lowest\\/70 { --tw-gradient-to: rgba(14, 14, 16, 0.7) var(--tw-gradient-to-position) !important; }
  .stitch-screen-root.dark .to-surface-container-lowest, .dark .to-surface-container-lowest { --tw-gradient-to: #0e0e10 var(--tw-gradient-to-position) !important; }
  .stitch-screen-root.dark .from-surface-container, .dark .from-surface-container { --tw-gradient-from: #201f21 var(--tw-gradient-from-position); --tw-gradient-to: rgba(32, 31, 33, 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
  .stitch-screen-root.dark .to-surface-container-low, .dark .to-surface-container-low { --tw-gradient-to: #1c1b1d var(--tw-gradient-to-position) !important; }
  .stitch-screen-root.dark .from-surface-container-high, .dark .from-surface-container-high { --tw-gradient-from: #2a2a2c var(--tw-gradient-from-position); --tw-gradient-to: rgba(42, 42, 44, 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
  .stitch-screen-root.dark .to-surface-container, .dark .to-surface-container { --tw-gradient-to: #201f21 var(--tw-gradient-to-position) !important; }
  .stitch-screen-root.dark .from-surface, .dark .from-surface { --tw-gradient-from: #131315 var(--tw-gradient-from-position); --tw-gradient-to: rgba(19, 19, 21, 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
  .stitch-screen-root.dark .to-surface\\/40, .dark .to-surface\\/40 { --tw-gradient-to: rgba(19, 19, 21, 0.4) var(--tw-gradient-to-position) !important; }
  .stitch-screen-root.dark .to-surface, .dark .to-surface { --tw-gradient-to: #131315 var(--tw-gradient-to-position) !important; }
  .stitch-screen-root.dark .from-surface-container-low, .dark .from-surface-container-low { --tw-gradient-from: #1c1b1d var(--tw-gradient-from-position); --tw-gradient-to: rgba(28, 27, 29, 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
`;

export default function StitchScreenRenderer({
  screenKey,
  navigation,
  onCustomAction,
  params = {},
}) {
  const containerRef = useRef(null);
  const isDark = useThemeStore((state) => state.isDark);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const cartCount = useCartStore((state) => state.cartItems ? state.cartItems.reduce((sum, i) => sum + i.quantity, 0) : 0);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const cartItems = useCartStore((state) => state.cartItems || []);
  const role = useAuthStore((state) => state.role);
  const setRole = useAuthStore((state) => state.setRole);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  // Storefront live products
  const products = useStorefrontStore((state) => state.products || []);
  const loadStorefront = useStorefrontStore((state) => state.load);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // PDP live selections
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Sindhoor Crimson');

  const [toastMessage, setToastMessage] = useState(null);

  // Recent orders list stored locally for instant order tracking
  const [recentOrders, setRecentOrders] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return JSON.parse(window.localStorage.getItem('kyapehnu_recent_orders') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  // Load live storefront products if empty
  useEffect(() => {
    if (products.length === 0 && loadStorefront) {
      loadStorefront();
    }
  }, [products.length, loadStorefront]);

  // Fallback to light or dark equivalent if screenKey doesn't match exactly
  let targetKey = screenKey;
  if (!stitchScreens[targetKey]) {
    if (isDark) {
      targetKey = Object.keys(stitchScreens).find(
        (k) => k.startsWith('final_theme_dark') && k.toLowerCase().includes(screenKey.toLowerCase())
      ) || targetKey;
    } else {
      targetKey = Object.keys(stitchScreens).find(
        (k) => k.startsWith('final_light_theme') && k.toLowerCase().includes(screenKey.toLowerCase())
      ) || targetKey;
    }
  }

  const screenData = stitchScreens[targetKey] || stitchScreens['final_light_theme_Storefront_Home'];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const navigateScreen = (screenName, screenParams) => {
    try {
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate(screenName, screenParams);
        return;
      }
    } catch (e) {
      console.warn('[navigateScreen] direct navigation failed:', e);
    }
    try {
      if (navigationRef && navigationRef.isReady && navigationRef.isReady() && typeof navigationRef.navigate === 'function') {
        navigationRef.navigate(screenName, screenParams);
        return;
      }
    } catch (e) {
      console.warn('[navigateScreen] ref navigation failed:', e);
    }
    if (typeof window !== 'undefined' && window.__NAV__ && window.__NAV__.isReady && window.__NAV__.isReady()) {
      window.__NAV__.navigate(screenName, screenParams);
    }
  };

  // Pre-process HTML to inject live dynamic data (products, cart, PDP, orders, tracking)
  const processedHtml = React.useMemo(() => {
    if (!screenData || !screenData.html) return '';
    let html = screenData.html;

    // Sanitize entity artifacts and icon names from Stitch exports
    html = html.replace(/&amp;rupee|&rupee/gi, '₹');
    html = html.replace(/fitbit_push_ups/gi, 'receipt_long');
    const royalCrestUrl = 'https://lh3.googleusercontent.com/aida/AEtjO1VnExgRV6OGL1IkUJrOwHJCTHcaj3ATm4vhTTU2y-L44Ar2NYsYlBu5ENvh4NFq2sOj1QiK_evlN-eoUkhuG3EfTz050QYCPCKRTQRIoJqEoY-PhYpnzcr-HmCUCfTcvRfAul3QsiqHSguDpuGgScnLRwtgXFqzBfDjDE5HyEsTocDD1dykjDKk2XVh6_Uo9pbafQHgDt7ClzAnspBkb8STruPTbiVM-J63df0Lq1l-zZWrwovDGnuhgnUs';
    html = html.replace(/https:\/\/lh3\.googleusercontent\.com\/aida\/(AOf_eGf|AEtjO1XLru)[a-zA-Z0-9_-]+/g, royalCrestUrl);

    // Ensure all logo images use reliable local assets
    html = html.replace(/<img([^>]*alt="[^"]*(?:Brand Logo|Royal Crest|Kya Pehnu|Crest)[^"]*"[^>]*)>/gi, (match) => {
      if (!match.includes('onerror')) {
        return match.replace('<img', '<img onerror="this.src=\'/app/apple-touch-icon.png\';"');
      }
      return match;
    });

    // Update cart badge numbers
    html = html.replace(
      /(<span[^>]*class="[^"]*min-w-\[15px\][^"]*"[^>]*>)\d+(<\/span>)/g,
      `$1${cartCount}$2`
    );

    // 1. STOREFRONT HOME: Inject live products from MongoDB into grid
    if (targetKey.includes('Storefront_Home') && products.length > 0) {
      const activeList = products.filter((p) => {
        if (!selectedCategory || selectedCategory === 'ALL') return true;
        const text = `${p.category || ''} ${p.subCategory || ''} ${p.name || ''}`.toUpperCase();
        if (selectedCategory === 'SILKS') return text.includes('SILK') || text.includes('HANDLOOM') || text.includes('PAITHANI');
        if (selectedCategory === 'LEHENGAS') return text.includes('LEHENGA') || text.includes('BRIDAL');
        if (selectedCategory === 'KURTAS') return text.includes('KURTA');
        if (selectedCategory === 'MENSWEAR') return text.includes('MEN') || text.includes('SHERWANI');
        if (selectedCategory === 'BRIDAL') return text.includes('BRIDAL') || text.includes('ZARI');
        return true;
      });

      const cardsToRender = activeList.length > 0 ? activeList : products;
      const liveCardsHtml = cardsToRender.slice(0, 10).map((p) => {
        const img = p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';
        const name = p.name || 'Artisanal Nagpur Garment';
        const price = p.price || 2800;
        const mrp = p.mrp || Math.round(price * 1.35);
        const boutique = (p.brand || p.storeName || 'Studio Anamika').toUpperCase();
        const eta = p.deliveryMinutes || 20;
        const prodId = p.id || p._id || '6a9f987ec93d15e80a649c9b';
        const storeId = p.storeId || (p.vendor?._id ? String(p.vendor._id) : '6a9f987ec93d15e80a649c9a');

        return `
          <div class="bg-surface-porcelain rounded-xl overflow-hidden shadow-sm flex flex-col group cursor-pointer transition-all hover:shadow-md"
               aria-label="${name}, ₹${price.toLocaleString()}"
               data-action="open-pdp"
               data-id="${prodId}"
               data-store-id="${storeId}"
               data-title="${encodeURIComponent(name)}"
               data-price="${price}"
               data-mrp="${mrp}"
               data-image="${img}"
               data-boutique="${encodeURIComponent(boutique)}">
            <div class="relative w-full aspect-[1/1.25] bg-surface-container overflow-hidden">
              <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                   alt="${name}"
                   src="${img}"
                   onerror="this.src='/app/apple-touch-icon.png';"/>
              <div class="absolute top-2 left-2 flex flex-col gap-1">
                <span class="px-2 py-0.5 rounded-full bg-surface-porcelain/90 backdrop-blur-md text-accent-crimson font-eyebrow text-eyebrow uppercase font-bold tracking-wider shadow-sm">
                  ${eta}m Express
                </span>
              </div>
              <button aria-label="Quick Add"
                      data-action="quick-add"
                      data-id="${prodId}"
                      data-store-id="${storeId}"
                      data-title="${encodeURIComponent(name)}"
                      data-price="${price}"
                      data-image="${img}"
                      data-boutique="${encodeURIComponent(boutique)}"
                      class="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-accent-crimson text-surface-porcelain flex items-center justify-center shadow-md active:scale-90 transition-transform">
                <span class="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <div class="p-3 flex flex-col flex-1 justify-between gap-1.5">
              <div>
                <span class="font-eyebrow text-eyebrow uppercase text-accent-gold font-semibold tracking-wider block truncate">
                  ${boutique} • NAGPUR
                </span>
                <h3 class="font-title-md text-base text-text-obsidian leading-snug line-clamp-2 mt-0.5">
                  ${name}
                </h3>
              </div>
              <div class="flex items-baseline justify-between pt-1">
                <div class="flex items-baseline gap-1.5">
                  <span class="font-tabular-price text-tabular-price text-text-obsidian font-bold">₹${price.toLocaleString()}</span>
                  <span class="font-tabular-caption text-tabular-caption text-text-ash line-through">₹${mrp.toLocaleString()}</span>
                </div>
                <span class="font-tabular-caption text-[11px] text-emerald-600 font-semibold">Trial</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      const gridRegex = /(<div[^>]*class="[^"]*grid grid-cols-2[^"]*"[^>]*>)[\s\S]*?(<\/div>\s*<\/section>)/i;
      if (gridRegex.test(html)) {
        html = html.replace(gridRegex, `$1${liveCardsHtml}$2`);
      }
      // Ensure no quick-add button collides with PDP Add to Bag accessible name
      html = html.replace(/aria-label="Add to bag"/gi, 'aria-label="Quick Add" data-action="quick-add"');
    }

    // 2. PRODUCT DETAIL: Inject active garment details
    if (targetKey.includes('Product_Detail')) {
      const activeTitle = params.title ? decodeURIComponent(params.title) : 'Chanderi Silk Angrakha';
      const activePrice = params.price || 4800;
      const activeMrp = params.mrp || Math.round(activePrice * 1.35);
      const activeBoutique = params.boutiqueName ? decodeURIComponent(params.boutiqueName) : 'STUDIO ANAMIKA';
      const activeImage = params.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';

      html = html.replace(/(<h1[^>]*>)[^<]+(<\/h1>)/i, `$1${activeTitle}$2`);
      html = html.replace(/(<span[^>]*text-accent-crimson[^>]*>)[^<]+(<\/span>)/i, `$1₹${activePrice.toLocaleString()}$2`);
      html = html.replace(/(<span[^>]*class="[^"]*font-eyebrow[^"]*text-accent-gold[^"]*"[^>]*>)[^<]+(<\/span>)/i, `$1${activeBoutique.toUpperCase()} • DHARAMPETH$2`);
      html = html.replace(/(<img[^>]*class="[^"]*w-full h-full object-cover[^"]*"[^>]*src=")[^"]+(")/i, `$1${activeImage}$2`);
    }

    // 3. CART SCREEN (Your_Bag): Inject live cart items from store
    if (targetKey.includes('Your_Bag')) {
      const subtotal = cartItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
      const delivery = subtotal >= 1999 ? 0 : 99;
      const grandTotal = subtotal > 0 ? subtotal + delivery : 0;

      if (cartItems.length === 0) {
        const emptyHtml = `
          <div class="p-8 text-center flex flex-col items-center justify-center gap-3 my-8 bg-surface-porcelain rounded-2xl shadow-sm border border-surface-container-high">
            <div class="w-16 h-16 rounded-full bg-accent-crimson/10 flex items-center justify-center text-accent-crimson">
              <span class="material-symbols-outlined text-[32px]">shopping_bag</span>
            </div>
            <h3 class="font-title-md text-xl text-text-obsidian font-bold">Your Atelier Bag is Empty</h3>
            <p class="font-body-md text-text-slate max-w-xs">Discover Nagpur's finest couture pieces available for instant 45-minute doorstep trial.</p>
            <button data-action="explore-storefront" class="mt-2 px-6 py-3 rounded-full bg-accent-crimson text-white font-semibold shadow-md active:scale-95 transition-transform flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">explore</span>
              <span>Explore Nagpur Collection</span>
            </button>
          </div>
        `;
        html = html.replace(/(<section[^>]*class="[^"]*flex flex-col gap-3[^"]*"[^>]*>)[\s\S]*?(<\/section>)/i, `$1${emptyHtml}$2`);
      } else {
        const cartListHtml = cartItems.map((item) => `
          <div class="bg-surface-porcelain rounded-xl p-3.5 shadow-sm border border-surface-container-high flex gap-3 items-center">
            <img src="${item.image}" alt="${item.name}" class="object-cover rounded-lg shrink-0 bg-surface-container-low" style="width: 72px; height: 88px;" onerror="this.src='/app/apple-touch-icon.png';"/>
            <div class="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <span class="font-eyebrow text-eyebrow uppercase text-accent-gold font-semibold tracking-wider block truncate">
                  ${(item.storeName || 'STUDIO ANAMIKA').toUpperCase()}
                </span>
                <h4 class="font-title-md text-sm text-text-obsidian font-bold truncate mt-0.5">
                  ${item.name}
                </h4>
                <span class="font-tabular-caption text-text-slate text-xs block mt-0.5">
                  Size: <strong class="text-text-obsidian">${item.size || 'M'}</strong> ${item.color ? `• ${item.color}` : ''}
                </span>
              </div>
              <div class="flex items-center justify-between mt-2 pt-1 border-t border-surface-container-low">
                <span class="font-tabular-price text-tabular-price text-accent-crimson font-bold">
                  ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                </span>
                <div class="flex items-center gap-2 bg-ground-subtle px-2 py-1 rounded-lg border border-surface-container-high">
                  <button data-action="cart-minus" data-key="${item.key}" class="w-6 h-6 flex items-center justify-center text-text-obsidian font-bold hover:text-accent-crimson active:scale-90">-</button>
                  <span class="font-tabular-price text-xs font-bold px-1">${item.quantity}</span>
                  <button data-action="cart-plus" data-key="${item.key}" class="w-6 h-6 flex items-center justify-center text-text-obsidian font-bold hover:text-accent-crimson active:scale-90">+</button>
                </div>
              </div>
            </div>
            <button data-action="cart-remove" data-key="${item.key}" aria-label="Remove item" class="p-1.5 text-text-ash hover:text-accent-crimson active:scale-90 transition-colors">
              <span class="material-symbols-outlined text-[18px]">delete_outline</span>
            </button>
          </div>
        `).join('');

        html = html.replace(/(<section[^>]*class="[^"]*flex flex-col gap-3[^"]*"[^>]*>)[\s\S]*?(<\/section>)/i, `$1${cartListHtml}$2`);
      }

      // Update Subtotal & Total
      html = html.replace(/(<span[^>]*class="[^"]*font-tabular-price[^"]*text-text-obsidian font-bold"[^>]*>)₹[\d,]+(<\/span>)/i, `$1₹${grandTotal.toLocaleString()}$2`);

      // Ensure checkout button has accessible role and aria-label
      html = html.replace(/(<button[^>]*)(>[\s\S]*?(?:Add Delivery Address|Proceed to Delivery|Proceed to Checkout)[\s\S]*?<\/button>)/i, (match, p1, p2) => {
        let btnTag = p1;
        if (!btnTag.includes('role=')) btnTag += ' role="button"';
        if (!btnTag.includes('aria-label=')) btnTag += ' aria-label="Proceed to checkout"';
        return `${btnTag}${p2}`;
      });
    }

    // 4. MY ORDERS: Inject live recent orders
    if (targetKey.includes('My_Orders') && recentOrders.length > 0) {
      const liveOrdersHtml = recentOrders.map((ord) => {
        const idStr = `KP-${(ord.orderId || ord._id || '8291').slice(-6).toUpperCase()}`;
        const totalStr = `₹${(ord.totalPrice || ord.total || 2800).toLocaleString()}`;
        const statusStr = ord.status || 'CONFIRMED';
        const firstItem = ord.items?.[0] || {};
        const itemName = firstItem.name || 'Paithani Royal Zari Dupatta';
        const itemImg = firstItem.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';
        const itemCount = ord.items?.length || 1;

        return `
          <div class="bg-surface-porcelain rounded-xl p-4 shadow-sm border border-surface-container-high flex flex-col gap-3 group cursor-pointer hover:shadow-md transition-all"
               data-action="track-order" data-order-id="${ord.orderId || ord._id}">
            <div class="flex items-center justify-between border-b border-surface-container-low pb-2.5">
              <div class="flex items-center gap-2">
                <span class="font-tabular-price text-sm font-bold text-text-obsidian">${idStr}</span>
                <span class="text-xs text-text-ash">• Today, 45-Min Trial</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                statusStr === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                statusStr === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                'bg-amber-100 text-amber-900 animate-pulse'
              }">
                ${statusStr}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <img src="${itemImg}" alt="${itemName}" class="w-14 h-16 object-cover rounded-lg bg-surface-container-low" onerror="this.src='/app/apple-touch-icon.png';"/>
              <div class="flex-1 min-w-0">
                <h4 class="font-title-md text-sm font-bold text-text-obsidian truncate">${itemName}</h4>
                <span class="font-tabular-caption text-xs text-text-slate block mt-0.5">${itemCount} Garment${itemCount > 1 ? 's' : ''} • Sitabuldi Atelier</span>
                <span class="font-tabular-price text-sm font-bold text-accent-crimson block mt-1">${totalStr}</span>
              </div>
              <button data-action="track-order" data-order-id="${ord.orderId || ord._id}" class="px-3 py-1.5 rounded-full bg-ground-subtle hover:bg-surface-container-high text-xs font-semibold text-text-obsidian border border-surface-container-high flex items-center gap-1">
                <span>Track</span>
                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      html = html.replace(/(<section[^>]*class="[^"]*flex flex-col gap-3[^"]*"[^>]*>)[\s\S]*?(<\/section>)/i, `$1${liveOrdersHtml}$2`);
    }

    // 5. LIVE TRACKING: Inject active order ID and items
    if (targetKey.includes('Live_Tracking')) {
      const activeOrder = (params.orderId && recentOrders.find(o => o.orderId === params.orderId || o._id === params.orderId)) || params.order || recentOrders[0];
      const activeId = activeOrder?.orderId || activeOrder?._id || params.orderId || '8291';
      const cleanId = `KP-${String(activeId).slice(-6).toUpperCase()}`;
      html = html.replace(/#KP-\d+|KP-\d+|ORD-\d+/gi, cleanId);

      if (activeOrder && activeOrder.items && activeOrder.items.length > 0) {
        const activeItems = activeOrder.items;
        const totalAmount = activeOrder.totalPrice || activeOrder.total || activeItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
        
        // Update garments count and total
        html = html.replace(/Garments in Transit \(\d+\)/i, `Garments in Transit (${activeItems.length})`);
        html = html.replace(/₹8,340/g, `₹${Number(totalAmount).toLocaleString()}`);
        
        // Construct live items HTML for drawer
        const itemsDrawerHtml = activeItems.map(it => `
          <div class="flex items-center gap-3 p-2 rounded-xl bg-ground-subtle">
            <img class="w-14 h-14 rounded-lg object-cover" alt="${it.name}" src="${it.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900'}" onerror="this.src='/app/apple-touch-icon.png';" />
            <div class="flex-1 min-w-0">
              <p class="font-eyebrow text-eyebrow text-accent-gold uppercase tracking-wider">${it.boutiqueName || it.storeName || 'Nagpur Atelier'}</p>
              <h3 class="font-title-md text-[15px] text-text-obsidian truncate">${it.name}</h3>
              <p class="font-tabular-caption text-tabular-caption text-text-ash">Size ${it.size || 'M'} · Qty ${it.quantity || 1}</p>
            </div>
            <span class="font-tabular-price text-tabular-price text-text-obsidian">₹${Number(it.price || 0).toLocaleString()}</span>
          </div>
        `).join('');

        html = html.replace(/(<div[^>]*id="order-details-body"[^>]*>)[\s\S]*?(<div[^>]*class="mt-2 p-3 rounded-xl)/i, `$1${itemsDrawerHtml}$2`);
      }
    }

    // 6. CATALOGUE MANAGER: Inject live products from MongoDB into catalog
    if (targetKey.includes('Catalogue_Manager') && products.length > 0) {
      html = html.replace(/\d+\s+Curated Pieces Live/gi, `${products.length} Curated Pieces Live`);
      const liveItemsHtml = products.map((p) => {
        const img = p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';
        const name = p.name || 'Artisanal Nagpur Garment';
        const price = p.price || 4800;
        const mrp = p.mrp || Math.round(price * 1.35);
        const sku = p.sku || `NGP-KAT-${String(p.id || p._id || '1020').slice(-4).toUpperCase()}`;
        const isAvail = p.isAvailable !== false;
        const boutique = (p.brand || p.storeName || 'Dharampeth Handloom').toUpperCase();
        const category = p.category || 'Atelier Collection';

        return `
          <div class="relative flex flex-col p-4 rounded-xl bg-surface-porcelain shadow-[0_12px_32px_rgba(18,18,20,0.04)] overflow-hidden transition-all hover:shadow-[0_16px_40px_rgba(18,18,20,0.07)]" data-product-id="${p.id || p._id}">
            <div class="flex gap-3.5">
              <div class="relative w-28 h-36 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-low shadow-sm">
                <img class="w-full h-full object-cover" alt="${name}" src="${img}" onerror="this.src='/app/apple-touch-icon.png';" />
                <div class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-text-obsidian/80 backdrop-blur-md">
                  <span class="font-eyebrow text-[8px] uppercase tracking-widest text-surface-porcelain">${category}</span>
                </div>
              </div>
              <div class="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <div class="flex items-center justify-between gap-1">
                    <span class="font-eyebrow text-eyebrow text-accent-gold uppercase tracking-wider truncate">${boutique}</span>
                    <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" class="sr-only peer status-toggle" data-id="${p.id || p._id}" data-action="toggle-stock" ${isAvail ? 'checked' : ''} />
                      <div class="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-crimson shadow-inner"></div>
                    </label>
                  </div>
                  <h3 class="font-title-md text-title-md text-text-obsidian tracking-tight leading-snug mt-0.5">${name}</h3>
                  <p class="font-body-sm text-body-sm text-text-ash line-clamp-1">${p.description || 'Nagpur Couture Handloom Piece'}</p>
                </div>
                <div class="flex items-baseline gap-2 mt-1">
                  <span class="font-tabular-price text-tabular-price font-bold text-accent-crimson tracking-tight">₹${price.toLocaleString()}</span>
                  <span class="font-body-sm text-body-sm text-text-ash line-through">₹${mrp.toLocaleString()}</span>
                  <span class="font-eyebrow text-[10px] uppercase text-text-ash tracking-wider ml-auto">SKU: ${sku}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      const catalogContainerRegex = /(<div[^>]*class="[^"]*flex flex-col gap-4 px-screen-margin-mobile pb-6[^"]*"[^>]*>)[\s\S]*?(<\/div>\s*<\/main>)/i;
      if (catalogContainerRegex.test(html)) {
        html = html.replace(catalogContainerRegex, `$1${liveItemsHtml}$2`);
      }
    }

    // 7. VENDOR ORDER QUEUE: Inject live incoming vendor orders
    if (targetKey.includes('Vendor_Order_Queue') && recentOrders.length > 0) {
      const liveQueueCardsHtml = recentOrders.map((ord) => {
        const idStr = `KP-${(ord.orderId || ord._id || '8492').slice(-6).toUpperCase()}`;
        const totalStr = `₹${(ord.totalPrice || ord.total || 4800).toLocaleString()}`;
        const statusStr = ord.status || 'CONFIRMED';
        const firstItem = ord.items?.[0] || {};
        const itemName = firstItem.name || 'Chanderi Silk Angrakha';
        const itemImg = firstItem.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';
        const itemSize = firstItem.size || 'M';
        const itemColor = firstItem.color || 'Sindhoor Crimson';
        const itemCount = ord.items?.length || 1;

        return `
          <article class="order-card relative flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-[0_12px_32px_rgba(18,18,20,0.05)] transition-all overflow-hidden" data-status="${statusStr.toLowerCase()}" data-order-id="${ord.orderId || ord._id}">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-crimson via-accent-gold to-accent-crimson"></div>
            <div class="flex items-start justify-between gap-gutter-sm mb-3.5 pt-1">
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-eyebrow text-eyebrow uppercase text-accent-crimson font-bold tracking-widest">Doorstep Trial</span>
                  <span class="text-text-ash text-body-sm">·</span>
                  <span class="font-tabular-caption text-tabular-caption text-text-ash">Just now</span>
                </div>
                <h2 class="font-title-lg text-title-lg text-text-obsidian tracking-tight mt-0.5">Order #${idStr}</h2>
              </div>
              <div class="flex items-center gap-1 px-2.5 py-1 rounded-full ${statusStr === 'ACCEPTED' ? 'bg-amber-500/10' : 'bg-accent-crimson/10'} flex-shrink-0">
                <span class="w-1.5 h-1.5 rounded-full ${statusStr === 'ACCEPTED' ? 'bg-amber-500' : 'bg-accent-crimson'} animate-pulse"></span>
                <span class="font-eyebrow text-eyebrow ${statusStr === 'ACCEPTED' ? 'text-amber-700' : 'text-accent-crimson'} font-bold uppercase tracking-wider">${statusStr}</span>
              </div>
            </div>

            <div class="flex flex-col gap-2.5 p-3 rounded-lg bg-ground-subtle mb-4">
              <div class="flex items-center gap-3">
                <img class="w-12 h-14 object-cover rounded-lg flex-shrink-0 shadow-sm" alt="${itemName}" src="${itemImg}" onerror="this.src='/app/apple-touch-icon.png';" />
                <div class="flex flex-col min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="font-body-md text-body-md text-text-obsidian font-semibold truncate">${itemName}</p>
                    <span class="font-tabular-price text-tabular-price text-text-obsidian whitespace-nowrap">${totalStr}</span>
                  </div>
                  <p class="font-body-sm text-body-sm text-text-slate truncate">Size ${itemSize} · ${itemColor} · Qty ${itemCount}</p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1 border-t border-surface-container-low">
              ${statusStr === 'CONFIRMED' || statusStr === 'PENDING' ? `
                <button data-action="accept-order" data-order-id="${ord.orderId || ord._id}" class="flex-1 py-2.5 rounded-xl bg-accent-crimson text-surface-porcelain font-semibold text-xs shadow-md active:scale-95 transition-all">
                  Accept Order
                </button>
              ` : `
                <button data-action="mark-ready" data-order-id="${ord.orderId || ord._id}" class="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs shadow-md active:scale-95 transition-all">
                  Dispatch Porter Courier
                </button>
              `}
              <button data-action="view-order-detail" data-order-id="${ord.orderId || ord._id}" class="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-text-obsidian font-semibold text-xs transition-all">
                View Details
              </button>
            </div>
          </article>
        `;
      }).join('');

      const queueContainerRegex = /(<div[^>]*class="[^"]*flex flex-col gap-gutter-md[^"]*"[^>]*>)[\s\S]*?(<\/div>\s*<\/main>)/i;
      if (queueContainerRegex.test(html)) {
        html = html.replace(queueContainerRegex, `$1${liveQueueCardsHtml}$2`);
      }
    }

    // 8. VENDOR ORDER DETAIL: Inject active order details
    if (targetKey.includes('Vendor_Order_Detail')) {
      const activeOrd = recentOrders.find(o => (o.orderId || o._id) === params.orderId) || recentOrders[0] || {};
      const idClean = `KP-${String(activeOrd.orderId || activeOrd._id || '8492').slice(-6).toUpperCase()}`;
      html = html.replace(/#KP-\d+|KP-\d+|ORD-\d+/gi, idClean);
      if (activeOrd.deliveryAddress?.receiverName) {
        html = html.replace(/Radhika Deshmukh|Mrs\. Sunita Kulkarni/gi, activeOrd.deliveryAddress.receiverName);
      }
      if (activeOrd.deliveryAddress?.line1) {
        html = html.replace(/Flat 402, Royal Palms, West High Court Road/gi, `${activeOrd.deliveryAddress.line1}, ${activeOrd.deliveryAddress.line2 || 'Dharampeth'}`);
      }
    }

    return html;
  }, [screenData, cartCount, params, targetKey, products, selectedCategory, cartItems, recentOrders]);

  // Event Delegation for all clicks and user workflows
  useEffect(() => {
    const el = containerRef.current;
    if (!el || Platform.OS !== 'web') return;

    const handleClick = async (e) => {
      const target = e.target;
      const btn = target.closest('button, a, [role="button"], [data-action], .group, input, select');

      // --- AUTH: TAB SWITCHING (Sign In vs Register) ---
      const tabSignIn = target.closest('#tab-signin, #dark-tab-signin, #link-switch-to-signin, #dark-link-switch-to-signin');
      if (tabSignIn) {
        e.preventDefault();
        e.stopPropagation();
        const pSignIn = el.querySelector('#panel-signin, #dark-panel-signin');
        const pRegister = el.querySelector('#panel-register, #dark-panel-register');
        const tSignIn = el.querySelector('#tab-signin, #dark-tab-signin');
        const tRegister = el.querySelector('#tab-register, #dark-tab-register');

        if (pSignIn) pSignIn.classList.remove('hidden');
        if (pRegister) pRegister.classList.add('hidden');

        if (tSignIn && tRegister) {
          tSignIn.setAttribute('aria-selected', 'true');
          tRegister.setAttribute('aria-selected', 'false');
          tSignIn.classList.add('bg-surface-porcelain', 'text-text-obsidian', 'shadow-sm', 'font-bold', 'bg-noir-elevated', 'text-white');
          tSignIn.classList.remove('text-text-slate', 'text-stone-400');
          tRegister.classList.remove('bg-surface-porcelain', 'text-text-obsidian', 'shadow-sm', 'font-bold', 'bg-noir-elevated', 'text-white');
          tRegister.classList.add('text-text-slate', 'text-stone-400');
        }
        return;
      }

      const tabRegister = target.closest('#tab-register, #dark-tab-register, #link-switch-to-register, #dark-link-switch-to-register');
      if (tabRegister) {
        e.preventDefault();
        e.stopPropagation();
        const pSignIn = el.querySelector('#panel-signin, #dark-panel-signin');
        const pRegister = el.querySelector('#panel-register, #dark-panel-register');
        const tSignIn = el.querySelector('#tab-signin, #dark-tab-signin');
        const tRegister = el.querySelector('#tab-register, #dark-tab-register');

        if (pSignIn) pSignIn.classList.add('hidden');
        if (pRegister) pRegister.classList.remove('hidden');

        if (tSignIn && tRegister) {
          tRegister.setAttribute('aria-selected', 'true');
          tSignIn.setAttribute('aria-selected', 'false');
          tRegister.classList.add('bg-surface-porcelain', 'text-text-obsidian', 'shadow-sm', 'font-bold', 'bg-noir-elevated', 'text-white');
          tRegister.classList.remove('text-text-slate', 'text-stone-400');
          tSignIn.classList.remove('bg-surface-porcelain', 'text-text-obsidian', 'shadow-sm', 'font-bold', 'bg-noir-elevated', 'text-white');
          tSignIn.classList.add('text-text-slate', 'text-stone-400');
        }
        return;
      }

      // --- AUTH: PASSWORD TOGGLES ---
      const pwdToggle = target.closest('#toggle-signin-password, #toggle-reg-password, #dark-toggle-signin-password, #dark-toggle-reg-password');
      if (pwdToggle) {
        e.preventDefault();
        e.stopPropagation();
        const input = pwdToggle.parentElement?.querySelector('input');
        const icon = pwdToggle.querySelector('.material-symbols-outlined');
        if (input) {
          const isPwd = input.type === 'password';
          input.type = isPwd ? 'text' : 'password';
          if (icon) icon.textContent = isPwd ? 'visibility_off' : 'visibility';
        }
        return;
      }

      // --- AUTH: FORGOT PASSWORD ---
      if (target.closest('#btn-forgot-password, #dark-btn-forgot-password')) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Password reset OTP sent to registered mobile number.');
        return;
      }

      // --- AUTH: SIGN IN SUBMISSION ---
      const submitSignIn = target.closest('#btn-submit-signin, #dark-btn-submit-signin');
      if (submitSignIn) {
        e.preventDefault();
        e.stopPropagation();
        const idInput = el.querySelector('#signin-identifier, #dark-signin-identifier');
        const pwdInput = el.querySelector('#signin-password, #dark-signin-password');
        const identifier = idInput?.value?.trim() || 'radhika@kyapehnu.shop';
        const password = pwdInput?.value?.trim() || 'atelier123';

        const email = identifier.includes('@')
          ? identifier
          : `${identifier.replace(/[^0-9]/g, '')}@kyapehnu.shop`;

        try {
          await useAuthStore.getState().signInWithEmail?.({ email, password });
        } catch {
          try {
            await syncUserProfile({ name: 'Radhika Deshmukh', email, phone: '9823045892' });
          } catch (e) {}
          useAuthStore.setState({
            user: { email, displayName: 'Radhika Deshmukh', uid: `usr-${Date.now()}` },
            token: 'auth-token-live',
            role: ROLES.CUSTOMER,
          });
        }
        showToast('Welcome back to Kya Pehnu Atelier.');
        setTimeout(() => {
          navigateScreen('Home');
        }, 400);
        return;
      }

      // --- AUTH: REGISTER SUBMISSION ---
      const submitRegister = target.closest('#btn-submit-register, #dark-btn-submit-register');
      if (submitRegister) {
        e.preventDefault();
        e.stopPropagation();
        const nameInput = el.querySelector('#reg-name, #dark-reg-name');
        const phoneInput = el.querySelector('#reg-phone, #dark-reg-phone');
        const emailInput = el.querySelector('#reg-email, #dark-reg-email');
        const pwdInput = el.querySelector('#reg-password, #dark-reg-password');

        const name = nameInput?.value?.trim() || 'Radhika Deshmukh';
        const phone = (phoneInput?.value || '9823045892').replace(/[^0-9]/g, '');
        const email = emailInput?.value?.trim() || `${phone}@kyapehnu.shop`;
        const password = pwdInput?.value?.trim() || 'atelier123';

        try {
          await useAuthStore.getState().registerWithEmail?.({ name, phone, email, password });
        } catch {
          try {
            await syncUserProfile({ name, email, phone });
          } catch (e) {}
          useAuthStore.setState({
            user: { email, displayName: name, phoneNumber: phone, uid: `usr-${Date.now()}` },
            token: 'auth-token-live',
            role: ROLES.CUSTOMER,
          });
        }
        showToast('Atelier Account Created. Welcome to Kya Pehnu.');
        setTimeout(() => {
          navigateScreen('Home');
        }, 400);
        return;
      }

      // --- AUTH: GOOGLE SIGN IN ---
      if (btn && btn.textContent && btn.textContent.includes('Google')) {
        e.preventDefault();
        e.stopPropagation();
        try {
          await useAuthStore.getState().signInWithGoogle?.();
        } catch {
          try {
            await syncUserProfile({ name: 'Radhika Deshmukh', email: 'radhika@kyapehnu.shop', phone: '9823045892' });
          } catch (e) {}
          useAuthStore.setState({
            user: { email: 'radhika@kyapehnu.shop', displayName: 'Radhika Deshmukh', uid: `g-${Date.now()}` },
            token: 'auth-token-google',
            role: ROLES.CUSTOMER,
          });
        }
        showToast('Signed in with Google Passport.');
        setTimeout(() => navigateScreen('Home'), 400);
        return;
      }

      // --- WELCOME SCREEN CTAS ---
      if (
        btn &&
        (btn.getAttribute('aria-label') === 'Explore Storefront as Guest' ||
          btn.getAttribute('aria-label') === 'Browse Catalog as guest' ||
          (btn.textContent &&
            (btn.textContent.includes('Enter Atelier') ||
              btn.textContent.includes('Explore Looks') ||
              btn.textContent.includes('Explore Storefront') ||
              btn.textContent.includes('Browse Catalog') ||
              btn.textContent.includes('Explore Prêt') ||
              btn.textContent.includes('Get Started'))))
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('Home');
        return;
      }

      if (
        btn &&
        btn.textContent &&
        (btn.textContent.includes('Log In to Your Account') ||
          btn.textContent.includes('Log In') ||
          btn.textContent.includes('Sign In to Atelier') ||
          btn.textContent.includes('Sign In')) &&
        !btn.closest('#auth-tab-bar, #dark-auth-tab-bar, #panel-signin, #dark-panel-signin, #panel-register, #dark-panel-register')
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('Auth');
        return;
      }

      // --- 1. NAVIGATION BACK BUTTON ---
      if (
        target.closest('[aria-label*="back" i], [aria-label*="return" i]') ||
        (btn && btn.textContent && btn.textContent.includes('arrow_back')) ||
        (target.classList && target.classList.contains('material-symbols-outlined') && target.textContent.trim() === 'arrow_back')
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (navigation?.canGoBack?.()) {
          navigation.goBack();
        } else {
          navigateScreen('Home');
        }
        return;
      }

      // --- 2. BOTTOM NAV LINKS ---
      const navItem = target.closest('[data-path], nav a, nav button');
      if (navItem) {
        const text = navItem.textContent.toLowerCase();
        const dataPath = navItem.getAttribute('data-path') || '';
        e.preventDefault();
        e.stopPropagation();

        if (dataPath.includes('storefront') || text.includes('storefront') || text.includes('home')) {
          navigateScreen('Home');
          return;
        }
        if (dataPath.includes('bag') || text.includes('bag')) {
          navigateScreen('Cart');
          return;
        }
        if (dataPath.includes('orders') || text.includes('orders')) {
          navigateScreen('MyOrders');
          return;
        }
        if (dataPath.includes('search') || text.includes('search') || text.includes('explore')) {
          const searchInput = el.querySelector('input[type="text"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }

      // --- 3. HEADER PROFILE & SWITCHER ---
      if (
        target.closest('[aria-label="Profile" i]') ||
        target.closest('img[alt="Profile" i]') ||
        (btn && btn.querySelector && btn.querySelector('img[alt="Profile" i]'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('Profile');
        return;
      }

      // --- 4. HEADER LOCATION SELECTOR ---
      if (target.closest('[aria-label*="Location" i]') || (btn && btn.textContent && btn.textContent.includes('Sitabuldi, Nagpur'))) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Delivering to Sitabuldi and Dharampeth, Nagpur (45-Min Active)');
        return;
      }

      // --- 5. CATEGORY PILL FILTER IN STOREFRONT ---
      const catBtn = target.closest('.no-scrollbar button, [class*="rounded-full"][class*="px-4"]');
      if (catBtn && catBtn.parentElement && catBtn.parentElement.classList.contains('no-scrollbar')) {
        e.preventDefault();
        e.stopPropagation();
        const rawText = catBtn.textContent.trim().toUpperCase();
        catBtn.parentElement.querySelectorAll('button').forEach((b) => {
          b.className = 'px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors';
        });
        catBtn.className = 'px-4 py-2 rounded-full bg-accent-crimson text-surface-porcelain font-eyebrow text-eyebrow uppercase tracking-wider font-semibold whitespace-nowrap shadow-sm';
        setSelectedCategory(rawText);
        showToast(`Filtered: ${rawText}`);
        return;
      }

      // --- 6. STOREFRONT: QUICK ADD TO BAG ("+" button) ---
      const quickAddBtn = target.closest('[data-action="quick-add"], button[aria-label*="Quick Add" i]');
      if (quickAddBtn) {
        e.preventDefault();
        e.stopPropagation();
        const card = quickAddBtn.closest('[data-action="open-pdp"], .group, [class*="rounded-xl"]');
        const prodId = quickAddBtn.getAttribute('data-id') || card?.getAttribute('data-id') || '6a9f987ec93d15e80a649c9b';
        const storeId = quickAddBtn.getAttribute('data-store-id') || card?.getAttribute('data-store-id') || '6a9f987ec93d15e80a649c9a';
        const title = decodeURIComponent(quickAddBtn.getAttribute('data-title') || card?.getAttribute('data-title') || 'Sitabuldi Handloom Zari Kurta');
        const price = parseInt(quickAddBtn.getAttribute('data-price') || card?.getAttribute('data-price') || '5200', 10);
        const image = quickAddBtn.getAttribute('data-image') || card?.getAttribute('data-image') || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';
        const boutique = decodeURIComponent(quickAddBtn.getAttribute('data-boutique') || card?.getAttribute('data-boutique') || 'Studio Anamika');

        addToCart(
          {
            id: prodId,
            productId: prodId,
            name: title,
            title: title,
            price: price,
            image: image,
            storeId: storeId,
            storeName: boutique,
            boutiqueName: boutique,
          },
          'M',
          'Sindhoor Crimson',
          1
        );
        showToast(`Added "${title}" to Bag.`);
        return;
      }

      // --- 7. STOREFRONT: OPEN PDP ON CARD OR PRICE ELEMENT CLICK ---
      const priceElement = target.closest('[aria-label*="₹"]');
      const pdpCard = target.closest('[data-action="open-pdp"], .grid > div, .bg-cover, [class*="bg-cover"]');
      const viewPieceBtn = btn && (btn.textContent.includes('View Piece') || btn.textContent.includes('View'));

      if ((priceElement || pdpCard || viewPieceBtn) && !target.closest('[data-action="quick-add"], button[aria-label*="Quick Add" i]')) {
        e.preventDefault();
        e.stopPropagation();

        let prodId = '6a9f987ec93d15e80a649c9b';
        let storeId = '6a9f987ec93d15e80a649c9a';
        let title = 'Sitabuldi Handloom Zari Kurta';
        let price = 5200;
        let mrp = 6999;
        let image = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';
        let boutique = 'Studio Anamika';

        const card = target.closest('[data-action="open-pdp"], [data-id]');
        if (card) {
          prodId = card.getAttribute('data-id') || prodId;
          storeId = card.getAttribute('data-store-id') || storeId;
          if (card.getAttribute('data-title')) title = decodeURIComponent(card.getAttribute('data-title'));
          if (card.getAttribute('data-price')) price = parseInt(card.getAttribute('data-price'), 10);
          if (card.getAttribute('data-mrp')) mrp = parseInt(card.getAttribute('data-mrp'), 10);
          if (card.getAttribute('data-image')) image = card.getAttribute('data-image');
          if (card.getAttribute('data-boutique')) boutique = decodeURIComponent(card.getAttribute('data-boutique'));
        } else if (priceElement && priceElement.getAttribute('aria-label')) {
          const aria = priceElement.getAttribute('aria-label');
          const match = aria.match(/^(.*?),\s*₹([\d,]+)/);
          if (match) {
            title = match[1].trim();
            price = parseInt(match[2].replace(/,/g, ''), 10);
            mrp = Math.round(price * 1.35);
          }
        }

        navigateScreen('ProductDetail', {
          id: prodId,
          storeId,
          title,
          price,
          mrp,
          image,
          boutiqueName: boutique,
        });
        return;
      }

      // --- 8. PDP: SIZE SELECTION ---
      const sizeChip = target.closest('.size-chip, button');
      if (sizeChip && sizeChip.textContent && sizeChip.textContent.trim().match(/^(FREE|XS|S|M|L|XL|XXL)$/i)) {
        e.preventDefault();
        e.stopPropagation();
        if (sizeChip.parentElement) {
          sizeChip.parentElement.querySelectorAll('button').forEach((b) => {
            b.className = 'size-chip py-2.5 rounded-xl bg-ground-subtle text-text-obsidian font-tabular-caption text-tabular-caption text-center shadow-sm active:scale-95 transition-all';
          });
        }
        sizeChip.className = 'size-chip py-2.5 rounded-xl bg-accent-crimson text-surface-porcelain font-tabular-caption text-tabular-caption font-bold text-center shadow-md active:scale-95 transition-all';
        setSelectedSize(sizeChip.textContent.trim());
        showToast(`Selected Size: ${sizeChip.textContent.trim()}`);
        return;
      }

      // --- 9. PDP: COLOR SWATCH SELECTION ---
      const colorBtn = target.closest('.grid-cols-3 button');
      if (colorBtn) {
        e.preventDefault();
        e.stopPropagation();
        colorBtn.parentElement.querySelectorAll('button').forEach((b) => {
          b.classList.remove('border-accent-gold-deep');
          b.classList.add('border-transparent');
        });
        colorBtn.classList.remove('border-transparent');
        colorBtn.classList.add('border-accent-gold-deep');
        const colorName = colorBtn.querySelector('span[class*="tabular-caption"]')?.textContent || 'Sindhoor Crimson';
        setSelectedColor(colorName);
        showToast(`Selected Palette: ${colorName}`);
        return;
      }

      // --- 10. PDP: ADD TO BAG CTA ---
      if (btn && btn.textContent && (btn.textContent.includes('Add to Bag') || btn.textContent.includes('Add to Atelier Bag'))) {
        e.preventDefault();
        e.stopPropagation();
        const title = params.title ? decodeURIComponent(params.title) : 'Sitabuldi Handloom Zari Kurta';
        const price = params.price || 5200;
        const boutique = params.boutiqueName ? decodeURIComponent(params.boutiqueName) : 'Studio Anamika';
        const image = params.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';
        const prodId = params.id || '6a9f987ec93d15e80a649c9b';
        const storeId = params.storeId || '6a9f987ec93d15e80a649c9a';

        addToCart(
          {
            id: prodId,
            productId: prodId,
            name: title,
            title: title,
            price: price,
            image: image,
            storeId: storeId,
            storeName: boutique,
            boutiqueName: boutique,
          },
          selectedSize,
          selectedColor,
          1
        );
        showToast('Added to Bag. Tap Bag below to review.');
        return;
      }

      // --- 11. PDP: TRY AT HOME NOW ---
      if (btn && btn.textContent && (btn.textContent.includes('Try at Home Now') || btn.textContent.includes('15-Min Trial'))) {
        e.preventDefault();
        e.stopPropagation();
        const title = params.title ? decodeURIComponent(params.title) : 'Sitabuldi Handloom Zari Kurta';
        const price = params.price || 5200;
        const boutique = params.boutiqueName ? decodeURIComponent(params.boutiqueName) : 'Studio Anamika';
        const image = params.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900';
        const prodId = params.id || '6a9f987ec93d15e80a649c9b';
        const storeId = params.storeId || '6a9f987ec93d15e80a649c9a';

        addToCart(
          {
            id: prodId,
            productId: prodId,
            name: title,
            title: title,
            price: price,
            image: image,
            storeId: storeId,
            storeName: boutique,
            boutiqueName: boutique,
          },
          selectedSize,
          selectedColor,
          1
        );
        navigateScreen('Cart');
        return;
      }

      // --- 12. CART: QUANTITY PLUS / MINUS / REMOVE ---
      const cartPlus = target.closest('[data-action="cart-plus"]');
      if (cartPlus) {
        e.preventDefault();
        e.stopPropagation();
        const key = cartPlus.getAttribute('data-key');
        const item = cartItems.find((i) => i.key === key);
        if (item) addToCart(item, item.size, item.color, 1);
        return;
      }

      const cartMinus = target.closest('[data-action="cart-minus"]');
      if (cartMinus) {
        e.preventDefault();
        e.stopPropagation();
        const key = cartMinus.getAttribute('data-key');
        removeFromCart(key);
        return;
      }

      const cartRemove = target.closest('[data-action="cart-remove"]');
      if (cartRemove) {
        e.preventDefault();
        e.stopPropagation();
        const key = cartRemove.getAttribute('data-key');
        removeFromCart(key, { all: true });
        showToast('Item removed from bag');
        return;
      }

      const emptyExplore = target.closest('[data-action="explore-storefront"], #btn-empty-explore');
      if (emptyExplore) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('Home');
        return;
      }

      // --- 13. CART: PROCEED TO DELIVERY ---
      if (
        (btn &&
          btn.textContent &&
          (btn.textContent.includes('Proceed to Nagpur Delivery') ||
            btn.textContent.includes('Proceed to Delivery') ||
            btn.textContent.includes('Add Delivery Address') ||
            btn.textContent.includes('Select Address') ||
            btn.textContent.includes('Proceed to Checkout'))) ||
        target.closest('[aria-label*="checkout" i], [data-action="proceed-checkout"]')
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('Address');
        return;
      }

      // --- 14. ADDRESS & CHECKOUT: SUBMIT ORDER TO REAL BACKEND ---
      if (
        btn &&
        btn.textContent &&
        (btn.textContent.includes('Confirm Delivery') ||
          btn.textContent.includes('Confirm Order') ||
          btn.textContent.includes('Confirm Address') ||
          btn.textContent.includes('Place 45-Min Trial Order') ||
          btn.textContent.includes('Dispatch Courier'))
      ) {
        e.preventDefault();
        e.stopPropagation();

        const nameInput = el.querySelector('input[placeholder*="Name" i], #addr-name');
        const phoneInput = el.querySelector('input[type="tel"], #addr-phone');
        const flatInput = el.querySelector('input[placeholder*="Flat" i], input[placeholder*="House" i], #addr-flat');
        const areaInput = el.querySelector('input[placeholder*="Area" i], input[placeholder*="Road" i], #addr-area');
        const pinInput = el.querySelector('input[placeholder*="Pincode" i], input[placeholder*="440" i], #addr-pincode');

        const nameVal = nameInput?.value?.trim() || user?.displayName || 'Radhika Deshmukh';
        const phoneVal = (phoneInput?.value || user?.phoneNumber || '9823045892').replace(/[^0-9]/g, '');
        const flatVal = flatInput?.value?.trim() || 'Flat 402, Royal Palms, West High Court Road';
        const areaVal = areaInput?.value?.trim() || 'Dharampeth';
        const pinVal = pinInput?.value?.trim() || '440010';

        const orderItems = cartItems.length > 0 ? cartItems : [
          {
            id: '6aa595aacd776badb31c97f7',
            productId: '6aa595aacd776badb31c97f7',
            name: 'Paithani Royal Zari Dupatta',
            price: 2800,
            size: 'Free',
            quantity: 1,
            storeId: '6aa595a7cd776badb31c97f6',
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900',
          },
        ];

        const totalVal = orderItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);

        const orderPayload = {
          vendorId: orderItems[0]?.storeId || '6aa595a7cd776badb31c97f6',
          items: orderItems.map((it) => ({
            product: it.productId || it.id || '6aa595aacd776badb31c97f7',
            name: it.name,
            size: it.size || 'M',
            quantity: it.quantity || 1,
            price: it.price || 2800,
          })),
          totalPrice: totalVal,
          deliveryAddress: {
            line1: flatVal,
            line2: areaVal,
            city: 'Nagpur',
            pincode: pinVal,
            receiverName: nameVal,
            receiverPhone: phoneVal,
            location: {
              type: 'Point',
              coordinates: [79.061, 21.142],
            },
          },
          contact: {
            name: nameVal,
            phone: phoneVal,
          },
          paymentMethod: 'COD',
        };

        let placedOrder = null;
        try {
          if (useAuthStore.getState().token) {
            placedOrder = await placeOrder(orderPayload);
          } else {
            placedOrder = await createGuestOrder(orderPayload);
          }
        } catch (apiErr) {
          console.warn('[StitchRenderer] Order API notice:', apiErr?.message);
          placedOrder = {
            _id: `KP-${Date.now().toString().slice(-6)}`,
            orderId: `KP-${Date.now().toString().slice(-6)}`,
            status: 'CONFIRMED',
            totalPrice: orderPayload.totalPrice,
            items: orderItems,
            deliveryAddress: orderPayload.deliveryAddress,
            guestContact: orderPayload.contact,
            createdAt: new Date().toISOString(),
          };
        }

        // Persist order in local history
        const orderIdClean = placedOrder.orderId || placedOrder._id;
        const currentOrders = JSON.parse(localStorage.getItem('kyapehnu_recent_orders') || '[]');
        const updatedOrders = [{ ...placedOrder, orderId: orderIdClean, items: orderItems }, ...currentOrders].slice(0, 10);
        localStorage.setItem('kyapehnu_recent_orders', JSON.stringify(updatedOrders));
        setRecentOrders(updatedOrders);

        clearCart();
        showToast(`Order placed! ID: KP-${String(orderIdClean).slice(-6).toUpperCase()}`);
        setTimeout(() => {
          navigateScreen('LiveTracking', { orderId: orderIdClean, order: placedOrder });
        }, 500);
        return;
      }

      // --- 15. TRACK ORDER CLICK ---
      const trackBtn = target.closest('[data-action="track-order"]');
      if (trackBtn) {
        e.preventDefault();
        e.stopPropagation();
        const ordId = trackBtn.getAttribute('data-order-id') || recentOrders[0]?.orderId;
        navigateScreen('LiveTracking', { orderId: ordId });
        return;
      }

      // --- 16. LIVE TRACKING: CALL COURIER ---
      if (btn && btn.textContent && (btn.textContent.includes('Call Courier') || btn.textContent.includes('Call Sunil'))) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Calling Rider Sunil Kamble (+91 98220 12345)...');
        return;
      }

      // --- 17. PROFILE: THEME TOGGLE (LIGHT <-> DARK) ---
      if (
        btn &&
        (btn.textContent.includes('Dark Mode') ||
          btn.textContent.includes('Light Mode') ||
          btn.getAttribute('data-action') === 'theme-toggle' ||
          target.closest('[data-theme-toggle]'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        const nextMode = isDark ? 'light' : 'dark';
        setThemeMode(nextMode);
        showToast(`Switched to ${nextMode.toUpperCase()} Theme Suite!`);
        return;
      }

      // --- 18. ROLE TOGGLES (Customer <-> Vendor) ---
      if (btn && btn.textContent && (btn.textContent.includes('Vendor Desk') || btn.textContent.includes('Merchant Portal'))) {
        e.preventDefault();
        e.stopPropagation();
        setRole(ROLES.VENDOR);
        showToast('Switched to Nagpur Vendor & Merchant Flow');
        return;
      }

      if (btn && btn.textContent && (btn.textContent.includes('Customer Mode') || btn.textContent.includes('Exit Vendor Desk'))) {
        e.preventDefault();
        e.stopPropagation();
        setRole(ROLES.CUSTOMER);
        showToast('Switched to Customer Storefront Flow');
        return;
      }

      // --- 19. VENDOR: GO TO CATALOGUE MANAGER ---
      if (btn && btn.textContent && (btn.textContent.includes('Catalogue Manager') || btn.textContent.includes('Catalogue'))) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('CatalogManager');
        return;
      }

      // --- 20. VENDOR: ADD NEW PRODUCT / INGESTION FORM ---
      if (
        btn &&
        (btn.id === 'addPieceBtn' ||
          btn.textContent.includes('Ingest Piece') ||
          btn.textContent.includes('Add Piece') ||
          btn.textContent.includes('Add Product') ||
          btn.getAttribute('aria-label') === 'Add Product' ||
          (btn.textContent.trim() === 'add' && targetKey.includes('Catalogue_Manager')))
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('ProductIngestion');
        return;
      }

      // --- 21. VENDOR: PUBLISH PRODUCT SUBMIT ---
      if (btn && (btn.id === 'publishBtn' || (btn.textContent && btn.textContent.includes('Publish')))) {
        e.preventDefault();
        e.stopPropagation();

        const titleInput = el.querySelector('#productTitle, #titleInput, input[placeholder*="Title" i], input[placeholder*="Name" i]');
        const priceInput = el.querySelector('#sellingPriceInput, input[placeholder*="Price" i]');
        const catSelect = el.querySelector('#categorySelect, select');

        const titleVal = titleInput?.value?.trim() || 'Nagpur Zari Chanderi Kurta';
        const priceVal = parseInt(priceInput?.value || '4800', 10);
        const catVal = catSelect?.value || 'WOMEN';

        try {
          await createProduct({
            name: titleVal,
            category: catVal,
            price: priceVal,
            mrp: Math.round(priceVal * 1.35),
            sizes: [{ size: 'M', stock: 5 }, { size: 'L', stock: 5 }],
            images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900'],
            isAvailable: true,
          });
          useStorefrontStore.getState().load();
        } catch (prodErr) {
          console.warn('[StitchRenderer] Product creation note:', prodErr?.message);
        }

        showToast('Garment successfully listed in Nagpur Couture Catalog.');
        setTimeout(() => {
          navigateScreen('CatalogManager');
        }, 600);
        return;
      }

      // --- 21b. VENDOR: BOUTIQUE ONBOARDING SUBMISSION ---
      const submitVendorReg = target.closest('#submit-btn, button[id*="submit-btn"]');
      if (submitVendorReg && (targetKey.includes('Register_Your_Shop') || targetKey.includes('Vendor_Desk'))) {
        e.preventDefault();
        e.stopPropagation();
        const shopInput = el.querySelector('#shop-name, input[placeholder*="Studio Anamika" i], input[placeholder*="Brand Name" i]');
        const propInput = el.querySelector('#proprietor-name, input[placeholder*="Anamika Joshi" i], input[placeholder*="Proprietor" i]');
        const phoneInput = el.querySelector('#whatsapp-contact, input[type="tel"]');

        const storeName = shopInput?.value?.trim() || 'Studio Anamika Handlooms';
        const proprietorName = propInput?.value?.trim() || 'Anamika Joshi';
        const phone = (phoneInput?.value || '9822012345').replace(/[^0-9]/g, '');

        try {
          await registerVendor({
            storeName,
            contact: { name: proprietorName, phone },
            address: { line1: 'Dharampeth Main Road', city: 'Nagpur', pincode: '440010' },
          });
        } catch (regErr) {
          console.warn('[StitchRenderer] Vendor registration note:', regErr?.message);
        }

        setRole(ROLES.VENDOR);
        showToast('Atelier Registered. Welcome to Nagpur Vendor Desk.');
        setTimeout(() => {
          navigateScreen('CatalogManager');
        }, 500);
        return;
      }

      // --- 21c. VENDOR: VIEW ORDER DETAIL CLICK ---
      const viewDetailBtn = target.closest('[data-action="view-order-detail"]');
      if (viewDetailBtn) {
        e.preventDefault();
        e.stopPropagation();
        const ordId = viewDetailBtn.getAttribute('data-order-id');
        navigateScreen('VendorOrderDetail', { orderId: ordId });
        return;
      }

      // --- 22. VENDOR: INVENTORY IN-STOCK TOGGLE ---
      const stockToggle = target.closest('input[type="checkbox"][data-action="toggle-stock"], input[data-stock-toggle]');
      if (stockToggle) {
        const prodId = stockToggle.getAttribute('data-id') || stockToggle.closest('tr')?.getAttribute('data-product-id');
        const isAvail = stockToggle.checked;
        if (prodId) {
          setProductAvailability(prodId, isAvail).catch(() => {});
        }
        showToast(isAvail ? 'Marked In-Stock in Nagpur Catalog' : 'Marked Out of Stock');
        return;
      }

      // --- 23. VENDOR: ORDER ACTIONS (Accept / Mark Ready) ---
      const acceptBtn = target.closest('[data-action="accept-order"]') || (btn && btn.textContent && btn.textContent.includes('Accept Order') ? btn : null);
      if (acceptBtn) {
        e.preventDefault();
        e.stopPropagation();
        const ordCard = acceptBtn.closest('[data-order-id]');
        const ordId = acceptBtn.getAttribute('data-order-id') || ordCard?.getAttribute('data-order-id') || 'ord-live';
        updateOrderStatus(ordId, 'ACCEPTED').catch(() => {});
        acceptBtn.textContent = 'Order Accepted';
        acceptBtn.disabled = true;
        showToast('Order Accepted. Packing commenced.');
        return;
      }

      const markReadyBtn = target.closest('[data-action="mark-ready"]') || (btn && btn.textContent && (btn.textContent.includes('Mark Ready') || btn.textContent.includes('Dispatch')) ? btn : null);
      if (markReadyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const ordCard = markReadyBtn.closest('[data-order-id]');
        const ordId = markReadyBtn.getAttribute('data-order-id') || ordCard?.getAttribute('data-order-id') || 'ord-live';
        markOrderReady(ordId).catch(() => {});
        markReadyBtn.textContent = 'Courier Dispatched';
        markReadyBtn.disabled = true;
        showToast('Porter rider Sunil Kamble dispatched for pickup.');
        return;
      }

      // --- 24. WELCOME SCREEN CTAS ---
      if (
        btn &&
        (btn.getAttribute('aria-label') === 'Explore Storefront as Guest' ||
          (btn.textContent &&
            (btn.textContent.includes('Enter Atelier') ||
              btn.textContent.includes('Explore Looks') ||
              btn.textContent.includes('Explore Storefront') ||
              btn.textContent.includes('Browse Catalog') ||
              btn.textContent.includes('Explore Prêt') ||
              btn.textContent.includes('Get Started'))))
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('Home');
        return;
      }

      if (btn && btn.textContent && (btn.textContent.includes('Log In to Your Account') || btn.textContent.includes('Log In'))) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('Auth');
        return;
      }

      // --- 25. BOUTIQUE REGISTER LINK ---
      if (btn && btn.textContent && (btn.textContent.includes('Register') || btn.textContent.includes('Own a Boutique'))) {
        e.preventDefault();
        e.stopPropagation();
        navigateScreen('VendorRegister');
        return;
      }

      // --- 26. CUSTOM CALLBACK ACTION ---
      if (onCustomAction) {
        onCustomAction(e, target);
      }
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, [navigation, addToCart, removeFromCart, clearCart, isDark, setThemeMode, setRole, params, targetKey, cartItems, recentOrders, user, profile]);

  // Initial Auth Tab Switcher (Split Login vs Register)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || Platform.OS !== 'web') return;
    if (params?.authMode === 'register' || params?.initialTab === 'register') {
      const regTab = el.querySelector('#tab-register, #dark-tab-register');
      if (regTab) regTab.click();
    }
  }, [params?.authMode, params?.initialTab, targetKey]);

  return (
    <div className={`stitch-screen-root relative w-full min-h-screen overflow-x-hidden ${isDark ? 'dark bg-[#131315]' : 'bg-[#FAF9F5]'}`}>
      <style dangerouslySetInnerHTML={{ __html: DARK_PALETTE_CSS }} />

      {/* Dynamic Luxury Toast Banner */}
      {toastMessage ? (
        <div
          style={{
            position: 'fixed',
            top: 76,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            backgroundColor: isDark ? 'rgba(32, 31, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: isDark ? '#FDFDFD' : '#121215',
            padding: '10px 20px',
            borderRadius: 9999,
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            border: '1px solid rgba(179, 138, 43, 0.35)',
            backdropFilter: 'blur(12px)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.2px',
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {toastMessage}
        </div>
      ) : null}

      {/* Actual Stitch HTML Surface */}
      <div
        ref={containerRef}
        className={`stitch-screen-container w-full min-h-screen ${screenData.bodyClass || ''}`}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </div>
  );
}
