import { useEffect } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../theme/colors';

/**
 * OutOfDeliveryZoneModal — Stitch Apple Glass Out-of-Bounds Error Sheet
 *
 * Thrown whenever a customer's delivery destination is outside Porter's 
 * Nagpur same-city rapid delivery network (~25km radius).
 *
 * Senior-friendly, high-contrast, zero-emoji, with 1-tap interactive resolution.
 */
export default function OutOfDeliveryZoneModal({
  visible,
  onClose,
  onPinOnMap,
  error,
  distanceKm,
  pincode,
  city,
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [visible]);

  if (!visible) return null;

  const displayMessage =
    error ||
    "Porter's intra-city rapid delivery network currently operates within a 25km radius of Nagpur. Kya Pehnu 60-minute express trial is exclusively available in Nagpur city.";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.scrimOverlay}>
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.sheetHandle} />

          {/* Close Header */}
          <View style={styles.headerRow}>
            <View style={styles.tagBadge}>
              <MaterialIcons name="radar" size={12} color="#D92D20" />
              <Text style={styles.tagBadgeText}>NAGPUR SAME-CITY ONLY</Text>
            </View>
            <PressableScale
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Dismiss warning dialog"
            >
              <MaterialIcons name="close" size={20} color={colors.textObsidian} />
            </PressableScale>
          </View>

          {/* Hero Halo Badge */}
          <View style={styles.heroHaloOuter}>
            <View style={styles.heroHaloInner}>
              <MaterialIcons name="wrong-location" size={36} color="#D92D20" />
            </View>
          </View>

          {/* Title & Explanation */}
          <View style={styles.contentWrap}>
            <Text style={styles.sheetTitle}>Outside Delivery Network</Text>
            <Text style={styles.sheetSubtitle}>{displayMessage}</Text>
          </View>

          {/* Coverage Diagnostic Card */}
          <View style={styles.diagnosticCard}>
            <View style={styles.diagnosticRow}>
              <MaterialIcons name="navigation" size={16} color={colors.accentGoldDeep} />
              <Text style={styles.diagnosticLabel}>Porter Rapid Courier Limit</Text>
              <Text style={styles.diagnosticValue}>25 km Radius</Text>
            </View>

            <View style={styles.diagnosticDivider} />

            <View style={styles.diagnosticRow}>
              <MaterialIcons name="location-city" size={16} color={colors.accentGoldDeep} />
              <Text style={styles.diagnosticLabel}>Active Hub</Text>
              <Text style={styles.diagnosticValue}>Nagpur Metro</Text>
            </View>

            {distanceKm != null && distanceKm > 0 ? (
              <>
                <View style={styles.diagnosticDivider} />
                <View style={styles.diagnosticRow}>
                  <MaterialIcons name="straighten" size={16} color="#D92D20" />
                  <Text style={[styles.diagnosticLabel, styles.errorText]}>Your Pin Distance</Text>
                  <Text style={[styles.diagnosticValue, styles.errorText]}>
                    {Math.round(distanceKm)} km from center
                  </Text>
                </View>
              </>
            ) : null}

            {pincode ? (
              <>
                <View style={styles.diagnosticDivider} />
                <View style={styles.diagnosticRow}>
                  <MaterialIcons name="mail-outline" size={16} color="#D92D20" />
                  <Text style={[styles.diagnosticLabel, styles.errorText]}>Entered Pincode</Text>
                  <Text style={[styles.diagnosticValue, styles.errorText]}>{pincode}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Action CTAs */}
          <View style={styles.actionsCol}>
            {onPinOnMap ? (
              <PressableScale
                onPress={() => {
                  onClose();
                  onPinOnMap();
                }}
                style={styles.primaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Pin address inside Nagpur on the map"
              >
                <MaterialIcons name="add-location-alt" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>PIN ADDRESS IN NAGPUR</Text>
              </PressableScale>
            ) : null}

            <PressableScale
              onPress={onClose}
              style={styles.secondaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Dismiss modal and change address"
            >
              <Text style={styles.secondaryBtnText}>
                {onPinOnMap ? 'Update Address Details' : 'Understood'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrimOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 21, 0.65)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  sheetContainer: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 45, 32, 0.25)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 24,
    ...Platform.select({
      web: {
        maxWidth: 540,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  sheetHandle: {
    width: 40,
    height: 4.5,
    borderRadius: radii.full,
    backgroundColor: 'rgba(18, 18, 21, 0.18)',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(217, 45, 32, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(217, 45, 32, 0.24)',
  },
  tagBadgeText: {
    color: '#D92D20',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 18, 21, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHaloOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(217, 45, 32, 0.08)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 45, 32, 0.20)',
  },
  heroHaloInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(217, 45, 32, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 6,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textObsidian,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textSlate,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  diagnosticCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 21, 0.08)',
    marginBottom: spacing.lg,
    gap: 8,
  },
  diagnosticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  diagnosticLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSlate,
    flex: 1,
    marginLeft: 4,
  },
  diagnosticValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  errorText: {
    color: '#D92D20',
  },
  diagnosticDivider: {
    height: 1,
    backgroundColor: 'rgba(18, 18, 21, 0.06)',
    marginVertical: 2,
  },
  actionsCol: {
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: radii.full,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(18, 18, 21, 0.05)',
    borderRadius: radii.full,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 21, 0.10)',
  },
  secondaryBtnText: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '700',
  },
});
