import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from '../PressableScale';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';
import { useVendorStore } from '../../store/useVendorStore';

const QueueSvg = ({ color, size = 20 }) => (
  Platform.OS === 'web' ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ) : (
    <Feather name="file-text" size={size} color={color} />
  )
);

const CatalogueSvg = ({ color, size = 20 }) => (
  Platform.OS === 'web' ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5v15m0-15a2.5 2.5 0 00-2.5 2.5c0 1.38 1.12 2.5 2.5 2.5m0-5a2.5 2.5 0 012.5 2.5c0 1.38-1.12 2.5-2.5 2.5m-7.5 5.5l7.5-3 7.5 3v5a1 1 0 01-1 1H5.5a1 1 0 01-1-1v-5z" />
    </svg>
  ) : (
    <MaterialIcons name="checkroom" size={size} color={color} />
  )
);

const AnalyticsSvg = ({ color, size = 20 }) => (
  Platform.OS === 'web' ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ) : (
    <Feather name="bar-chart-2" size={size} color={color} />
  )
);

const StoreSvg = ({ color, size = 20 }) => (
  Platform.OS === 'web' ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25A2.25 2.25 0 010 18.75V10.5m13.5 10.5h8.25A2.25 2.25 0 0024 18.75V10.5M3.75 6.75h16.5M2.25 6.75L4.5 3h15l2.25 3.75M3.75 6.75v12a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-12" />
    </svg>
  ) : (
    <Feather name="shopping-bag" size={size} color={color} />
  )
);

/**
 * Pixel-Identical Unified Bottom Navigation matching Stitch HTML navigation across all vendor screens
 */
export default function VendorBottomNav({
  activeTab = 'orders',
  navigation,
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const pendingCount = useVendorStore(
    (state) => (Array.isArray(state?.orders) ? state.orders.filter((o) => o?.status === 'PENDING').length : 0)
  );

  const handleTabPress = (targetRoute) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    navigation.navigate(targetRoute);
  };

  const isOrdersActive = activeTab === 'orders' || activeTab === 'queue';
  const isCatalogueActive = activeTab === 'catalogue' || activeTab === 'catalog' || activeTab === 'stock';
  const isAnalyticsActive = activeTab === 'analytics';
  const isProfileActive = activeTab === 'profile' || activeTab === 'store';

  const activeColor = colors.accentCrimson || '#C4243A';
  const inactiveColor = isDark ? '#78716C' : '#78716C';

  return (
    <View
      style={[
        styles.bottomBarContainer,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          backgroundColor: isDark ? 'rgba(19, 19, 21, 0.88)' : 'rgba(255, 255, 255, 0.88)',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      <View style={styles.innerNav}>
        {/* Tab 1: Queue */}
        <PressableScale
          onPress={() => handleTabPress('VendorOrders')}
          style={styles.navTab}
          accessibilityRole="tab"
          accessibilityLabel="Queue"
        >
          <View style={styles.iconWrap}>
            <QueueSvg color={isOrdersActive ? activeColor : inactiveColor} size={20} />
            {pendingCount > 0 && (
              <View style={[styles.badgePill, { backgroundColor: activeColor, borderColor: isDark ? '#161619' : '#FFFFFF' }]}>
                <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: isOrdersActive ? activeColor : inactiveColor, fontWeight: isOrdersActive ? '600' : '400' },
            ]}
          >
            Queue
          </Text>
        </PressableScale>

        {/* Tab 2: Catalogue */}
        <PressableScale
          onPress={() => handleTabPress('CatalogManager')}
          style={styles.navTab}
          accessibilityRole="tab"
          accessibilityLabel="Catalogue"
        >
          <View style={styles.iconWrap}>
            <CatalogueSvg color={isCatalogueActive ? activeColor : inactiveColor} size={20} />
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: isCatalogueActive ? activeColor : inactiveColor, fontWeight: isCatalogueActive ? '600' : '400' },
            ]}
          >
            Catalogue
          </Text>
        </PressableScale>

        {/* Tab 3: Analytics */}
        <PressableScale
          onPress={() => handleTabPress('VendorAnalytics')}
          style={styles.navTab}
          accessibilityRole="tab"
          accessibilityLabel="Analytics"
        >
          <View style={styles.iconWrap}>
            <AnalyticsSvg color={isAnalyticsActive ? activeColor : inactiveColor} size={20} />
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: isAnalyticsActive ? activeColor : inactiveColor, fontWeight: isAnalyticsActive ? '600' : '400' },
            ]}
          >
            Analytics
          </Text>
        </PressableScale>

        {/* Tab 4: Store */}
        <PressableScale
          onPress={() => handleTabPress('VendorProfile')}
          style={styles.navTab}
          accessibilityRole="tab"
          accessibilityLabel="Store"
        >
          <View style={styles.iconWrap}>
            <StoreSvg color={isProfileActive ? activeColor : inactiveColor} size={20} />
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: isProfileActive ? activeColor : inactiveColor, fontWeight: isProfileActive ? '600' : '400' },
            ]}
          >
            Store
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    borderTopWidth: 1,
    zIndex: 50,
    ...Platform.select({
      web: {
        position: 'fixed',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  innerNav: {
    maxWidth: 512,
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  navTab: {
    minWidth: 54,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
    lineHeight: 12,
  },
  badgePill: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
