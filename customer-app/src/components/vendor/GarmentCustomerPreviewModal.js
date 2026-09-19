import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import PressableScale from '../PressableScale';
import { formatCurrency as formatINR } from '../../utils/format';
import { colors, spacing } from '../../theme/colors';

/**
 * GarmentCustomerPreviewModal — Live Customer Storefront Preview
 * Allows boutique owners to see exactly how customers in Nagpur experience their listing.
 */
export default function GarmentCustomerPreviewModal({ visible, product, shopName, onClose }) {
  const insets = useSafeAreaInsets();
  if (!product) return null;

  const thumbnail = product.images?.[0];
  const totalUnits = Array.isArray(product.sizes)
    ? product.sizes.reduce((sum, s) => sum + (typeof s === 'object' ? s.stock || 0 : 5), 0)
    : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.scrimOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <Text style={styles.eyebrow}>CUSTOMER STOREFRONT PREVIEW</Text>
                <Text style={styles.title}>How Customers See This</Text>
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
            contentContainerStyle={styles.scrollContent}
          >
            {/* Garment Image Card */}
            <View style={styles.imageCard}>
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.productImage} contentFit="cover" />
              ) : (
                <View style={styles.productImageFallback}>
                  <MaterialIcons name="checkroom" size={60} color={colors.accentGold} />
                </View>
              )}
              {/* Sitabuldi express delivery pill */}
              <View style={styles.expressBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.expressText}>Nagpur · 60-Min Express Delivery</Text>
              </View>
            </View>

            {/* Shop & Item Info */}
            <View style={styles.infoCard}>
              <View style={styles.shopRow}>
                <MaterialIcons name="storefront" size={16} color={colors.accentGoldDeep} />
                <Text style={styles.shopNameText}>{shopName || 'Nagpur Boutique'}</Text>
                <View style={styles.verifiedPill}>
                  <MaterialIcons name="verified" size={12} color="#15803D" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>

              <Text style={styles.garmentTitle}>{product.name}</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{formatINR(product.price)}</Text>
                {product.mrp && product.mrp > product.price && (
                  <Text style={styles.mrpText}>{formatINR(product.mrp)}</Text>
                )}
                <View style={styles.stockStatusBadge}>
                  <Text style={styles.stockStatusText}>
                    {totalUnits > 0 ? `${totalUnits} in stock` : 'Out of stock'}
                  </Text>
                </View>
              </View>

              {product.material || product.subCategory ? (
                <Text style={styles.fabricText}>
                  {[product.material, product.subCategory].filter(Boolean).join(' · ')}
                </Text>
              ) : null}

              {/* Sizes Available */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <View style={styles.sizesSection}>
                  <Text style={styles.sizesHeading}>Available Sizes</Text>
                  <View style={styles.sizesRow}>
                    {product.sizes.map((s, idx) => {
                      const szLabel = typeof s === 'object' ? s.size : String(s);
                      const szQty = typeof s === 'object' ? s.stock : null;
                      return (
                        <View key={idx} style={styles.sizeChip}>
                          <Text style={styles.sizeChipText}>{szLabel}</Text>
                          {szQty !== null && <Text style={styles.sizeChipSub}>({szQty})</Text>}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Trust Badges */}
              <View style={styles.trustGrid}>
                <View style={styles.trustItem}>
                  <MaterialIcons name="local-shipping" size={18} color={colors.accentCrimson} />
                  <Text style={styles.trustItemText}>Porter 60m Delivery</Text>
                </View>
                <View style={styles.trustItem}>
                  <MaterialIcons name="payments" size={18} color={colors.accentGoldDeep} />
                  <Text style={styles.trustItemText}>Cash on Delivery</Text>
                </View>
                <View style={styles.trustItem}>
                  <MaterialIcons name="check-circle" size={18} color="#15803D" />
                  <Text style={styles.trustItemText}>Easy Exchanges</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <View style={styles.footer}>
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
  modalSheet: {
    backgroundColor: '#FAF9F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.22)',
    maxHeight: '88%',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 20,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.12)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(18, 18, 21, 0.18)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.accentCrimson,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textObsidian,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(18, 18, 21, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
  },
  imageCard: {
    position: 'relative',
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3EFE6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expressBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 18, 21, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  expressText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.16)',
    gap: 8,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.accentGoldDeep,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  garmentTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textObsidian,
    lineHeight: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.accentCrimson,
  },
  mrpText: {
    fontSize: 14,
    color: colors.textAsh,
    textDecorationLine: 'line-through',
  },
  stockStatusBadge: {
    marginLeft: 'auto',
    backgroundColor: '#F3EFE6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSlate,
  },
  fabricText: {
    fontSize: 12.5,
    color: colors.textSlate,
  },
  sizesSection: {
    marginTop: 6,
    gap: 6,
  },
  sizesHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textObsidian,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 21, 0.12)',
  },
  sizeChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  sizeChipSub: {
    fontSize: 11,
    color: colors.textSlate,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(18, 18, 21, 0.08)',
  },
  trustItem: {
    alignItems: 'center',
    gap: 4,
  },
  trustItemText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSlate,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
  },
  doneBtn: {
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
