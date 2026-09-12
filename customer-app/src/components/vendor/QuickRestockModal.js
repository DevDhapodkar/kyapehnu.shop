import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from '../PressableScale';
import { formatCurrency as formatINR } from '../../utils/format';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';

/**
 * Senior-Friendly Quick Restock & Size Units Adjuster
 * Designed for Nagpur boutique shopkeepers to update stock units in seconds.
 * Fully theme-aware supporting Ivory Studio Light and Royal Crimson Noir.
 */
export default function QuickRestockModal({ visible, product, onClose, onSave }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [sizeStocks, setSizeStocks] = useState({});
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;

    setIsAvailable(Boolean(product.isAvailable ?? product.inStock));

    // Initialize size stocks mapping
    const initial = {};
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      product.sizes.forEach((s) => {
        if (typeof s === 'object' && s !== null) {
          initial[s.size] = typeof s.stock === 'number' ? s.stock : 5;
        } else {
          initial[String(s)] = 5;
        }
      });
    } else {
      ['S', 'M', 'L'].forEach((sz) => {
        initial[sz] = 5;
      });
    }
    setSizeStocks(initial);
  }, [product]);

  if (!product) return null;

  const handleAdjustUnit = (sizeKey, delta) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSizeStocks((prev) => {
      const current = prev[sizeKey] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [sizeKey]: next };
    });
  };

  const handleBatchAdd = (amount) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSizeStocks((prev) => {
      const next = {};
      Object.keys(prev).forEach((sz) => {
        next[sz] = Math.max(0, (prev[sz] || 0) + amount);
      });
      return next;
    });
  };

  const totalUnits = Object.values(sizeStocks).reduce((sum, n) => sum + (Number(n) || 0), 0);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      const updatedSizes = Object.entries(sizeStocks).map(([size, stock]) => ({
        size,
        stock: Number(stock) || 0,
      }));
      await onSave({
        productId: product._id,
        sizes: updatedSizes,
        isAvailable: totalUnits > 0 ? isAvailable : false,
      });
      onClose();
    } catch (err) {
      console.warn('[QuickRestockModal] save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const thumbnail = product.images?.[0];

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
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FAF9F5',
              borderColor: colors.borderHairline,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.borderHairline }]}>
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(18, 18, 21, 0.18)' },
              ]}
            />
            <View style={styles.headerRow}>
              <View style={styles.titleCol}>
                <Text style={[styles.sheetTitle, { color: colors.textObsidian }]}>
                  Quick Restock & Sizes
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textAsh }]}>
                  Update stock counts in 1-tap
                </Text>
              </View>
              <PressableScale
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 21, 0.06)' },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close restock modal"
              >
                <MaterialIcons name="close" size={20} color={colors.textObsidian} />
              </PressableScale>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Product Summary Header Card */}
            <View
              style={[
                styles.productSnippetCard,
                {
                  backgroundColor: isDark ? colors.surfacePorcelain || '#18181C' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.productThumb} contentFit="cover" />
              ) : (
                <View
                  style={[
                    styles.productThumbFallback,
                    {
                      backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : 'rgba(179, 138, 43, 0.1)',
                    },
                  ]}
                >
                  <MaterialIcons name="checkroom" size={24} color={colors.accentGold || '#B38A2B'} />
                </View>
              )}
              <View style={styles.productSnippetInfo}>
                <Text style={[styles.productName, { color: colors.textObsidian }]} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={[styles.productPrice, { color: colors.accentCrimson }]}>
                  {formatINR(product.price)}
                </Text>
                <Text style={[styles.totalUnitsBadge, { color: colors.textSlate }]}>
                  Total: {totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'} available
                </Text>
              </View>
            </View>

            {/* Quick Batch Actions */}
            <View style={styles.batchActionRow}>
              <Text style={[styles.batchActionLabel, { color: colors.textSlate }]}>Quick Adjust:</Text>
              <PressableScale
                onPress={() => handleBatchAdd(5)}
                style={[
                  styles.batchBtn,
                  {
                    backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : 'rgba(179, 138, 43, 0.1)',
                    borderColor: isDark ? 'rgba(200, 162, 74, 0.3)' : 'rgba(179, 138, 43, 0.25)',
                  },
                ]}
              >
                <Text style={[styles.batchBtnText, { color: colors.accentGoldDeep || '#946C18' }]}>
                  +5 to All Sizes
                </Text>
              </PressableScale>
              <PressableScale
                onPress={() => handleBatchAdd(10)}
                style={[
                  styles.batchBtn,
                  {
                    backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : 'rgba(179, 138, 43, 0.1)',
                    borderColor: isDark ? 'rgba(200, 162, 74, 0.3)' : 'rgba(179, 138, 43, 0.25)',
                  },
                ]}
              >
                <Text style={[styles.batchBtnText, { color: colors.accentGoldDeep || '#946C18' }]}>
                  +10 to All
                </Text>
              </PressableScale>
            </View>

            {/* Size Steppers Grid */}
            <View style={styles.sizesSection}>
              <Text style={[styles.sectionHeader, { color: colors.textObsidian }]}>
                Garment Sizes & Quantities
              </Text>
              <View style={styles.sizesGrid}>
                {Object.keys(sizeStocks).map((sizeKey) => {
                  const qty = sizeStocks[sizeKey] || 0;
                  return (
                    <View
                      key={sizeKey}
                      style={[
                        styles.sizeStepperCard,
                        {
                          backgroundColor: isDark ? colors.surfacePorcelain || '#18181C' : '#FFFFFF',
                          borderColor: colors.borderHairline,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.sizeBadge,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 21, 0.05)',
                          },
                        ]}
                      >
                        <Text style={[styles.sizeBadgeText, { color: colors.textObsidian }]}>
                          {sizeKey}
                        </Text>
                      </View>
                      <View style={styles.stepperControls}>
                        <PressableScale
                          onPress={() => handleAdjustUnit(sizeKey, -1)}
                          style={[
                            styles.stepperBtn,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 21, 0.06)',
                            },
                            qty === 0 && styles.stepperBtnDisabled,
                          ]}
                          disabled={qty === 0}
                        >
                          <MaterialIcons
                            name="remove"
                            size={18}
                            color={qty === 0 ? colors.textAsh : colors.textObsidian}
                          />
                        </PressableScale>
                        <View style={styles.qtyBox}>
                          <Text
                            style={[
                              styles.qtyText,
                              { color: colors.textObsidian },
                              qty === 0 && { color: colors.textAsh },
                            ]}
                          >
                            {qty}
                          </Text>
                        </View>
                        <PressableScale
                          onPress={() => handleAdjustUnit(sizeKey, 1)}
                          style={[
                            styles.stepperBtn,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 21, 0.06)',
                            },
                          ]}
                        >
                          <MaterialIcons name="add" size={18} color={colors.textObsidian} />
                        </PressableScale>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Availability Switch Pill */}
            <PressableScale
              onPress={() => setIsAvailable((prev) => !prev)}
              style={[
                styles.availabilityPill,
                isAvailable
                  ? {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
                      borderColor: '#10B981',
                    }
                  : {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                      borderColor: colors.accentCrimson,
                    },
              ]}
            >
              <MaterialIcons
                name={isAvailable ? 'check-circle' : 'pause-circle-filled'}
                size={22}
                color={isAvailable ? '#10B981' : colors.accentCrimson}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.availPillTitle,
                    { color: isAvailable ? '#10B981' : colors.accentCrimson },
                  ]}
                >
                  {isAvailable ? 'Listing is Active (In Stock)' : 'Listing is Paused (Out of Stock)'}
                </Text>
                <Text style={[styles.availPillSub, { color: colors.textSlate }]}>
                  {isAvailable
                    ? 'Customers in Nagpur can buy this piece right now.'
                    : 'Hidden from checkout until you mark in stock.'}
                </Text>
              </View>
            </PressableScale>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.sheetFooter, { borderTopColor: colors.borderHairline }]}>
            <PressableScale
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.accentCrimson }]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="save" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Stock Changes</Text>
                </>
              )}
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
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '85%',
    ...Platform.select({
      web: {
        boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  sheetHeader: {
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleCol: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: spacing.md,
    gap: 16,
  },
  productSnippetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    gap: 12,
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
  },
  productThumbFallback: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productSnippetInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalUnitsBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  batchActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchActionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  batchBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  batchBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sizesSection: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sizesGrid: {
    gap: 8,
  },
  sizeStepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  sizeBadge: {
    minWidth: 40,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  qtyBox: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
  },
  availPillTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  availPillSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sheetFooter: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  saveBtn: {
    borderRadius: radii.full,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
