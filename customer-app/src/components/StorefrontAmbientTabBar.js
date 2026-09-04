import { Platform, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import CartBadge from './CartBadge';
import { colors, spacing } from '../theme/colors';

/**
 * StorefrontAmbientTabBar
 *
 * Implements Stitch's Frosted Glass Tab Bar:
 * - Floating rounded pill bar with heavy frosted backdrop blur
 * - Refracts ambient gradient orbs underneath
 * - MaterialIcons: storefront, search, shopping_bag, receipt_long
 * - Zero Emojis
 */
export default function StorefrontAmbientTabBar({
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
                <MaterialIcons
                  name={tab.iconName}
                  size={22}
                  color={isActive ? colors.accentCrimson : colors.textAsh}
                />
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
    height: 60,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
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
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
  },
  tabLabel: {
    fontSize: 9,
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
