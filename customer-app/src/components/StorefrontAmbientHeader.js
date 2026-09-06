import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { colors, spacing } from '../theme/colors';
import { SET_ADDRESS_LABEL } from '../utils/deliveryPillLabel';

/**
 * StorefrontAmbientHeader
 *
 * Floating glass capsule: brand · delivery pill · profile avatar/initials.
 * Avatar never uses a hardcoded stock photo — photoURL, initials, or icon.
 * Location pill defaults to prompting for a delivery address, not a fake locality.
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
  const needsAddress = !areaLabel || areaLabel === SET_ADDRESS_LABEL;

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingTop: insets.top + 8 },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pillBar} pointerEvents="auto">
        <PressableScale
          onPress={onViewStory}
          style={styles.brandGroup}
          accessibilityRole="button"
          accessibilityLabel="View Atelier Story"
        >
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.emblemImage}
            resizeMode="cover"
          />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitle}>Kya Pehnu?</Text>
            <Text style={styles.brandSubtitle}>ATELIER</Text>
          </View>
        </PressableScale>

        <PressableScale
          onPress={onSelectLocation}
          style={[styles.locationBtn, needsAddress && styles.locationBtnPrompt]}
          accessibilityRole="button"
          accessibilityLabel={needsAddress ? 'Set delivery address' : 'Change delivery address'}
        >
          <MaterialIcons
            name={needsAddress ? 'add-location-alt' : 'near-me'}
            size={14}
            color={needsAddress ? colors.accentCrimson : colors.accentGold}
          />
          <Text
            style={[styles.locationText, needsAddress && styles.locationTextPrompt]}
            numberOfLines={1}
          >
            {areaLabel}
          </Text>
          <MaterialIcons name="expand-more" size={14} color={colors.textAsh} />
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
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : initials ? (
            <View style={styles.avatarInitials}>
              <Text style={styles.avatarInitialsText}>{initials}</Text>
            </View>
          ) : (
            <View style={styles.avatarInitials}>
              <MaterialIcons name="person" size={18} color={colors.textObsidian} />
            </View>
          )}
          {isSignedIn ? <View style={styles.crimsonStatusDot} /> : null}
        </PressableScale>
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
    paddingHorizontal: 20,
  },
  pillBar: {
    height: 56,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emblemImage: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.60)',
  },
  brandTextCol: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitle: {
    color: colors.textObsidian,
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
    color: colors.accentCrimson,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 9999,
    maxWidth: 180,
  },
  locationBtnPrompt: {
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
  },
  locationText: {
    color: colors.textObsidian,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  locationTextPrompt: {
    color: colors.accentCrimson,
    textTransform: 'none',
    letterSpacing: 0.1,
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
    borderColor: 'rgba(255, 255, 255, 0.80)',
  },
  avatarInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: colors.textObsidian,
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
    backgroundColor: colors.accentCrimson,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
