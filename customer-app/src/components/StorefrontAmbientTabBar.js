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
import { useTheme } from '../theme/useTheme';
import { spring } from '../theme/motion';

function TabItem({ tab, isActive, onPress, colors }) {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      iconScale.value = withSequence(
        withTiming(1.2, { duration: 90 }),
        withSpring(1, spring.bouncy)
      );
    }
  }, [isActive, iconScale]);

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
          <View style={[styles.badge, { backgroundColor: colors.accentCrimson }]}>
            <Text style={styles.badgeText}>{tab.badge}</Text>
          </View>
        ) : null}
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? colors.accentCrimson : colors.textAsh,
            fontWeight: isActive ? '700' : '500',
          },
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
 * - Refracts ambient gradient orbs underneath in Light & Dark modes
 * - MaterialIcons: storefront, search, shopping_bag, receipt_long
 * - Active tab highlighted in Royal Crimson (#C4243A) with Apple spring bounce
 */
export default function StorefrontAmbientTabBar({
  insets,
  activeTab = 'explore',
  cartCount = 0,
  onSelectTab,
}) {
  const { colors, isDark } = useTheme();

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
        { paddingBottom: Math.max(insets.bottom + 8, 20) },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: isDark ? 'rgba(20, 20, 24, 0.88)' : 'rgba(255, 255, 255, 0.65)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
            shadowColor: isDark ? '#000000' : '#121215',
          },
        ]}
        pointerEvents="auto"
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onSelectTab?.(tab.id)}
            colors={colors}
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
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 36,
    elevation: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(36px) saturate(210%) brightness(104%)',
        WebkitBackdropFilter: 'blur(36px) saturate(210%) brightness(104%)',
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
});
