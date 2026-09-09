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
import { colors, radii, spacing } from '../../theme/colors';

/**
 * Senior-Friendly Quick Restock & Size Units Adjuster
 * Designed for Nagpur boutique shopkeepers to update stock units in seconds.
 */
export default function QuickRestockModal({ visible, product, onClose, onSave }) {
  const insets = useSafeAreaInsets();
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
      // Default common sizes if none configured
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
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          {/* Header Bar */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <View style={styles.headerRow}>
              <View style={styles.titleCol}>
                <Text style={styles.sheetTitle}>Quick Restock & Sizes</Text>
                <Text style={styles.sheetSubtitle}>Update stock counts in 1-tap</Text>
              </View>
              <PressableScale
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close restock modal"
              >
                <MaterialIcons name="close" size={22} color={colors.textObsidian} />
              </PressableScale>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Product Summary Header Card */}
            <View style={styles.productSnippetCard}>
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.productThumb} contentFit="cover" />
              ) : (
                <View style={styles.productThumbFallback}>
                  <MaterialIcons name="checkroom" size={24} color={colors.accentGold} />
                </View>
              )}
              <View style={styles.productSnippetInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>{formatINR(product.price)}</Text>
                <Text style={styles.totalUnitsBadge}>
                  Total: {totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'} available
                </Text>
              </View>
            </View>

            {/* Quick Batch Actions */}
            <View style={styles.batchActionRow}>
              <Text style={styles.batchActionLabel}>Quick Adjust:</Text>
              <PressableScale
                onPress={() => handleBatchAdd(5)}
                style={styles.batchBtn}
              >
                <Text style={styles.batchBtnText}>+5 to All Sizes</Text>
              </PressableScale>
              <PressableScale
                onPress={() => handleBatchAdd(10)}
                style={styles.batchBtn}
              >
                <Text style={styles.batchBtnText}>+10 to All</Text>
              </PressableScale>
            </View>

            {/* Size Steppers Grid */}
            <View style={styles.sizesSection}>
              <Text style={styles.sectionHeader}>Garment Sizes & Quantities</Text>
              <View style={styles.sizesGrid}>
                {Object.keys(sizeStocks).map((sizeKey) => {
                  const qty = sizeStocks[sizeKey] || 0;
                  return (
                    <View key={sizeKey} style={styles.sizeStepperCard}>
                      <View style={styles.sizeBadge}>
                        <Text style={styles.sizeBadgeText}>{sizeKey}</Text>
                      </View>
                      <View style={styles.stepperControls}>
                        <PressableScale
                          onPress={() => handleAdjustUnit(sizeKey, -1)}
                          style={[styles.stepperBtn, qty === 0 && styles.stepperBtnDisabled]}
                          disabled={qty === 0}
                        >
                          <MaterialIcons
                            name="remove"
                            size={18}
                            color={qty === 0 ? colors.textAsh : colors.textObsidian}
                          />
                        </PressableScale>
                        <View style={styles.qtyBox}>
                          <Text style={[styles.qtyText, qty === 0 && styles.qtyTextZero]}>
                            {qty}
                          </Text>
                        </View>
                        <PressableScale
                          onPress={() => handleAdjustUnit(sizeKey, 1)}
                          style={styles.stepperBtn}
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
                isAvailable ? styles.availPillActive : styles.availPillInactive,
              ]}
            >
              <MaterialIcons
                name={isAvailable ? 'check-circle' : 'pause-circle-filled'}
                size={22}
                color={isAvailable ? '#15803D' : '#B91C1C'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.availPillTitle,
                    { color: isAvailable ? '#15803D' : '#B91C1C' },
                  ]}
                >
                  {isAvailable ? 'Listing is Active (In Stock)' : 'Listing is Paused (Out of Stock)'}
                </Text>
                <Text style={styles.availPillSub}>
                  {isAvailable
                    ? 'Customers in Nagpur can buy this piece right now.'
                    : 'Hidden from checkout until you mark in stock.'}
                </Text>
              </View>
            </PressableScale>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.sheetFooter}>
            <PressableScale
              onPress={handleSave}
              style={styles.saveBtn}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#FFFFFF" />
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
    backgroundColor: 'rgba(18, 18, 21, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FAF9F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.22)',
    maxHeight: '85%',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHeader: {
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.12)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(18, 18, 21, 0.18)',
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.textObsidian,
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: colors.textSlate,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 18, 21, 0.06)',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.16)',
    gap: 12,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  productThumbFallback: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productSnippetInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accentCrimson,
  },
  totalUnitsBadge: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSlate,
  },
  batchActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSlate,
  },
  batchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  batchBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.accentGoldDeep,
  },
  sizesSection: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textObsidian,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  sizesGrid: {
    gap: 10,
  },
  sizeStepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 21, 0.08)',
  },
  sizeBadge: {
    minWidth: 44,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(18, 18, 21, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 18, 21, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  qtyBox: {
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  qtyTextZero: {
    color: colors.textAsh,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
  },
  availPillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
  },
  availPillInactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#B91C1C',
  },
  availPillTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  availPillSub: {
    fontSize: 11,
    color: colors.textSlate,
    marginTop: 2,
  },
  sheetFooter: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.12)',
  },
  saveBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
