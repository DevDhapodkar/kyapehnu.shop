import { Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import CartBadge from './CartBadge';
import { colors, spacing } from '../theme/colors';

/**
 * StorefrontTabBar
 *
 * Apple-Style Floating Frosted Glass Bottom Navigation:
 * - Explore (active)
 * - Search
 * - Bag (with live item count badge)
 * - Orders
 */
export default function StorefrontTabBar({
  insets,
  activeTab = 'explore',
  cartCount = 0,
  onSelectTab,
}) {
  const tabs = [
    { id: 'explore', label: 'Explore', icon: '🏪' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'bag', label: 'Bag', icon: '👜', badge: cartCount },
    { id: 'orders', label: 'Orders', icon: '🧾' },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.navBar} pointerEvents="auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <PressableScale
              key={tab.id}
              onPress={() => onSelectTab?.(tab.id)}
              style={styles.tabBtn}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                {tab.badge > 0 ? (
                  <CartBadge count={tab.badge} style={styles.badge} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
  },
  navBar: {
    width: '100%',
    maxWidth: 380,
    height: 62,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  labelActive: {
    color: colors.accentCrimson,
  },
  labelInactive: {
    color: colors.textAsh,
  },
});
