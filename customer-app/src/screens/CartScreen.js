import { Image } from 'expo-image';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassButton from '../components/GlassButton';
import PressableScale from '../components/PressableScale';
import { formatINR } from '../data/mockStores';
import { selectCartItems, selectCartTotal, useCartStore } from '../store/useCartStore';
import { DELIVERY_FEE } from '../config/checkout';
import useAuthStore from '../store/useAuthStore';
import { selection, impactMedium, notifyError } from '../utils/haptics';
import { colors, radii, spacing } from '../theme/colors';

// Closing the gap a removed line leaves is the list's job — the surviving rows
// slide up to fill it instead of snapping. Built at module scope so the builder
// isn't recreated every render.
const ROW_LAYOUT = LinearTransition.duration(240);

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const cartItems = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectCartTotal);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));

  const empty = cartItems.length === 0;
  const total = empty ? 0 : subtotal + DELIVERY_FEE;

  /**
   * The bag is a review screen now: it gates on sign-in and hands off to the
   * delivery-address screen, where the buyer drops a map pin and fills their
   * address before the order is actually placed.
   */
  const handleConfirm = () => {
    if (!isLoggedIn) {
      notifyError();
      Alert.alert('Sign in to order', 'Please sign in to place your order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Auth', { mode: 'signin' }) },
      ]);
      return;
    }
    navigation.navigate('Address');
  };

  if (empty) {
    return (
      <View style={styles.emptyRoot}>
        <Text style={styles.emptyGlyph}>◇</Text>
        <Text style={styles.emptyTitle}>Your bag is empty.</Text>
        <Text style={styles.emptyBody}>
          Nothing picked yet. The nearest shop is under a kilometre away.
        </Text>
        <GlassButton
          label="Browse Nearby"
          variant="ghost"
          onPress={() => navigation.navigate('Home')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.FlatList
        data={cartItems}
        keyExtractor={(item) => item.key}
        itemLayoutAnimation={ROW_LAYOUT}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 230 },
        ]}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            {cartItems.length} {cartItems.length === 1 ? 'piece' : 'pieces'} from{' '}
            {new Set(cartItems.map((item) => item.storeId)).size} store
            {new Set(cartItems.map((item) => item.storeId)).size === 1 ? '' : 's'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.line}>
            <View pointerEvents="none" style={styles.lineFill} />
            <View pointerEvents="none" style={styles.lineHighlight} />

            <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />

            <View style={styles.lineBody}>
              <Text style={styles.lineName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.lineMeta}>
                {item.size ? `${item.size}  ·  ` : ''}
                {item.colorway}
              </Text>
              <Text style={styles.lineStore} numberOfLines={1}>
                {item.storeName}
              </Text>

              <View style={styles.lineFooter}>
                <View style={styles.stepper}>
                  <PressableScale
                    haptic={false}
                    onPress={() => {
                      selection();
                      removeFromCart(item.key);
                    }}
                    accessibilityLabel="Decrease quantity"
                    hitSlop={6}
                    style={styles.stepButton}
                  >
                    <Text style={styles.stepGlyph}>−</Text>
                  </PressableScale>
                  <Text style={styles.stepCount}>{item.quantity}</Text>
                  <PressableScale
                    haptic={false}
                    onPress={() => {
                      selection();
                      addToCart(item, item.size);
                    }}
                    accessibilityLabel="Increase quantity"
                    hitSlop={6}
                    style={styles.stepButton}
                  >
                    <Text style={styles.stepGlyph}>+</Text>
                  </PressableScale>
                </View>

                <Text style={styles.linePrice}>
                  {formatINR(item.price * item.quantity)}
                </Text>
              </View>
            </View>

            <PressableScale
              onPress={() => {
                impactMedium();
                removeFromCart(item.key, { all: true });
              }}
              haptic={false}
              accessibilityLabel={`Remove ${item.name}`}
              hitSlop={10}
              wrapperStyle={styles.remove}
            >
              <Text style={styles.removeGlyph}>×</Text>
            </PressableScale>
          </View>
        )}
      />

      {/* Docked summary. */}
      <View style={[styles.summary, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View pointerEvents="none" style={styles.summaryFill} />
        <View pointerEvents="none" style={styles.summaryHighlight} />

        <SummaryRow label="Subtotal" value={formatINR(subtotal)} />
        <SummaryRow label="Delivery (Porter)" value={formatINR(DELIVERY_FEE)} />
        <SummaryRow label="Payment" value="Cash on Delivery" />

        <View style={styles.summaryDivider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatINR(total)}</Text>
        </View>

        <GlassButton
          label="Add Delivery Address"
          onPress={handleConfirm}
          caption={`${formatINR(total)}  ·  cash on delivery`}
          style={styles.confirm}
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },

  emptyRoot: {
    flex: 1,
    backgroundColor: colors.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyGlyph: {
    color: colors.graphite,
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.ivory,
    fontSize: 22,
    fontWeight: '300',
    marginBottom: spacing.xs,
  },
  emptyBody: {
    color: colors.ash,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.lg,
  },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  listHeader: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },

  line: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  lineFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFill,
  },
  lineHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  thumb: {
    width: 76,
    height: 100,
    borderRadius: radii.sm,
    backgroundColor: colors.charcoalLight,
  },
  lineBody: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingRight: spacing.md,
  },
  lineName: {
    color: colors.ivory,
    fontSize: 15,
    fontWeight: '400',
  },
  lineMeta: {
    color: colors.platinum,
    fontSize: 12,
    marginTop: 3,
  },
  lineStore: {
    color: colors.slate,
    fontSize: 11,
    marginTop: 2,
  },
  lineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.charcoal,
  },
  stepButton: {
    width: 30,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: {
    color: colors.ivory,
    fontSize: 16,
    lineHeight: 19,
  },
  stepCount: {
    color: colors.ivory,
    fontSize: 13,
    minWidth: 18,
    textAlign: 'center',
  },
  linePrice: {
    color: colors.ivory,
    fontSize: 15,
    fontWeight: '600',
  },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.sm,
  },
  removeGlyph: {
    color: colors.slate,
    fontSize: 20,
    lineHeight: 22,
  },

  summary: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
    overflow: 'hidden',
  },
  summaryFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFillStrong,
  },
  summaryHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    color: colors.ash,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.platinum,
    fontSize: 13,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 2.5,
  },
  totalValue: {
    color: colors.ivory,
    fontSize: 24,
    fontWeight: '600',
  },
  confirm: {
    width: '100%',
  },
});
