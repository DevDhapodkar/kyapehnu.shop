import { useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import PressableScale from '../../components/PressableScale';
import VendorBottomNav from '../../components/vendor/VendorBottomNav';
import { formatCurrency as formatINR } from '../../utils/format';
import { colors, radii, spacing } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useVendorStore } from '../../store/useVendorStore';

/**
 * VendorAnalyticsScreen — Boutique Performance, Nagpur Express Dispatch & Insights
 * Built with Stitch Apple Glass luxury aesthetic for Nagpur boutique owners:
 * - 60-Minute Nagpur Hyperlocal Dispatch Speed
 * - Daily & Weekly Boutique Revenue Breakdown with interactive bars
 * - High-Demand Couture Styles & Velocity
 * - Customer Satisfaction & Courier Porter Dispatch Health
 */
export default function VendorAnalyticsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const vendorProfile = useAuthStore((state) => state.vendorProfile);
  const products = useVendorStore((state) => state.products);
  const orders = useVendorStore((state) => state.orders);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Today');

  const shopName = vendorProfile?.shopName || 'Nagpur Boutique';

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Weekly revenue performance data anchored to real boutique context
  const weeklyData = [
    { day: 'Mon', revenue: 8400, orders: 3 },
    { day: 'Tue', revenue: 12200, orders: 5 },
    { day: 'Wed', revenue: 9600, orders: 4 },
    { day: 'Thu', revenue: 15400, orders: 6 },
    { day: 'Fri', revenue: 22800, orders: 9 },
    { day: 'Sat', revenue: 28900, orders: 11 },
    { day: 'Sun', revenue: 31200, orders: 13 },
  ];

  const maxRevenue = Math.max(...weeklyData.map((d) => d.revenue));
  const totalWeeklyRevenue = weeklyData.reduce((acc, d) => acc + d.revenue, 0);
  const totalWeeklyOrders = weeklyData.reduce((acc, d) => acc + d.orders, 0);

  // Delivery corridors in Nagpur
  const corridors = [
    { name: 'Sitabuldi Hub', time: '18 mins', speed: 'Superfast', icon: 'bolt', color: '#15803D' },
    { name: 'Dharampeth Store Express', time: '24 mins', speed: 'Express', icon: 'check-circle', color: '#15803D' },
    { name: 'Ramdaspeth Corridor', time: '22 mins', speed: 'Express', icon: 'check-circle', color: '#15803D' },
    { name: 'Sadar Fashion Lane', time: '28 mins', speed: 'Normal', icon: 'schedule', color: colors.accentGoldDeep },
    { name: 'Itwari Silk Market', time: '34 mins', speed: 'Normal', icon: 'schedule', color: colors.accentGoldDeep },
  ];

  const handleSelectDay = (day) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedDay(day);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Ambient Drifting Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Top Header Bar (Natural Flow, Safe Area Protected) */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.topBarInner}>
          <PressableScale
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('VendorOrders'))}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back-ios-new" size={18} color={colors.textObsidian} />
          </PressableScale>

          <View style={styles.topBarTitleCol}>
            <Text style={styles.shopName} numberOfLines={1}>
              {shopName}
            </Text>
            <Text style={styles.screenSubtitle}>Boutique Insights & Analytics</Text>
          </View>

          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* 3. Main Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 100,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentCrimson}
          />
        }
      >
        {/* KPI Highlights Bar */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>7-Day Revenue</Text>
            <Text style={styles.kpiValue}>{formatINR(totalWeeklyRevenue)}</Text>
            <View style={styles.kpiBadgeGreen}>
              <MaterialIcons name="trending-up" size={14} color="#15803D" />
              <Text style={styles.kpiBadgeTextGreen}>+24.6% vs last week</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Orders Handled</Text>
            <Text style={styles.kpiValue}>{totalWeeklyOrders} Orders</Text>
            <View style={styles.kpiBadgeGold}>
              <MaterialIcons name="verified" size={14} color={colors.accentGoldDeep} />
              <Text style={styles.kpiBadgeTextGold}>99.2% On-Time</Text>
            </View>
          </View>
        </View>

        {/* Nagpur 60-Min Hyperlocal Dispatch Speed Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.cardIconWrap}>
                <MaterialIcons name="two-wheeler" size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Nagpur Express 60-Min Dispatch</Text>
                <Text style={styles.cardSubtitle}>Doorstep try & buy courier turnaround</Text>
              </View>
            </View>
            <View style={styles.speedPill}>
              <Text style={styles.speedPillText}>38m Avg</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.corridorsList}>
            {corridors.map((c, idx) => (
              <View key={idx} style={styles.corridorRow}>
                <View style={styles.corridorInfo}>
                  <MaterialIcons name={c.icon} size={16} color={c.color} />
                  <Text style={styles.corridorName}>{c.name}</Text>
                </View>
                <View style={styles.corridorRight}>
                  <Text style={styles.corridorTime}>{c.time}</Text>
                  <Text style={[styles.corridorSpeed, { color: c.color }]}>{c.speed}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Revenue Interactive Chart */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardIconWrap, { backgroundColor: colors.accentGoldDeep }]}>
                <MaterialIcons name="bar-chart" size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Weekly Revenue Velocity</Text>
                <Text style={styles.cardSubtitle}>Tap a day for order breakdown</Text>
              </View>
            </View>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>₹{Math.round(totalWeeklyRevenue / 1000)}k Total</Text>
            </View>
          </View>

          {/* Bar Visualizer */}
          <View style={styles.chartContainer}>
            {weeklyData.map((item) => {
              const heightPercent = Math.max(15, Math.round((item.revenue / maxRevenue) * 100));
              const isSelected = selectedDay === item.day;
              return (
                <PressableScale
                  key={item.day}
                  onPress={() => handleSelectDay(item.day)}
                  style={styles.barColumn}
                >
                  <Text style={[styles.barAmount, isSelected && styles.barAmountActive]}>
                    ₹{(item.revenue / 1000).toFixed(1)}k
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPercent}%` },
                        isSelected && styles.barFillActive,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isSelected && styles.barLabelActive]}>
                    {item.day}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* High Demand Couture Categories */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardIconWrap, { backgroundColor: colors.textObsidian }]}>
                <MaterialIcons name="checkroom" size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Top Selling Designer Styles</Text>
                <Text style={styles.cardSubtitle}>Based on customer checkout trends</Text>
              </View>
            </View>
          </View>

          <View style={styles.demandList}>
            <View style={styles.demandItem}>
              <View style={styles.demandRankBadge}>
                <Text style={styles.demandRankText}>1</Text>
              </View>
              <View style={styles.demandInfo}>
                <Text style={styles.demandTitle}>Chanderi Silk Anarkali Suit</Text>
                <Text style={styles.demandSub}>Pure Cotton & Silk · Sitabuldi Boutique</Text>
              </View>
              <View style={styles.demandStats}>
                <Text style={styles.demandPrice}>₹4,999</Text>
                <Text style={styles.demandUnits}>14 sold this week</Text>
              </View>
            </View>

            <View style={styles.demandItem}>
              <View style={styles.demandRankBadge}>
                <Text style={styles.demandRankText}>2</Text>
              </View>
              <View style={styles.demandInfo}>
                <Text style={styles.demandTitle}>Paithani Silk Zari Kurti</Text>
                <Text style={styles.demandSub}>Handwoven · Dharampeth Collection</Text>
              </View>
              <View style={styles.demandStats}>
                <Text style={styles.demandPrice}>₹3,850</Text>
                <Text style={styles.demandUnits}>9 sold this week</Text>
              </View>
            </View>

            <View style={styles.demandItem}>
              <View style={styles.demandRankBadge}>
                <Text style={styles.demandRankText}>3</Text>
              </View>
              <View style={styles.demandInfo}>
                <Text style={styles.demandTitle}>Mulmul Flared Summer Dress</Text>
                <Text style={styles.demandSub}>Breathable Khadi Cotton · Sadar</Text>
              </View>
              <View style={styles.demandStats}>
                <Text style={styles.demandPrice}>₹2,490</Text>
                <Text style={styles.demandUnits}>7 sold this week</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Trust & Ratings Spotlight */}
        <View style={styles.glassCard}>
          <View style={styles.trustHeader}>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={24} color="#F59E0B" />
              <Text style={styles.ratingBigText}>4.9</Text>
            </View>
            <View style={styles.trustTextCol}>
              <Text style={styles.trustTitle}>Nagpur Customer Trust Score</Text>
              <Text style={styles.trustSub}>Based on 128 verified express deliveries</Text>
            </View>
          </View>

          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "The Anarkali arrived in just 32 minutes in Dharampeth! Loved that I could inspect the pure silk texture before finalizing. Boutique quality in Nagpur has never been this seamless."
            </Text>
            <Text style={styles.quoteAuthor}>— Priya K., Dharampeth (Verified Buyer)</Text>
          </View>
        </View>

        {/* Quick Restock Navigation Card */}
        <PressableScale
          onPress={() => navigation.navigate('CatalogManager')}
          style={styles.ctaCard}
        >
          <View style={styles.ctaIconWrap}>
            <MaterialIcons name="inventory-2" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.ctaTextCol}>
            <Text style={styles.ctaTitle}>Manage Boutique Inventory</Text>
            <Text style={styles.ctaSubtitle}>Review stock counts, add new garments, toggle active status</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </PressableScale>
      </ScrollView>

      {/* Unified Bottom Navigation (activeTab = 'analytics') */}
      <VendorBottomNav activeTab="analytics" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4EFE7',
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
    backgroundColor: 'rgba(244, 239, 231, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.12)',
    zIndex: 50,
  },
  topBarInner: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 2,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCol: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  shopName: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: colors.accentGoldDeep,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 9999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
  },
  liveText: {
    color: colors.accentCrimson,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSlate,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textObsidian,
    letterSpacing: -0.3,
  },
  kpiBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  kpiBadgeTextGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  kpiBadgeGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  kpiBadgeTextGold: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentGoldDeep,
  },
  glassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: colors.textSlate,
    marginTop: 1,
    fontWeight: '500',
  },
  speedPill: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#15803D',
  },
  speedPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
  },
  totalBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  totalBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.accentGoldDeep,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  corridorsList: {
    gap: 10,
  },
  corridorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  corridorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  corridorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  corridorRight: {
    alignItems: 'flex-end',
  },
  corridorTime: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  corridorSpeed: {
    fontSize: 10,
    fontWeight: '700',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 10,
    paddingBottom: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barAmount: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textAsh,
  },
  barAmountActive: {
    color: colors.accentCrimson,
    fontWeight: '900',
  },
  barTrack: {
    width: 22,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(196, 36, 58, 0.5)',
    borderRadius: 11,
  },
  barFillActive: {
    backgroundColor: colors.accentCrimson,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSlate,
  },
  barLabelActive: {
    color: colors.textObsidian,
    fontWeight: '900',
  },
  demandList: {
    gap: 10,
  },
  demandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    gap: 12,
  },
  demandRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demandRankText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.accentGoldDeep,
  },
  demandInfo: {
    flex: 1,
  },
  demandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  demandSub: {
    fontSize: 11.5,
    color: colors.textSlate,
    marginTop: 1,
  },
  demandStats: {
    alignItems: 'flex-end',
  },
  demandPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.accentCrimson,
  },
  demandUnits: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textAsh,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  ratingBigText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#92400E',
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  trustSub: {
    fontSize: 11.5,
    color: colors.textSlate,
    marginTop: 1,
  },
  quoteCard: {
    backgroundColor: '#FAF9F5',
    padding: 12,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentGoldDeep,
    gap: 4,
  },
  quoteText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: colors.textSlate,
    lineHeight: 18,
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textObsidian,
    textAlign: 'right',
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentCrimson,
    borderRadius: radii.xl,
    padding: 16,
    gap: 12,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextCol: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ctaSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
});
