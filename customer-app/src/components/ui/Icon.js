// Imported from the family's own module rather than the package barrel: the
// barrel pulls in every icon set @expo/vector-icons ships, and Metro then
// bundles all ~20 font files (≈3.5 MB) into the APK instead of Feather's 56 KB.
import Feather from '@expo/vector-icons/Feather';

import { colors } from '../../theme/colors';

/**
 * Icon
 *
 * One icon set for the whole app — Feather, because its 2px hairline stroke is
 * the same weight as the app's borders and dividers, so glyphs sit in the
 * layout instead of on top of it. Routing every icon through here means a set
 * swap is a one-line change and no screen can smuggle in a second style.
 *
 * Sizes are a scale rather than free numbers, so a glyph beside a label always
 * matches its cap height.
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 40,
};

export default function Icon({ name, size = 'md', color = colors.platinum, style }) {
  const resolved = typeof size === 'number' ? size : (ICON_SIZES[size] ?? ICON_SIZES.md);

  return <Feather name={name} size={resolved} color={color} style={style} />;
}
