import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PressableScale from './PressableScale';
import { useTheme } from '../theme/useTheme';
import { SET_ADDRESS_LABEL } from '../utils/deliveryPillLabel';

/**
 * StorefrontAmbientHeader
 *
 * Floating glass capsule: brand · delivery pill · theme toggle · profile avatar.
 * Adheres to Stitch's "Ivory Studio Luxury" and "Royal Crimson & Gold Noir" designs.
 */
export default function StorefrontAmbientHeader({
  insets,
  areaLabel = SET_ADDRESS_LABEL,
  onSelectLocation,
  onOpenProfile,
  onViewStory,
  avatarUri = null,
  initials = '',
  isSignedIn = false,
}) {
  const { colors, isDark, toggleTheme } = useTheme();
  const needsAddress = !areaLabel || areaLabel === SET_ADDRESS_LABEL;

  const handleToggleTheme = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleTheme();
  };

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingTop: insets.top + 8 },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.pillBar,
          {
            backgroundColor: isDark ? 'rgba(20, 20, 24, 0.85)' : 'rgba(255, 255, 255, 0.65)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
            shadowColor: isDark ? '#000000' : '#121215',
          },
        ]}
        pointerEvents="auto"
      >
        <PressableScale
          onPress={onViewStory}
          style={styles.brandGroup}
          accessibilityRole="button"
          accessibilityLabel="View Atelier Story"
        >
          <Image
            source={require('../../assets/images/brand-emblem.png')}
            style={[
              styles.emblemImage,
              { borderColor: isDark ? 'rgba(200, 162, 74, 0.4)' : 'rgba(255, 255, 255, 0.80)' },
            ]}
            resizeMode="cover"
          />
          <View style={styles.brandTextCol}>
            <Text style={[styles.brandTitle, { color: colors.textObsidian }]}>Kya Pehnu?</Text>
            <Text style={[styles.brandSubtitle, { color: colors.accentCrimson }]}>ATELIER</Text>
          </View>
        </PressableScale>

        <PressableScale
          onPress={onSelectLocation}
          style={[
            styles.locationBtn,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.45)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
            needsAddress && styles.locationBtnPrompt,
          ]}
          accessibilityRole="button"
          accessibilityLabel={needsAddress ? 'Set delivery address' : 'Change delivery address'}
        >
          <MaterialIcons
            name={needsAddress ? 'add-location-alt' : 'near-me'}
            size={13}
            color={needsAddress ? colors.accentCrimson : colors.accentGold}
          />
          <Text
            style={[
              styles.locationText,
              { color: colors.textObsidian },
              needsAddress && styles.locationTextPrompt,
            ]}
            numberOfLines={1}
          >
            {areaLabel}
          </Text>
          <MaterialIcons name="expand-more" size={13} color={colors.textAsh} />
        </PressableScale>

        <View style={styles.rightActionsRow}>
          {/* Quick Theme Switcher Button */}
          <PressableScale
            onPress={handleToggleTheme}
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 18, 20, 0.06)',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            <MaterialIcons
              name={isDark ? 'light-mode' : 'dark-mode'}
              size={16}
              color={isDark ? colors.accentGold : colors.textObsidian}
            />
          </PressableScale>

          <PressableScale
            onPress={onOpenProfile}
            style={styles.avatarBtn}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[
                  styles.avatarImage,
                  { borderColor: isDark ? 'rgba(200, 162, 74, 0.4)' : 'rgba(255, 255, 255, 0.85)' },
                ]}
                resizeMode="cover"
              />
            ) : initials ? (
              <View
                style={[
                  styles.avatarInitials,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.75)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.85)',
                  },
                ]}
              >
                <Text style={[styles.avatarInitialsText, { color: colors.textObsidian }]}>{initials}</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.avatarInitials,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.75)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.85)',
                  },
                ]}
              >
                <MaterialIcons name="person" size={17} color={colors.textObsidian} />
              </View>
            )}
            {isSignedIn ? <View style={[styles.crimsonStatusDot, { borderColor: colors.groundBase }]} /> : null}
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
  },
  pillBar: {
    height: 56,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emblemImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  brandTextCol: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 16,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', 'Playfair Display', Georgia, serif",
    }),
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 9999,
    borderWidth: 1,
    maxWidth: 155,
  },
  locationBtnPrompt: {
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
  },
  locationText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  locationTextPrompt: {
    color: '#C4243A',
    textTransform: 'none',
    letterSpacing: 0.1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  crimsonStatusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C4243A',
    borderWidth: 1.5,
  },
});
