import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import ListingComposer from '../../components/vendor/ListingComposer';
import { Chip, EmptyState, Surface } from '../../components/ui';
import { colors, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import useVendorStore from '../../store/useVendorStore';
import { formatCurrency } from '../../utils/format';

// How a listing's moderation status reads to the vendor, and its tint.
const REVIEW_STATUS = {
  PENDING_QC: { label: 'In review', tint: colors.amber },
  APPROVED: { label: 'Live', tint: colors.mint },
  REJECTED: { label: 'Rejected', tint: colors.crimsonBright },
  ARCHIVED: { label: 'Archived', tint: colors.slate },
  DRAFT: { label: 'Draft', tint: colors.slate },
};

/**
 * Catalog manager: flip a listing in or out of stock, and add a new one.
 *
 * Availability is the primary job — it is the control a shop reaches for a
 * dozen times a day — so it lives on every row as a switch with no confirmation
 * step, and the row is sized around it. Composing a listing is the rarer,
 * heavier task, so it sits behind a pill at the top of the list.
 */
export default function CatalogManagerScreen() {
  const products = useVendorStore((state) => state.products);
  const loading = useVendorStore((state) => state.catalogLoading);
  const error = useVendorStore((state) => state.catalogError);
  const pendingProductId = useVendorStore((state) => state.pendingProductId);
  const loadCatalog = useVendorStore((state) => state.loadCatalog);
  const toggleAvailability = useVendorStore((state) => state.toggleAvailability);
  const addProduct = useVendorStore((state) => state.addProduct);

  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const onToggle = useCallback(
    async (product, next) => {
      try {
        await toggleAvailability(product._id, next);
      } catch (err) {
        Alert.alert('Could not update', err.message);
      }
    },
    [toggleAvailability]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const inStock = item.isAvailable;
      const review = REVIEW_STATUS[item.status] ?? null;

      return (
        <Surface tone="surface" radius={radii.lg} elevation="low" style={styles.row}>
          <View style={styles.rowBody}>
            <View style={styles.rowText}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.productMeta} numberOfLines={1}>
                {item.category} · {formatCurrency(item.price)}
                {item.sizes?.length ? ` · ${item.sizes.map((s) => s.size).join(' / ')}` : ''}
              </Text>

              <View style={styles.badgeRow}>
                {review ? <Chip label={review.label} tint={review.tint} size="sm" /> : null}
                <Chip
                  label={inStock ? 'In stock' : 'Out of stock'}
                  tone="surface"
                  size="sm"
                  style={!inStock && styles.badgeMuted}
                />
              </View>

              {item.status === 'REJECTED' && item.qc?.reason ? (
                <Text style={styles.rejectReason}>{item.qc.reason}</Text>
              ) : null}
            </View>

            {pendingProductId === item._id ? (
              <ActivityIndicator color={colors.platinum} style={styles.rowSpinner} />
            ) : (
              <Switch
                value={inStock}
                onValueChange={(next) => onToggle(item, next)}
                accessibilityLabel={`${item.name} availability`}
                trackColor={{ false: colors.surfaceHigh, true: colors.iris }}
                thumbColor={colors.ivory}
                ios_backgroundColor={colors.surfaceHigh}
              />
            )}
          </View>
        </Surface>
      );
    },
    [onToggle, pendingProductId]
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCatalog}
            tintColor={colors.platinum}
            colors={[colors.platinum]}
            progressBackgroundColor={colors.surface}
          />
        }
        ListHeaderComponent={
          <View>
            {error ? (
              <Surface tone="surface" radius={radii.lg} elevation="low" style={styles.banner}>
                <Text style={styles.bannerTitle}>Catalog out of sync</Text>
                <Text style={styles.bannerBody}>{error}</Text>
              </Surface>
            ) : null}

            <ListingComposer
              open={composerOpen}
              onToggle={() => setComposerOpen((open) => !open)}
              onSubmit={addProduct}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              glyph="◇"
              title="No listings yet"
              body="Add your first product and it appears in the customer flow straight away."
            />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  banner: {
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.amber,
  },
  bannerBody: {
    ...typography.caption,
    color: colors.ash,
    marginTop: 4,
  },
  row: {
    padding: spacing.md - 4,
    marginBottom: spacing.sm,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowSpinner: {
    width: 51, // matches the Switch footprint so rows don't jump mid-toggle
  },
  productName: {
    ...typography.h3,
    color: colors.ivory,
  },
  productMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.ash,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xs + 2,
  },
  badgeMuted: {
    opacity: 0.6,
  },
  rejectReason: {
    ...typography.caption,
    fontSize: 11,
    color: colors.ash,
    marginTop: 6,
  },
});
