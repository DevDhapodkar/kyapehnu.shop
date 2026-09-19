import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/colors';

const THEME_STORAGE_KEY = '@kyapehnu/theme_mode';

export const useThemeStore = create((set, get) => ({
  themeMode: 'light', // 'light' | 'dark'
  isDark: false,
  colors: lightTheme,

  initTheme: async () => {
    try {
      let saved = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      } else {
        saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      }

      if (saved === 'dark' || saved === 'light') {
        get().setThemeMode(saved);
      } else {
        get().setThemeMode('light');
      }
    } catch (e) {
      console.warn('[Theme] Could not load saved theme:', e);
    }
  },

  setThemeMode: (mode) => {
    const isDark = mode === 'dark';
    const activeColors = isDark ? darkTheme : lightTheme;

    if (typeof globalThis !== 'undefined') {
      globalThis.__KYAPEHNU_ACTIVE_THEME__ = activeColors;
    }

    set({
      themeMode: mode,
      isDark,
      colors: activeColors,
    });

    try {
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          window.localStorage.setItem(THEME_STORAGE_KEY, mode);
        }
        if (document.documentElement) {
          if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.style.backgroundColor = activeColors.groundBase;
            if (document.body) document.body.style.backgroundColor = activeColors.groundBase;
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.backgroundColor = activeColors.groundBase;
            if (document.body) document.body.style.backgroundColor = activeColors.groundBase;
          }
        }
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', activeColors.groundBase);
        }
      }
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
    } catch (e) {
      console.warn('[Theme] Storage sync error:', e);
    }
  },

  toggleTheme: () => {
    const next = get().themeMode === 'dark' ? 'light' : 'dark';
    get().setThemeMode(next);
  },
}));

if (typeof window !== 'undefined') {
  window.__KYAPEHNU_THEME_STORE__ = useThemeStore;
  window.__KYA_PEHNU_TOGGLE_THEME__ = () => useThemeStore.getState().toggleTheme();
}

export default useThemeStore;
