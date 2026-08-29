import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedNumber,
  Button,
  Divider,
  Gradient,
  Icon,
  IconButton,
  LiveDot,
  ProgressBar,
} from '../components/ui';
import { NAGPUR_CENTER, formatINR, mockStores } from '../data/mockStores';
import { obsidianMapStyle } from '../theme/mapStyle';
import { colors, radii, spacing } from '../theme/colors';
import { duration, easing, elevation, reduceMotion, type } from '../theme/tokens';

/** Delivery address stand-in — the Wathoda belt near Symbiosis Institute of Technology. */
const DESTINATION = {
  latitude: 21.0972,
  longitude: 79.147,
  label: 'Wathoda Ring Road, Nagpur',
};

/** How often the mock Porter driver advances one step along the route. */
const TICK_MS = 1200;
/** Steps interpolated between each pair of waypoints. */
const STEPS_PER_LEG = 14;

/**
 * Builds a dense coordinate list from a handful of waypoints so the driver
 * marker glides instead of jumping. Real coordinates will arrive over the
 * Firebase channel described in ARCHITECTURE.md; the shape stays identical.
 */
function buildRoute(from, to) {
  // Two intermediate waypoints, nudged off the straight line, so the path bends
  // the way a road would rather than reading as a ruler.
  const waypoints = [
    from,
    {
      latitude: from.latitude + (to.latitude - from.latitude) * 0.35 - 0.006,
      longitude: from.longitude + (to.longitude - from.longitude) * 0.35 + 0.004,
    },
    {
      latitude: from.latitude + (to.latitude - from.latitude) * 0.7 + 0.005,
      longitude: from.longitude + (to.longitude - from.longitude) * 0.7 + 0.002,
    },
    to,
  ];

  const path = [];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    for (let step = 0; step < STEPS_PER_LEG; step += 1) {
      const t = step / STEPS_PER_LEG;
      path.push({
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
      });
    }
  }
  path.push(waypoints[waypoints.length - 1]);
  return path;
}

/** The four legs of a delivery, each with the glyph that names it. */
function stageFor(progress) {
  if (progress < 0.05) {
    return { label: 'Picked up', detail: 'Rider has collected your order.', icon: 'package' };
  }
  if (progress < 0.55) {
    return { label: 'On the way', detail: 'Moving through Nagpur traffic.', icon: 'navigation' };
  }
  if (progress < 0.95) {
    return { label: 'Almost there', detail: 'Two turns from your street.', icon: 'corner-up-right' };
  }
  return { label: 'Arriving now', detail: 'Rider is at your door.', icon: 'home' };
}

