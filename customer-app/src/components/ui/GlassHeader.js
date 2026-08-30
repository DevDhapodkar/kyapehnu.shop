import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassPanel from './GlassPanel';
import IconButton from './IconButton';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/** What a screen must clear so its content starts below the floating bar. */
export const GLASS_HEADER_HEIGHT = 56;

/**
 * GlassHeader
 *
 * The navigation bar, as a pane of glass that floats over the screen's content
 * rather than a solid strip above it.
 *
 * Every screen draws one of these instead of the platform header. A native
 * header is an opaque bar the app cannot make out of glass — it would cut a
 * flat band across the aurora at the top of every screen, and it is most of why
 * the interface read as a dark Material app. This bar blurs whatever scrolls
 * beneath it, and the wallpaper runs edge to edge behind the status bar.
 *
 * Content scrolls *under* it, so a screen pads its scroll content by
 * `insets.top + GLASS_HEADER_HEIGHT`.
 */
export default function GlassHeader({ title, onBack, right, style }) {
  const insets = useSafeAreaInsets();

  return (
    <GlassPanel
      tone="thick"
      // Square: this pane is flush to three screen edges, and a rounded corner
      // against the status bar would show the wallpaper through a notch.
      radius={0}
      style={[styles.bar, styles.row, { paddingTop: insets.top }, style]}
    >
      <View style={styles.side}>
        {onBack ? (
          <IconButton
            glyph="‹"
            tone="glass"
            size={38}
            glyphSize={26}
            onPress={onBack}
            accessibilityLabel="Back"
          />
        ) : null}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      {/* Mirrors the leading slot's width so the title stays optically centred
          whether or not there is a trailing action. */}
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  side: {
    width: 46,
    height: GLASS_HEADER_HEIGHT - 12,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
    color: colors.ivory,
  },
});
