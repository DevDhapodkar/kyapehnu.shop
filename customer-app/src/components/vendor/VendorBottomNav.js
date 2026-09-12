import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from '../PressableScale';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';
import { useVendorStore } from '../../store/useVendorStore';

/**
 * Senior-Friendly Unified Bottom Navigation for Nagpur Boutique Shopkeepers
 * - Large touch targets (58px minimum)
 * - High-contrast icons & clean English text
 * - Immediate tab switching between:
 *   1. Orders (with live pending order count)
 *   2. Inventory (with catalog piece count)
 *   3. Store Profile (shop info & logout)
 */
export default function VendorBottomNav({
  activeTab = 'orders', // 'orders' | 'stock' | 'profile' | 'analytics'
  navigation,
  onPressAddPiece,
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
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
    <View
      style={[
        styles.bottomBarContainer,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: isDark ? 'rgba(22, 22, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 18, 20, 0.08)',
        },
      ]}
    >
      {/* Tab 1: Customer Orders */}
      <PressableScale
        onPress={() => handleTabPress('VendorOrders')}
        style={styles.navTab}
        accessibilityRole="tab"
        accessibilityLabel="Orders"
      >
        {activeTab === 'orders' && (
          <View style={[styles.activePill, { backgroundColor: colors.accentCrimson }]} />
        )}
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="local-shipping"
            size={24}
            color={activeTab === 'orders' ? colors.accentCrimson : (isDark ? colors.textSlate : '#6E6C75')}
          />
          {pendingCount > 0 && (
            <View style={[styles.badgePill, { backgroundColor: colors.accentCrimson, borderColor: isDark ? '#161619' : '#FFFFFF' }]}>
              <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: isDark ? colors.textSlate : '#6E6C75' },
            activeTab === 'orders' && { color: colors.accentCrimson, fontWeight: '900' },
          ]}
        >
          Orders
        </Text>
      </PressableScale>

      {/* Tab 2: Inventory */}
      <PressableScale
        onPress={() => handleTabPress('CatalogManager')}
        style={styles.navTab}
        accessibilityRole="tab"
        accessibilityLabel="Inventory"
      >
        {activeTab === 'stock' && (
          <View style={[styles.activePill, { backgroundColor: colors.accentCrimson }]} />
        )}
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="checkroom"
            size={24}
            color={activeTab === 'stock' ? colors.accentCrimson : (isDark ? colors.textSlate : '#6E6C75')}
          />
          {stockCount > 0 && (
            <View style={[styles.badgePill, { backgroundColor: colors.accentGoldDeep || '#946C18', borderColor: isDark ? '#161619' : '#FFFFFF' }]}>
              <Text style={styles.badgeText}>{stockCount}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: isDark ? colors.textSlate : '#6E6C75' },
            activeTab === 'stock' && { color: colors.accentCrimson, fontWeight: '900' },
          ]}
        >
          Inventory
        </Text>
      </PressableScale>

      {/* Tab 3: Insights & Analytics */}
      <PressableScale
        onPress={() => handleTabPress('VendorAnalytics')}
        style={styles.navTab}
        accessibilityRole="tab"
        accessibilityLabel="Analytics"
      >
        {activeTab === 'analytics' && (
          <View style={[styles.activePill, { backgroundColor: colors.accentCrimson }]} />
        )}
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="bar-chart"
            size={24}
            color={activeTab === 'analytics' ? colors.accentCrimson : (isDark ? colors.textSlate : '#6E6C75')}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: isDark ? colors.textSlate : '#6E6C75' },
            activeTab === 'analytics' && { color: colors.accentCrimson, fontWeight: '900' },
          ]}
        >
          Analytics
        </Text>
      </PressableScale>

      {/* Tab 4: Store Profile */}
      <PressableScale
        onPress={() => handleTabPress('VendorProfile')}
        style={styles.navTab}
        accessibilityRole="tab"
        accessibilityLabel="Store Profile"
      >
        {activeTab === 'profile' && (
          <View style={[styles.activePill, { backgroundColor: colors.accentCrimson }]} />
        )}
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="storefront"
            size={24}
            color={activeTab === 'profile' ? colors.accentCrimson : (isDark ? colors.textSlate : '#6E6C75')}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: isDark ? colors.textSlate : '#6E6C75' },
            activeTab === 'profile' && { color: colors.accentCrimson, fontWeight: '900' },
          ]}
        >
          Store Profile
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
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(217, 119, 6, 0.2)',
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
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: -8,
    width: 36,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: colors.accentCrimson,
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
