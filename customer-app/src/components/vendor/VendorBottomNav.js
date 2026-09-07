import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from '../PressableScale';
import { colors } from '../../theme/colors';
import { useVendorStore } from '../../store/useVendorStore';

/**
 * Senior-Friendly Unified Bottom Navigation for Nagpur Boutique Shopkeepers
 * - Large touch targets (58px minimum)
 * - High-contrast icons & clean English text
 * - Immediate tab switching between:
 *   1. 📦 Customer Orders (with live order count)
 *   2. 👗 Inventory (with catalog piece count)
 *   3. 👤 Store Profile (shop info & logout)
 */
export default function VendorBottomNav({
  activeTab = 'orders', // 'orders' | 'stock' | 'profile'
  navigation,
  onPressAddPiece,
}) {
  const insets = useSafeAreaInsets();
  const pendingCount = useVendorStore(
    (state) => (Array.isArray(state?.orders) ? state.orders.filter((o) => o?.status === 'PENDING').length : 0)
  );
  const stockCount = useVendorStore(
    (state) => (Array.isArray(state?.products) ? state.products.length : 0)
  );

  const handleTabPress = (targetRoute) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    navigation.navigate(targetRoute);
  };

  return (
    <View style={[styles.bottomBarContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Tab 1: Customer Orders */}
      <PressableScale
        onPress={() => handleTabPress('VendorOrders')}
        style={[styles.navTab, activeTab === 'orders' && styles.navTabActive]}
        accessibilityRole="tab"
        accessibilityLabel="Orders"
      >
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="local-shipping"
            size={24}
            color={activeTab === 'orders' ? colors.accentCrimson : colors.textSlate}
          />
          {pendingCount > 0 && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>
          📦 Orders
        </Text>
      </PressableScale>

      {/* Tab 2: Inventory */}
      <PressableScale
        onPress={() => handleTabPress('CatalogManager')}
        style={[styles.navTab, activeTab === 'stock' && styles.navTabActive]}
        accessibilityRole="tab"
        accessibilityLabel="Inventory"
      >
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="checkroom"
            size={24}
            color={activeTab === 'stock' ? colors.accentCrimson : colors.textSlate}
          />
          {stockCount > 0 && (
            <View style={[styles.badgePill, styles.stockBadgePill]}>
              <Text style={styles.badgeText}>{stockCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, activeTab === 'stock' && styles.tabLabelActive]}>
          👗 Inventory
        </Text>
      </PressableScale>

      {/* Tab 3: Store Profile */}
      <PressableScale
        onPress={() => handleTabPress('VendorProfile')}
        style={[styles.navTab, activeTab === 'profile' && styles.navTabActive]}
        accessibilityRole="tab"
        accessibilityLabel="Store Profile"
      >
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="storefront"
            size={24}
            color={activeTab === 'profile' ? colors.accentCrimson : colors.textSlate}
          />
        </View>
        <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
          👤 Store Profile
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: 'rgba(217, 119, 6, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 100,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },
  navTabActive: {
    borderTopColor: colors.accentCrimson,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSlate,
  },
  tabLabelActive: {
    color: colors.accentCrimson,
    fontWeight: '900',
  },
  badgePill: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  stockBadgePill: {
    backgroundColor: colors.accentGoldDeep,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
