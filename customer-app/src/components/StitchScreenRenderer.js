import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import stitchScreens from '../data/stitchScreens.json';
import { useThemeStore } from '../store/useThemeStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore, ROLES } from '../store/useAuthStore';

const DARK_PALETTE_CSS = `
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


/**
 * StitchScreenRenderer renders the EXACT HTML extracted directly from Google Stitch
 * with full Tailwind CSS styling, Google Fonts (EB Garamond & Plus Jakarta Sans),
 * and Material Symbols Outlined icons.
 *
 * It attaches comprehensive event delegation to make all buttons, inputs, links,
 * and cards fully functional and wired to Zustand stores and React Navigation.
 */
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
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const cartItems = useCartStore((state) => state.cartItems || []);
  const role = useAuthStore((state) => state.role);
  const setRole = useAuthStore((state) => state.setRole);

  const [toastMessage, setToastMessage] = useState(null);

  // Fallback to light or dark equivalent if screenKey doesn't match exactly
  let targetKey = screenKey;
  if (!stitchScreens[targetKey]) {
    // If not found, try adding or removing dark prefix based on current theme
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
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Pre-process HTML to inject live dynamic data (cart count, current user, etc.)
  const processedHtml = React.useMemo(() => {
    if (!screenData || !screenData.html) return '';
    let html = screenData.html;

    // Sanitize entity artifacts and icon names from Stitch exports
    html = html.replace(/&amp;rupee|&rupee/gi, '₹');
    html = html.replace(/fitbit_push_ups/gi, 'receipt_long');
    const royalCrestUrl = 'https://lh3.googleusercontent.com/aida/AEtjO1VnExgRV6OGL1IkUJrOwHJCTHcaj3ATm4vhTTU2y-L44Ar2NYsYlBu5ENvh4NFq2sOj1QiK_evlN-eoUkhuG3EfTz050QYCPCKRTQRIoJqEoY-PhYpnzcr-HmCUCfTcvRfAul3QsiqHSguDpuGgScnLRwtgXFqzBfDjDE5HyEsTocDD1dykjDKk2XVh6_Uo9pbafQHgDt7ClzAnspBkb8STruPTbiVM-J63df0Lq1l-zZWrwovDGnuhgnUs';
    html = html.replace(/https:\/\/lh3\.googleusercontent\.com\/aida\/(AOf_eGf|AEtjO1XLru)[a-zA-Z0-9_-]+/g, royalCrestUrl);

    // Update cart badge numbers
    html = html.replace(
      /(<span[^>]*class="[^"]*min-w-\[15px\][^"]*"[^>]*>)\d+(<\/span>)/g,
      `$1${cartCount}$2`
    );

    // If on PDP, ensure product title matches params if passed
    if (params.title && targetKey.includes('Product_Detail')) {
      html = html.replace(
        /(<h1[^>]*>)[^<]+(<\/h1>)/i,
        `$1${params.title}$2`
      );
      if (params.price) {
        html = html.replace(
          /(<span[^>]*text-accent-crimson[^>]*>)[^<]+(<\/span>)/i,
          `$1₹${params.price}$2`
        );
      }
    }

    // Ensure all logo images use reliable local assets
    html = html.replace(/<img([^>]*alt="[^"]*(?:Brand Logo|Royal Crest|Kya Pehnu|Crest)[^"]*"[^>]*)>/gi, (match) => {
      if (!match.includes('onerror')) {
        return match.replace('<img', '<img onerror="this.src=\'/app/apple-touch-icon.png\';"');
      }
      return match;
    });

    return html;
  }, [screenData, cartCount, params, targetKey]);

  // Attach event delegation on containerRef
  useEffect(() => {
    const el = containerRef.current;
    if (!el || Platform.OS !== 'web') return;

    // Expose helpers on window for inline handlers in Stitch HTML
    if (typeof window !== 'undefined') {
      window.selectChip = (chipEl, groupId) => {
        if (!chipEl) return;
        const parent = chipEl.parentElement;
        if (parent) {
          parent.querySelectorAll('button').forEach((b) => {
            b.className = b.className
              .replace(/bg-brand-crimson|bg-accent-crimson|text-white|text-surface-porcelain|border-brand-crimson/g, '')
              .trim();
            if (!b.classList.contains('bg-white')) b.classList.add('bg-white', 'text-slate-700', 'border-brand-borderSubtle');
          });
        }
        chipEl.classList.remove('bg-white', 'text-slate-700', 'border-brand-borderSubtle');
        chipEl.classList.add('bg-brand-crimson', 'text-white', 'border-brand-crimson');
      };

      window.toggleSize = (size) => {
        const pill = document.getElementById(`pill-${size}`);
        const row = document.getElementById(`sizerow-${size}`);
        if (!pill) return;
        const isActive = pill.classList.contains('bg-brand-crimson') || pill.classList.contains('text-white');
        if (isActive) {
          pill.classList.remove('bg-brand-crimson', 'text-white', 'border-brand-crimson');
          pill.classList.add('bg-white', 'text-slate-700', 'border-brand-borderSubtle');
          if (row) row.style.display = 'none';
        } else {
          pill.classList.remove('bg-white', 'text-slate-700', 'border-brand-borderSubtle');
          pill.classList.add('bg-brand-crimson', 'text-white', 'border-brand-crimson');
          if (row) row.style.display = 'flex';
        }
      };

      window.incrementSizeCount = (size) => {
        const input = document.getElementById(`count-${size}`);
        if (input) input.value = Math.min(99, parseInt(input.value || '1', 10) + 1);
      };

      window.decrementSizeCount = (size) => {
        const input = document.getElementById(`count-${size}`);
        if (input) input.value = Math.max(1, parseInt(input.value || '1', 10) - 1);
      };

      window.calculatePricingLogic = () => {
        const input = document.getElementById('sellingPriceInput');
        if (!input) return;
        const val = parseInt(input.value, 10) || 0;
        const mrp = Math.round(val / 0.75);
        const save = mrp - val;
        const payout = Math.round(val * 0.95);
        const dspSell = document.getElementById('dspSellingPrice');
        const dspMrp = document.getElementById('dspCalculatedMRP');
        const dspSave = document.getElementById('dspCustomerSavings');
        const dspPayout = document.getElementById('dspVendorPayout');
        if (dspSell) dspSell.textContent = `₹${val.toLocaleString()}`;
        if (dspMrp) dspMrp.textContent = `₹${mrp.toLocaleString()}`;
        if (dspSave) dspSave.textContent = `₹${save.toLocaleString()} (25%)`;
        if (dspPayout) dspPayout.textContent = `₹${payout.toLocaleString()}`;
      };

      window.scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      window.handlePublishSubmit = () => {
        showToast('✨ Garment successfully listed in Nagpur Couture Catalog!');
        setTimeout(() => {
          if (navigation?.canGoBack?.()) {
            navigation.goBack();
          } else {
            navigation?.navigate?.('CatalogManager');
          }
        }, 800);
      };
    }

    const handleClick = (e) => {
      const target = e.target;
      const btn = target.closest('button, a, [role="button"], .group, input, select');

      // 1. Navigation Back Button
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
          navigation?.navigate?.('Home');
        }
        return;
      }

      // 2. Bottom Nav Links
      const navItem = target.closest('[data-path], nav a, nav button');
      if (navItem) {
        const text = navItem.textContent.toLowerCase();
        const dataPath = navItem.getAttribute('data-path') || '';
        e.preventDefault();
        e.stopPropagation();

        if (dataPath.includes('storefront') || text.includes('storefront')) {
          navigation?.navigate?.('Home');
          return;
        }
        if (dataPath.includes('bag') || text.includes('bag')) {
          navigation?.navigate?.('Cart');
          return;
        }
        if (dataPath.includes('orders') || text.includes('orders')) {
          navigation?.navigate?.('MyOrders');
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

      // 3. Header Profile Icon
      if (
        target.closest('[aria-label="Profile" i]') ||
        target.closest('img[alt="Profile" i]') ||
        (btn && btn.querySelector && btn.querySelector('img[alt="Profile" i]'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigation?.navigate?.('Profile');
        return;
      }

      // 4. Header Location Selector
      if (target.closest('[aria-label*="Location" i]') || (btn && btn.textContent && btn.textContent.includes('Sitabuldi, Nagpur'))) {
        e.preventDefault();
        e.stopPropagation();
        showToast('📍 Delivering to Sitabuldi & Dharampeth, Nagpur (45-Min Active)');
        return;
      }

      // 5. Product or Hero Card Click (Opens PDP)
      const priceElement = target.closest('[aria-label*="₹"]');
      const heroBtn = target.closest('button');
      if (
        (priceElement && !target.closest('button[aria-label="Add to bag"]')) ||
        (heroBtn && heroBtn.textContent && heroBtn.textContent.includes('View Piece'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        const label = priceElement ? priceElement.getAttribute('aria-label') : '';
        const parts = label ? label.split(',') : [];
        const title = parts[0]?.trim() || 'Royal Chanderi Zari Set';
        const priceStr = parts[1]?.replace(/[^0-9]/g, '') || '4750';
        const price = parseInt(priceStr, 10) || 4750;
        navigation?.navigate?.('ProductDetail', {
          id: 'garment-selected',
          title,
          price,
          boutiqueName: 'Dharampeth Atelier',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7S-N2WWsNXgtuAYoxV3VTKQj3zhQPJJVOqBebPKzwABDFzSMW8_Ma853uQn3Uh8t4ERL-qIjxCVuKaA1pBPZgz6Uh5jMAmjaeXXKaYzP90t225iQtt3IPiDJ6MeblM2eVZAA3a3T6fZNDtw1pbAIXEVn23GTbHNZwNTmCuADF2lyaHwYfFyFhDrB-ue-c49KvygdOgf5U9uviu-2NnPa9sZBsXaXdhFjKESwZ7jP7QBdTAo0RwlWsGg',
        });
        return;
      }

      // 6. Product Card Add to Bag Button ("+" circle button)
      if (
        btn &&
        (btn.getAttribute('aria-label') === 'Add to bag' ||
          (btn.textContent && btn.textContent.trim() === 'add') ||
          (target.textContent && target.textContent.trim() === 'add'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        const card = target.closest('.group, [class*="rounded-xl"]');
        const titleEl = card ? card.querySelector('h4, h2, h3') : null;
        const title = titleEl ? titleEl.textContent.trim() : 'Bespoke Silk Piece';
        const priceEl = card ? card.querySelector('[class*="tabular-price"], [class*="font-bold"]') : null;
        const priceStr = priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '3400';
        const price = parseInt(priceStr, 10) || 3400;

        addToCart(
          {
            id: `item-${Date.now()}`,
            name: title,
            title: title,
            price: price,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYDGM74E_WBhmoM3kL_gMs5hmfJ4_AsJW0t9hYBZkI8QR-J4ngUuy856EamXn-AHuXEbDyhGi_Ox0UjxrCGIoxnrtJYRszpNg-lF4Kr9LYMnrm8uMiUOsuoBzYNEi6PxH-oo3hYvAWl4fyGo3ybsK0jOL93juW_B-YDbBf0jnNJd6vAxf2TDJ8yO_MPrutyG7-pP4pS-EcZ2vGedezLuSiYQcj4R1B9udgJ8A8y3B7sjvJn6NwPer9Ew',
            boutiqueName: 'Pankh Atelier',
          },
          'M',
          'Sindhoor Crimson',
          1
        );
        showToast(`✨ Added "${title}" to your Bag!`);
        return;
      }

      // 7. Product Card Click (Opens PDP)
      const productCard = target.closest('.grid > div, [class*="aspect-[1/1.25]"]');
      if (productCard && !target.closest('button')) {
        const titleEl = productCard.querySelector('h4, h3, h2');
        const title = titleEl ? titleEl.textContent.trim() : 'Handcrafted Silk Look';
        const priceEl = productCard.querySelector('[class*="tabular-price"]');
        const price = priceEl ? parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 4800 : 4800;
        e.preventDefault();
        navigation?.navigate?.('ProductDetail', {
          id: `product-${Date.now()}`,
          title: title,
          price: price,
          boutiqueName: 'Studio Anamika',
        });
        return;
      }

      // 8. Product Detail Screen: Size Chip Selection
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
        showToast(`Selected Size: ${sizeChip.textContent.trim()}`);
        return;
      }

      // 9. Product Detail Screen: Color Swatch Selection
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
        showToast(`Selected Palette: ${colorName}`);
        return;
      }

      // 10. Product Detail Screen: "Add to Bag" Bottom Floating Button
      if (btn && btn.textContent && (btn.textContent.includes('Add to Bag') || btn.textContent.includes('Add to Atelier Bag'))) {
        e.preventDefault();
        e.stopPropagation();
        addToCart(
          {
            id: 'garment-chanderi-angrakha',
            name: params.title || 'Chanderi Silk Angrakha',
            title: params.title || 'Chanderi Silk Angrakha',
            price: params.price || 4800,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5WpgQNsXY8LzG4Zbdq5F-RthnwzTQ3IW1ybahamSyj4eSGXOeHMJemyAHE91tfnF373mJIqcDfA-cHnk_JyP6txaEy6DpAObexpxBaTIJ4mmlHdqbtH-upkBDBXP8KX3tYqEBv5V-Ox-5wNpsdY7z73yNzikadlIa5jK9oSmOeU9ls1VU3I196LB0Lfn9nleNXQ1ilXWU6vey5nCYpDaxC7XZ4pruGrZowV31ah2rdIni3a8-wUYDZw',
            boutiqueName: 'Studio Anamika',
          },
          'M',
          'Sindhoor Crimson',
          1
        );
        showToast('✨ Added to Bag! Tap "Bag" below to review.');
        return;
      }

      // 11. Product Detail Screen: "Try at Home Now" Button
      if (btn && btn.textContent && (btn.textContent.includes('Try at Home Now') || btn.textContent.includes('15-Min Trial'))) {
        e.preventDefault();
        e.stopPropagation();
        addToCart(
          {
            id: 'garment-chanderi-angrakha',
            name: params.title || 'Chanderi Silk Angrakha',
            title: params.title || 'Chanderi Silk Angrakha',
            price: params.price || 4800,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5WpgQNsXY8LzG4Zbdq5F-RthnwzTQ3IW1ybahamSyj4eSGXOeHMJemyAHE91tfnF373mJIqcDfA-cHnk_JyP6txaEy6DpAObexpxBaTIJ4mmlHdqbtH-upkBDBXP8KX3tYqEBv5V-Ox-5wNpsdY7z73yNzikadlIa5jK9oSmOeU9ls1VU3I196LB0Lfn9nleNXQ1ilXWU6vey5nCYpDaxC7XZ4pruGrZowV31ah2rdIni3a8-wUYDZw',
            boutiqueName: 'Studio Anamika',
          },
          'M',
          'Sindhoor Crimson',
          1
        );
        navigation?.navigate?.('Cart');
        return;
      }

      // 12. Cart Screen: "Proceed to Delivery Address" / "Proceed to Checkout"
      if (
        btn &&
        btn.textContent &&
        (btn.textContent.includes('Proceed to Nagpur Delivery') ||
          btn.textContent.includes('Proceed to Delivery') ||
          btn.textContent.includes('Add Delivery Address') ||
          btn.textContent.includes('Select Address') ||
          btn.textContent.includes('Proceed to Checkout'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigation?.navigate?.('Address');
        return;
      }

      // 13. Address Screen: "Confirm Order & Dispatch" / "Confirm Delivery"
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
        showToast('🚀 Order confirmed! Dispatching courier Sunil Kamble...');
        setTimeout(() => {
          navigation?.navigate?.('LiveTracking');
        }, 600);
        return;
      }

      // 14. Live Tracking Screen: Call Courier
      if (btn && btn.textContent && (btn.textContent.includes('Call Courier') || btn.textContent.includes('Call Sunil'))) {
        e.preventDefault();
        e.stopPropagation();
        showToast('📞 Calling Rider Sunil Kamble (+91 98220 12345)...');
        return;
      }

      // 15. Profile Screen: Theme Toggle Switch (Light <-> Dark)
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

      // 16. Profile Screen: Switch to Vendor Desk
      if (
        btn &&
        btn.textContent &&
        (btn.textContent.includes('Vendor Desk') ||
          btn.textContent.includes('Switch to Vendor Desk') ||
          btn.textContent.includes('Merchant Portal'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        setRole(ROLES.VENDOR);
        showToast('👑 Switched to Nagpur Vendor & Merchant Flow');
        return;
      }

      // 17. Vendor Flow: Switch to Customer Mode
      if (
        btn &&
        btn.textContent &&
        (btn.textContent.includes('Customer Mode') ||
          btn.textContent.includes('Switch to Customer') ||
          btn.textContent.includes('Exit Vendor Desk'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        setRole(ROLES.CUSTOMER);
        showToast('🛍️ Switched to Customer Storefront Flow');
        return;
      }

      // 18. Vendor Flow: Go to Catalogue Manager
      if (btn && btn.textContent && (btn.textContent.includes('Catalogue Manager') || btn.textContent.includes('Catalogue'))) {
        e.preventDefault();
        e.stopPropagation();
        navigation?.navigate?.('CatalogManager');
        return;
      }

      // 18b. Vendor Flow: Add New Product / Ingestion Form
      if (
        btn &&
        (btn.id === 'addPieceBtn' ||
          btn.textContent.includes('Ingest Piece') ||
          btn.textContent.includes('Add Piece') ||
          btn.textContent.includes('Add Product') ||
          btn.textContent.includes('New Listing') ||
          btn.getAttribute('aria-label') === 'Add Product' ||
          (btn.textContent.trim() === 'add' && targetKey.includes('Catalogue_Manager')))
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigation?.navigate?.('ProductIngestion');
        return;
      }

      // 18c. Product Ingestion: Publish Product CTA
      if (
        btn &&
        (btn.id === 'publishBtn' ||
          (btn.textContent && btn.textContent.includes('Publish')))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showToast('✨ Garment successfully listed in Nagpur Couture Catalog!');
        setTimeout(() => {
          if (navigation?.canGoBack?.()) {
            navigation.goBack();
          } else {
            navigation?.navigate?.('CatalogManager');
          }
        }, 800);
        return;
      }

      // 19. Vendor Flow: Order Queue -> Order Detail
      const vendorOrderCard = target.closest('[data-order-id], [class*="rounded-2xl"], [class*="rounded-xl"]');
      if (vendorOrderCard && targetKey.includes('Vendor_Order_Queue') && !target.closest('button')) {
        e.preventDefault();
        navigation?.navigate?.('VendorOrderDetail', { orderId: 'kp-ord-8291' });
        return;
      }

      // 20. Welcome Screen: "Enter Atelier" / "Explore Looks" / "Explore Storefront as Guest"
      if (
        btn &&
        (btn.getAttribute('aria-label') === 'Explore Storefront as Guest' ||
          (btn.textContent &&
            (btn.textContent.includes('Enter Atelier') ||
              btn.textContent.includes('Explore Looks') ||
              btn.textContent.includes('Explore Storefront') ||
              btn.textContent.includes('Browse Catalog') ||
              btn.textContent.includes('Explore Prêt') ||
              btn.textContent.includes('Get Started') ||
              btn.textContent.includes('Explore Nagpur'))))
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigation?.navigate?.('Home');
        return;
      }

      // 20b. Welcome Screen: "Log In to Your Account"
      if (btn && btn.textContent && (btn.textContent.includes('Log In to Your Account') || btn.textContent.includes('Log In'))) {
        e.preventDefault();
        e.stopPropagation();
        navigation?.navigate?.('Auth');
        return;
      }

      // 20c. Auth Screen: Sign in / Create Account
      if (
        btn &&
        (btn.id === 'cta-button' ||
          (btn.textContent &&
            (btn.textContent.includes('Create Account / Sign In') ||
              btn.textContent.includes('Continue with Google') ||
              btn.textContent.includes('Sign In to Atelier'))))
      ) {
        e.preventDefault();
        e.stopPropagation();
        useAuthStore.getState().signIn?.();
        showToast('✨ Signed in successfully!');
        setTimeout(() => {
          navigation?.navigate?.('Home');
        }, 300);
        return;
      }

      // 20d. Auth Screen: Boutique Onboarding link
      if (btn && btn.textContent && (btn.textContent.includes('Register') || btn.textContent.includes('Own a Boutique'))) {
        e.preventDefault();
        e.stopPropagation();
        navigation?.navigate?.('VendorRegister');
        return;
      }

      // 20e. Live Tracking: Back to Storefront
      if (btn && btn.textContent && (btn.textContent.includes('Explore More Looks') || btn.textContent.includes('Back to Storefront'))) {
        e.preventDefault();
        e.stopPropagation();
        navigation?.navigate?.('Home');
        return;
      }

      // 21. Wishlist Heart Toggle
      const wishlistBtn = target.closest('#wishlist-btn, [aria-label*="curated" i], [aria-label*="Bookmark" i]');
      if (wishlistBtn) {
        e.preventDefault();
        e.stopPropagation();
        const icon = wishlistBtn.querySelector('.material-symbols-outlined');
        if (icon) {
          const isFavorited = icon.textContent.trim() === 'favorite';
          icon.textContent = isFavorited ? 'favorite_border' : 'favorite';
          icon.style.color = isFavorited ? '' : '#C4243A';
          showToast(isFavorited ? 'Removed from favorites' : '❤️ Saved to your atelier collection');
        }
        return;
      }

      // 22. Category Pill Filter in Storefront
      const catBtn = target.closest('.no-scrollbar button, [class*="rounded-full"][class*="px-4"]');
      if (catBtn && catBtn.parentElement && catBtn.parentElement.classList.contains('no-scrollbar')) {
        e.preventDefault();
        e.stopPropagation();
        catBtn.parentElement.querySelectorAll('button').forEach((b) => {
          b.className = 'px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors';
        });
        catBtn.className = 'px-4 py-2 rounded-full bg-accent-crimson text-surface-porcelain font-eyebrow text-eyebrow uppercase tracking-wider font-semibold whitespace-nowrap shadow-sm';
        showToast(`Filtered: ${catBtn.textContent.trim()}`);
        return;
      }

      // 23. Custom Callback Action
      if (onCustomAction) {
        onCustomAction(e, target);
      }
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, [navigation, addToCart, isDark, setThemeMode, setRole, params, targetKey]);

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