export default function LiveTrackingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const order = route.params?.order ?? null;

  // Pickup point: the store the first line item came from, falling back to the
  // Sitabuldi shop so the screen is demoable without going through checkout.
  const pickup = useMemo(() => {
    const fromOrder = order?.items?.[0]?.storeCoordinates;
    if (fromOrder) {
      return { ...fromOrder, label: order.items[0].storeName };
    }
    const fallback = mockStores[1];
    return { ...fallback.coordinates, label: fallback.name };
  }, [order]);

  const routeCoords = useMemo(() => buildRoute(pickup, DESTINATION), [pickup]);

  const [index, setIndex] = useState(0);
  const driver = routeCoords[Math.min(index, routeCoords.length - 1)];
  const progress = routeCoords.length > 1 ? index / (routeCoords.length - 1) : 1;
  const stage = stageFor(progress);
  const minutesLeft = Math.max(1, Math.round((1 - progress) * 34));
  const arrived = progress >= 1;

  // Mock telemetry: advance one step per tick and stop at the destination.
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) =>
        current >= routeCoords.length - 1 ? current : current + 1,
      );
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [routeCoords.length]);

  // Keep the driver in frame without fighting the user's own panning: only
  // recentre every few steps.
  useEffect(() => {
    if (!mapRef.current || index % 6 !== 0) return;
    mapRef.current.animateCamera({ center: driver }, { duration: 900 });
  }, [index, driver]);

  // The rider marker breathes so it is findable on a busy map at a glance —
  // a static dot is indistinguishable from a place pin.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration.pulse, easing: easing.out, ...reduceMotion }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.4 * (1 - pulse.value),
    transform: [{ scale: 0.6 + pulse.value * 1.4 }],
  }));

  const initialRegion = {
    latitude: (pickup.latitude + DESTINATION.latitude) / 2 || NAGPUR_CENTER.latitude,
    longitude: (pickup.longitude + DESTINATION.longitude) / 2 || NAGPUR_CENTER.longitude,
    latitudeDelta: Math.abs(pickup.latitude - DESTINATION.latitude) * 2.6 + 0.05,
    longitudeDelta: Math.abs(pickup.longitude - DESTINATION.longitude) * 2.6 + 0.05,
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // Apple Maps on iOS honours userInterfaceStyle; Google on Android takes
        // the custom JSON style instead.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        customMapStyle={obsidianMapStyle}
        userInterfaceStyle="dark"
        initialRegion={initialRegion}
        showsPointsOfInterest={false}
        showsTraffic={false}
        toolbarEnabled={false}
      >
        <Polyline
          coordinates={routeCoords}
          strokeColor={colors.crimsonBright}
          strokeWidth={3}
          lineDashPattern={[6, 8]}
        />

        {/* Pickup */}
        <Marker coordinate={pickup} title="Picked up from" description={pickup.label}>
          <View style={styles.pickupMarker}>
            <Icon name="shopping-bag" size="xs" color={colors.gold} />
          </View>
        </Marker>

        {/* Destination */}
        <Marker coordinate={DESTINATION} title="Delivery address" description={DESTINATION.label}>
          <View style={styles.destMarker}>
            <View style={styles.destCore} />
          </View>
        </Marker>

        {/* Porter rider */}
        <Marker
          coordinate={driver}
          title="Porter rider"
          description={`${stage.label} · ${minutesLeft} min away`}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
        >
          <View style={styles.driverMarker}>
            <Animated.View style={[styles.driverHalo, haloStyle]} />
            <View style={styles.driverCore}>
              <Icon name="navigation-2" size={11} color={colors.ivory} />
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Floating header. */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.s }]} pointerEvents="box-none">
        <Gradient fill preset="imageScrimTop" locations={[0, 1]} />

        <IconButton
          icon="arrow-left"
          onPress={() => navigation.navigate('Home')}
          accessibilityLabel="Back to shopping"
          size={40}
        />

        <View style={styles.headerText}>
          <View style={styles.headerEyebrowRow}>
            <LiveDot size={5} color={colors.crimsonGlow} style={styles.headerDot} />
            <Text style={styles.headerEyebrow}>LIVE TRACKING</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {order ? `Order ${order.id.slice(-6).toUpperCase()}` : 'Demo delivery'}
          </Text>
        </View>
      </View>

      {/* Status sheet. */}
      <Animated.View
        entering={FadeInDown.duration(duration.deliberate).easing(easing.out)}
        style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}
      >
        <Gradient fill preset="chrome" />
        <View pointerEvents="none" style={styles.sheetHighlight} />
        <View style={styles.handle} />

        <View style={styles.statusRow}>
          <View style={[styles.stageIcon, arrived && styles.stageIconArrived]}>
            <Icon
              name={stage.icon}
              size="lg"
              color={arrived ? colors.jade : colors.crimsonGlow}
            />
          </View>

          <View style={styles.statusLeft}>
            <Text style={styles.statusLabel}>{stage.label.toUpperCase()}</Text>
            <Text style={styles.statusDetail}>{stage.detail}</Text>
          </View>

          <View style={styles.etaBlock}>
            <AnimatedNumber value={minutesLeft} style={styles.etaValue} />
            <Text style={styles.etaUnit}>MIN</Text>
          </View>
        </View>

        <ProgressBar value={progress} height={4} style={styles.rail} />

        <View style={styles.legRow}>
          <View style={styles.leg}>
            <Icon name="shopping-bag" size="xs" color={colors.slate} />
            <Text style={styles.legText} numberOfLines={1}>
              {pickup.label}
            </Text>
          </View>
          <View style={[styles.leg, styles.legEnd]}>
            <Text style={styles.legText} numberOfLines={1}>
              {DESTINATION.label}
            </Text>
            <Icon name="map-pin" size="xs" color={colors.slate} />
          </View>
        </View>

        <Divider spacingY={spacing.sm} />

        <View style={styles.riderRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SK</Text>
          </View>

          <View style={styles.riderBody}>
            <Text style={styles.riderName}>Sandeep K.</Text>
            <View style={styles.riderMetaRow}>
              <Icon name="truck" size="xs" color={colors.slate} />
              <Text style={styles.riderMeta}>Porter partner · MH 31</Text>
              <Icon name="star" size="xs" color={colors.gold} />
              <Text style={styles.riderRating}>4.9</Text>
            </View>
          </View>

          {order ? <Text style={styles.orderTotal}>{formatINR(order.total)}</Text> : null}
        </View>

        <Button
          label={arrived ? 'Done' : 'Back to shopping'}
          icon={arrived ? 'check' : 'arrow-left'}
          variant={arrived ? 'primary' : 'ghost'}
          onPress={() => navigation.navigate('Home')}
          fullWidth
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },

  pickupMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold,
    backgroundColor: colors.scrimStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.ivory,
    backgroundColor: colors.glassFillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destCore: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.ivory,
  },
  driverMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: colors.crimsonBright,
  },
  driverCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.crimsonBright,
    borderWidth: 2,
    borderColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.m,
  },
  headerText: {
    flex: 1,
  },
  headerEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerDot: {
    marginLeft: -4,
  },
  headerEyebrow: {
    ...type.eyebrow,
    color: colors.crimsonGlow,
    fontSize: 9,
    letterSpacing: 2.4,
  },
  headerTitle: {
    ...type.subheading,
    marginTop: 2,
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.s,
    paddingHorizontal: spacing.m,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...elevation.high,
  },
  sheetHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.graphiteLight,
    marginBottom: spacing.m,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stageIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.crimsonWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196, 36, 58, 0.35)',
  },
  stageIconArrived: {
    backgroundColor: colors.jadeWash,
    borderColor: 'rgba(78, 140, 106, 0.4)',
  },
  statusLeft: {
    flex: 1,
  },
  statusLabel: {
    ...type.label,
    fontSize: 13,
    letterSpacing: 1.8,
  },
  statusDetail: {
    ...type.bodySmall,
    marginTop: 3,
  },
  etaBlock: {
    alignItems: 'flex-end',
  },
  etaValue: {
    ...type.numericLarge,
    fontSize: 34,
    lineHeight: 36,
  },
  etaUnit: {
    ...type.caption,
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2.4,
  },

  rail: {
    marginTop: spacing.m,
  },
  legRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.s,
    gap: spacing.sm,
  },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  legEnd: {
    justifyContent: 'flex-end',
  },
  legText: {
    ...type.caption,
    color: colors.slate,
    fontSize: 10,
    flexShrink: 1,
  },

  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  avatarText: {
    ...type.label,
    fontSize: 14,
    letterSpacing: 1,
  },
  riderBody: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  riderName: {
    ...type.subheading,
    fontSize: 15,
  },
  riderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  riderMeta: {
    ...type.caption,
    color: colors.ash,
  },
  riderRating: {
    ...type.caption,
    color: colors.gold,
    fontWeight: '600',
  },
  orderTotal: {
    ...type.numeric,
    fontSize: 17,
  },
});
