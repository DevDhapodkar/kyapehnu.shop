import { useThemeStore } from '../store/useThemeStore';

/**
 * Hook to access the current theme tokens and theme switching functions.
 * Reactive: causes component to re-render when the user toggles between
 * Ivory Studio Luxury (Light) and Royal Crimson & Gold Noir (Dark).
 */
export function useTheme() {
  const themeMode = useThemeStore((state) => state.themeMode);
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);

  return {
    themeMode,
    isDark,
    colors,
    toggleTheme,
    setThemeMode,
  };
}

export default useTheme;
