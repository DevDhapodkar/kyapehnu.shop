import {
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
import { normalizeColor } from '../../constants/colorPalette';
import { formatCurrency as formatINR } from '../../utils/format';
import { colors, radii, spacing } from '../../theme/colors';

/**
 * GarmentPreviewModal — Customer Storefront Live Preview
 * Allows boutique owners in Nagpur to see exactly how their listed couture
 * piece renders to customers on kyapehnu.shop.
 */
export default function GarmentPreviewModal({ visible, product, shopName, onClose, onEditStock }) {
  const insets = useSafeAreaInsets();

  if (!product) return null;

  const thumbnail = product.images?.[0];
  const isAvailable = Boolean(product.isAvailable ?? product.inStock);
  const totalUnits = Array.isArray(product.sizes)
    ? product.sizes.reduce(
        (sum, s) => sum + (typeof s === 'object' ? s.stock || 0 : 5),
        0
      )
    : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.scrimOverlay}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <View style={styles.headerRow}>
              <View>
                <View style={styles.badgeRow}>
                  <View style={styles.previewTag}>
                    <Text style={styles.previewTagText}>STOREFRONT PREVIEW</Text>
                  </View>
                  <Text style={styles.storeNameText}>{shopName || 'Nagpur Atelier'}</Text>
                </View>
                <Text style={styles.sheetTitle}>Customer View</Text>
              </View>
              <PressableScale
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close preview"
              >
                <MaterialIcons name="close" size={22} color={colors.textObsidian} />
              </PressableScale>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Garment Image Banner */}
            <View style={styles.imageWrap}>
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={styles.heroImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.fallbackImage}>
                  <MaterialIcons name="checkroom" size={60} color={colors.accentGold} />
                </View>
              )}

              {/* 60-Min Nagpur Express Badge */}
              <View style={styles.expressPill}>
                <MaterialIcons name="bolt" size={14} color="#FFFFFF" />
                <Text style={styles.expressText}>60-Min Nagpur Delivery</Text>
              </View>

              {/* Stock Status Badge */}
              <View
                style={[
                  styles.stockBadge,
                  isAvailable ? styles.stockBadgeAvail : styles.stockBadgeSold,
                ]}
              >
                <Text
                  style={[
                    styles.stockBadgeText,
                    { color: isAvailable ? '#15803D' : '#B91C1C' },
                  ]}
                >
                  {isAvailable ? `In Stock (${totalUnits} Units)` : 'Sold Out'}
                </Text>
              </View>
            </View>

            {/* Product Meta */}
            <View style={styles.productDetails}>
              <View style={styles.titlePriceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.garmentTitle}>{product.name}</Text>
                  <Text style={styles.categorySub}>
                    {[product.category, product.subCategory, product.material]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Text style={styles.garmentPrice}>{formatINR(product.price)}</Text>
              </View>

              {/* Delivery Guarantee Strip */}
              <View style={styles.guaranteeStrip}>
                <MaterialIcons name="verified" size={18} color={colors.accentGoldDeep} />
                <Text style={styles.guaranteeText}>
                  Doorstep Try & Buy · Sitabuldi, Dharampeth & Sadar
                </Text>
              </View>

              {/* Sizes Available */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Available Sizes</Text>
                  <View style={styles.chipsRow}>
                    {product.sizes.map((sz, idx) => {
                      const label = typeof sz === 'object' ? `${sz.size} (${sz.stock} left)` : sz;
                      return (
                        <View key={idx} style={styles.sizeChip}>
                          <Text style={styles.sizeChipText}>{label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Colors */}
              {Array.isArray(product.colors) && product.colors.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Artisan Colorways</Text>
                  <View style={styles.colorChipsRow}>
                    {product.colors.map((col, cIdx) => {
                      const norm = normalizeColor(col);
                      return (
                        <View key={cIdx} style={styles.colorItem}>
                          <View style={[styles.colorDot, { backgroundColor: norm.hex }]} />
                          <Text style={styles.colorName}>{norm.label || col}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Description */}
              {product.description ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Couture Details</Text>
                  <Text style={styles.descriptionText}>{product.description}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footerRow}>
            <PressableScale
              onPress={() => {
                onClose();
                if (onEditStock) onEditStock(product);
              }}
              style={styles.quickRestockBtn}
            >
              <MaterialIcons name="bolt" size={18} color={colors.accentCrimson} />
              <Text style={styles.quickRestockText}>Quick Restock</Text>
            </PressableScale>

            <PressableScale
              onPress={onClose}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>Close Preview</Text>
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
    backgroundColor: 'rgba(18, 18, 21, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FAF9F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.22)',
    maxHeight: '90%',
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  previewTag: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  previewTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.accentGoldDeep,
    letterSpacing: 0.5,
  },
  storeNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSlate,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textObsidian,
    letterSpacing: -0.2,
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
  imageWrap: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.18)',
  },
  heroImage: {
    width: '100%',
    height: 280,
  },
  fallbackImage: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expressPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentCrimson,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  expressText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stockBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  stockBadgeAvail: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
  },
  stockBadgeSold: {
    backgroundColor: '#FEF2F2',
    borderColor: '#B91C1C',
  },
  stockBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  productDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.16)',
    gap: 12,
  },
  titlePriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  garmentTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textObsidian,
    lineHeight: 22,
  },
  categorySub: {
    fontSize: 12.5,
    color: colors.textSlate,
    fontWeight: '600',
    marginTop: 3,
  },
  garmentPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.accentCrimson,
  },
  guaranteeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF9F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
  },
  guaranteeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.accentGoldDeep,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.textObsidian,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sizeChip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  sizeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  colorChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  colorName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textSlate,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.12)',
    gap: 12,
  },
  quickRestockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(196, 36, 58, 0.3)',
  },
  quickRestockText: {
    color: colors.accentCrimson,
    fontSize: 14,
    fontWeight: '800',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: colors.textObsidian,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
