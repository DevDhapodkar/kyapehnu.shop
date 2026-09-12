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
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';

/**
 * GarmentPreviewModal — Customer Storefront Live Preview
 * Allows boutique owners in Nagpur to see exactly how their listed couture
 * piece renders to customers on kyapehnu.shop.
 * Theme-aware with full support for Ivory Studio Light and Royal Crimson Noir.
 */
export default function GarmentPreviewModal({ visible, product, shopName, onClose, onEditStock }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FAF9F5',
              borderColor: colors.borderHairline,
              paddingBottom: Math.max(insets.bottom, 16) + 10,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.borderHairline }]}>
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(18, 18, 21, 0.18)' },
              ]}
            />
            <View style={styles.headerRow}>
              <View>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.previewTag,
                      {
                        backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : 'rgba(179, 138, 43, 0.12)',
                      },
                    ]}
                  >
                    <Text style={[styles.previewTagText, { color: colors.accentGoldDeep || '#946C18' }]}>
                      STOREFRONT PREVIEW
                    </Text>
                  </View>
                  <Text style={[styles.storeNameText, { color: colors.textSlate }]}>
                    {shopName || 'Nagpur Atelier'}
                  </Text>
                </View>
                <Text style={[styles.sheetTitle, { color: colors.textObsidian }]}>
                  Customer View
                </Text>
              </View>
              <PressableScale
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 21, 0.06)' },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close preview"
              >
                <MaterialIcons name="close" size={20} color={colors.textObsidian} />
              </PressableScale>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Garment Image Banner */}
            <View
              style={[
                styles.imageWrap,
                {
                  backgroundColor: isDark ? '#222226' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={styles.heroImage}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.fallbackImage,
                    {
                      backgroundColor: isDark ? 'rgba(200, 162, 74, 0.12)' : 'rgba(179, 138, 43, 0.08)',
                    },
                  ]}
                >
                  <MaterialIcons name="checkroom" size={60} color={colors.accentGold || '#B38A2B'} />
                </View>
              )}

              {/* 60-Min Nagpur Express Badge */}
              <View style={[styles.expressPill, { backgroundColor: colors.accentCrimson }]}>
                <MaterialIcons name="bolt" size={13} color="#FFFFFF" />
                <Text style={styles.expressText}>60-Min Nagpur Delivery</Text>
              </View>

              {/* Stock Status Badge */}
              <View
                style={[
                  styles.stockBadge,
                  isAvailable
                    ? {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4',
                        borderColor: '#10B981',
                      }
                    : {
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                        borderColor: colors.accentCrimson,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.stockBadgeText,
                    { color: isAvailable ? '#10B981' : colors.accentCrimson },
                  ]}
                >
                  {isAvailable ? `In Stock (${totalUnits} Units)` : 'Sold Out'}
                </Text>
              </View>
            </View>

            {/* Product Meta */}
            <View
              style={[
                styles.productDetails,
                {
                  backgroundColor: isDark ? colors.surfacePorcelain || '#18181C' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <View style={styles.titlePriceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.garmentTitle, { color: colors.textObsidian }]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.categorySub, { color: colors.textSlate }]}>
                    {[product.category, product.subCategory, product.material]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Text style={[styles.garmentPrice, { color: colors.accentCrimson }]}>
                  {formatINR(product.price)}
                </Text>
              </View>

              {/* Delivery Guarantee Strip */}
              <View
                style={[
                  styles.guaranteeStrip,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : (colors.groundSubtle || '#FAF9F5'),
                    borderColor: colors.borderHairline,
                  },
                ]}
              >
                <MaterialIcons name="verified" size={16} color={colors.accentGoldDeep || '#946C18'} />
                <Text style={[styles.guaranteeText, { color: colors.accentGoldDeep || '#946C18' }]}>
                  Doorstep Try & Buy · Sitabuldi, Dharampeth & Sadar
                </Text>
              </View>

              {/* Sizes Available */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.textObsidian }]}>
                    Available Sizes
                  </Text>
                  <View style={styles.chipsRow}>
                    {product.sizes.map((sz, idx) => {
                      const label = typeof sz === 'object' ? `${sz.size} (${sz.stock} left)` : sz;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.sizeChip,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                              borderColor: colors.borderHairline,
                            },
                          ]}
                        >
                          <Text style={[styles.sizeChipText, { color: colors.textObsidian }]}>
                            {label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Colors */}
              {Array.isArray(product.colors) && product.colors.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.textObsidian }]}>
                    Artisan Colorways
                  </Text>
                  <View style={styles.colorChipsRow}>
                    {product.colors.map((col, cIdx) => {
                      const norm = normalizeColor(col);
                      return (
                        <View
                          key={cIdx}
                          style={[
                            styles.colorItem,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
                              borderColor: colors.borderHairline,
                            },
                          ]}
                        >
                          <View style={[styles.colorDot, { backgroundColor: norm.hex }]} />
                          <Text style={[styles.colorName, { color: colors.textObsidian }]}>
                            {norm.label || col}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Description */}
              {product.description ? (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.textObsidian }]}>
                    Couture Details
                  </Text>
                  <Text style={[styles.descriptionText, { color: colors.textSlate }]}>
                    {product.description}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={[styles.footerRow, { borderTopColor: colors.borderHairline }]}>
            <PressableScale
              onPress={() => {
                onClose();
                if (onEditStock) onEditStock(product);
              }}
              style={[
                styles.quickRestockBtn,
                {
                  borderColor: colors.accentCrimson,
                  backgroundColor: isDark ? 'rgba(196, 36, 58, 0.15)' : 'rgba(196, 36, 58, 0.08)',
                },
              ]}
            >
              <MaterialIcons name="bolt" size={18} color={colors.accentCrimson} />
              <Text style={[styles.quickRestockText, { color: colors.accentCrimson }]}>
                Quick Restock
              </Text>
            </PressableScale>

            <PressableScale
              onPress={onClose}
              style={[
                styles.doneBtn,
                {
                  backgroundColor: isDark ? '#FFFFFF' : colors.textObsidian,
                },
              ]}
            >
              <Text
                style={[
                  styles.doneBtnText,
                  { color: isDark ? '#121215' : '#FFFFFF' },
                ]}
              >
                Close Preview
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
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  previewTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  previewTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  storeNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
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
  imageWrap: {
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  heroImage: {
    width: '100%',
    height: 280,
  },
  fallbackImage: {
    width: '100%',
    height: 220,
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
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  expressText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productDetails: {
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  titlePriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  garmentTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  categorySub: {
    fontSize: 12,
    marginTop: 3,
  },
  garmentPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  guaranteeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  guaranteeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionBlock: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sizeChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  sizeChipText: {
    fontSize: 12,
    fontWeight: '600',
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
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  colorName: {
    fontSize: 11,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  quickRestockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.full,
    paddingVertical: 12,
    borderWidth: 1,
  },
  quickRestockText: {
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    borderRadius: radii.full,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
