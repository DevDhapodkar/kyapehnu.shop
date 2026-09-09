import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { colors, spacing } from '../theme/colors';
import { spring } from '../theme/motion';

function TabItem({ tab, isActive, onPress }) {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      iconScale.value = withSequence(
        withTiming(1.2, { duration: 90 }),
        withSpring(1, spring.bouncy)
      );
    }
  }, [isActive]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      style={styles.tabBtn}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.iconWrap, animatedIconStyle]}>
        <MaterialIcons
          name={tab.iconName}
          size={21}
          color={isActive ? colors.accentCrimson : colors.textAsh}
        />
        {tab.badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tab.badge}</Text>
          </View>
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
 * StorefrontAmbientTabBar
 *
 * Implements Stitch's Frosted Glass Tab Bar:
 * - Floating rounded pill bar with heavy frosted backdrop blur
 * - Refracts ambient gradient orbs underneath
 * - MaterialIcons: storefront, search, shopping_bag, receipt_long
 * - Active tab highlighted in Royal Crimson (#C4243A) with Apple spring bounce
 */
export default function StorefrontAmbientTabBar({
  insets,
  activeTab = 'explore',
  cartCount = 2,
  onSelectTab,
}) {
  const tabs = [
    { id: 'explore', label: 'Explore', iconName: 'storefront' },
    { id: 'search', label: 'Search', iconName: 'search' },
    { id: 'bag', label: 'Bag', iconName: 'shopping-bag', badge: cartCount ?? 2 },
    { id: 'orders', label: 'Orders', iconName: 'receipt-long' },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom + 8, 20) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.navBar} pointerEvents="auto">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onSelectTab?.(tab.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navBar: {
    width: '100%',
    maxWidth: 380,
    height: 58,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 36,
    elevation: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(36px) saturate(210%) brightness(104%)',
        WebkitBackdropFilter: 'blur(36px) saturate(210%) brightness(104%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 24px 48px -12px rgba(18, 18, 20, 0.12)',
      },
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 44,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  labelActive: {
    color: colors.accentCrimson,
    fontWeight: '700',
  },
  labelInactive: {
    color: colors.textAsh,
    fontWeight: '500',
  },
});
