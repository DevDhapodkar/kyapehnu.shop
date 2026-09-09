import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import CartBadge from './CartBadge';
import { colors, spacing } from '../theme/colors';
import { spring } from '../theme/motion';

/**
 * TabBarItem with Apple Bouncy Pop Animation
 */
function TabBarItem({ tab, isActive, onSelect }) {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      iconScale.value = withSequence(
        withTiming(1.24, { duration: 90 }),
        withSpring(1, spring.bouncy)
      );
    }
  }, [isActive, iconScale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <PressableScale
      onPress={onSelect}
      style={styles.tabBtn}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.iconWrap, animatedIconStyle]}>
        <MaterialIcons
          name={tab.iconName}
          size={22}
          color={isActive ? colors.accentCrimson : colors.textAsh}
        />
        {tab.badge > 0 ? (
          <CartBadge count={tab.badge} style={styles.badge} />
        ) : null}
      </Animated.View>
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
}

/**
 * StorefrontTabBar
 *
 * Apple-Style Floating Frosted Glass Bottom Navigation:
 * - Explore (active)
 * - Search
 * - Bag (with live item count badge)
 * - Orders
 * - Zero Emojis (MaterialIcons throughout)
 * - Bouncy Apple physics on tab switch
 */
export default function StorefrontTabBar({
  insets,
  activeTab = 'explore',
  cartCount = 0,
  onSelectTab,
}) {
  const tabs = [
    { id: 'explore', label: 'Explore', iconName: 'storefront' },
    { id: 'search', label: 'Search', iconName: 'search' },
    { id: 'bag', label: 'Bag', iconName: 'shopping-bag', badge: cartCount },
    { id: 'orders', label: 'Orders', iconName: 'receipt-long' },
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
        {tabs.map((tab) => (
          <TabBarItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onSelect={() => onSelectTab?.(tab.id)}
          />
        ))}
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
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.10,
    shadowRadius: 36,
    elevation: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
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
