import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassButton from '../components/GlassButton';
import { NAGPUR_CENTER, formatINR, mockStores } from '../data/mockStores';
import { obsidianMapStyle } from '../theme/mapStyle';
import { colors, radii, spacing } from '../theme/colors';

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

function stageFor(progress) {
  if (progress < 0.05) return { label: 'Picked up', detail: 'Rider has collected your order.' };
  if (progress < 0.55) return { label: 'On the way', detail: 'Moving through Nagpur traffic.' };
  if (progress < 0.95) return { label: 'Almost there', detail: 'Two turns from your street.' };
  return { label: 'Arriving now', detail: 'Rider is at your door.' };
}

export default function LiveTrackingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const order = route.params?.order ?? null;

  // Destination: the pin the buyer dropped on the address screen (carried on the
  // order), falling back to the demo address so the screen still works without
  // going through checkout.
  const destination = useMemo(() => {
    const dropped = order?.destination;
    if (dropped?.latitude != null && dropped?.longitude != null) {
      return { ...dropped, label: dropped.label || DESTINATION.label };
    }
    return DESTINATION;
  }, [order]);

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

  const routeCoords = useMemo(() => buildRoute(pickup, destination), [pickup, destination]);

  const [index, setIndex] = useState(0);
  const driver = routeCoords[Math.min(index, routeCoords.length - 1)];
  const progress = routeCoords.length > 1 ? index / (routeCoords.length - 1) : 1;
  const stage = stageFor(progress);
  const minutesLeft = Math.max(1, Math.round((1 - progress) * 34));

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

  const initialRegion = {
    latitude: (pickup.latitude + destination.latitude) / 2 || NAGPUR_CENTER.latitude,
    longitude: (pickup.longitude + destination.longitude) / 2 || NAGPUR_CENTER.longitude,
    latitudeDelta: Math.abs(pickup.latitude - destination.latitude) * 2.6 + 0.05,
    longitudeDelta: Math.abs(pickup.longitude - destination.longitude) * 2.6 + 0.05,
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

        {/* Destination */}
        <Marker coordinate={destination} title="Delivery address" description={destination.label}>
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
            <View style={styles.driverHalo} />
            <View style={styles.driverCore} />
          </View>
        </Marker>
      </MapView>

      {/* Floating header. */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View pointerEvents="none" style={styles.headerFill} />
        <Pressable
          onPress={() => navigation.navigate('Home')}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Text style={styles.circleGlyph}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerEyebrow}>LIVE TRACKING</Text>
          <Text style={styles.headerTitle}>
            {order ? `Order ${order.id.slice(-6).toUpperCase()}` : 'Demo delivery'}
          </Text>
        </View>
      </View>

      {/* Status sheet. */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View pointerEvents="none" style={styles.sheetFill} />
        <View pointerEvents="none" style={styles.sheetHighlight} />

        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusLabel}>{stage.label.toUpperCase()}</Text>
            <Text style={styles.statusDetail}>{stage.detail}</Text>
          </View>
          <View style={styles.etaBlock}>
            <Text style={styles.etaValue}>{minutesLeft}</Text>
            <Text style={styles.etaUnit}>MIN</Text>
          </View>
        </View>

        {/* Progress rail. */}
        <View style={styles.rail}>
          <View style={[styles.railFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>

        <View style={styles.legRow}>
          <Text style={styles.legText} numberOfLines={1}>
            {pickup.label}
          </Text>
          <Text style={styles.legText} numberOfLines={1}>
            {DESTINATION.label}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.riderRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SK</Text>
          </View>
          <View style={styles.riderBody}>
            <Text style={styles.riderName}>Sandeep K.</Text>
            <Text style={styles.riderMeta}>Porter partner  ·  MH 31 · 4.9 ★</Text>
          </View>
          {order ? <Text style={styles.orderTotal}>{formatINR(order.total)}</Text> : null}
        </View>

        <GlassButton
          label={progress >= 1 ? 'Done' : 'Back to Shopping'}
          variant={progress >= 1 ? 'primary' : 'ghost'}
          onPress={() => navigation.navigate('Home')}
          style={styles.sheetButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
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
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: 17,
    backgroundColor: colors.crimson,
    opacity: 0.28,
  },
  driverCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.crimsonBright,
    borderWidth: 2,
    borderColor: colors.ivory,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
    overflow: 'hidden',
  },
  headerFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFillStrong,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    marginRight: spacing.sm,
  },
  circleGlyph: {
    color: colors.ivory,
    fontSize: 17,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.7,
  },
  headerText: {
    flex: 1,
  },
  headerEyebrow: {
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 2.5,
  },
  headerTitle: {
    color: colors.ivory,
    fontSize: 16,
    fontWeight: '400',
    marginTop: 2,
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  sheetFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFillStrong,
  },
  sheetHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusLeft: {
    flex: 1,
  },
  statusLabel: {
    color: colors.ivory,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
  },
  statusDetail: {
    color: colors.ash,
    fontSize: 13,
    marginTop: 4,
  },
  etaBlock: {
    alignItems: 'flex-end',
  },
  etaValue: {
    color: colors.ivory,
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
  },
  etaUnit: {
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2.5,
  },
  rail: {
    height: 2,
    backgroundColor: colors.graphite,
    borderRadius: 1,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  railFill: {
    height: 2,
    backgroundColor: colors.crimsonBright,
  },
  legRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  legText: {
    color: colors.slate,
    fontSize: 10,
    letterSpacing: 0.6,
    maxWidth: '46%',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.md,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  avatarText: {
    color: colors.ivory,
    fontSize: 13,
    letterSpacing: 1,
  },
  riderBody: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  riderName: {
    color: colors.ivory,
    fontSize: 15,
  },
  riderMeta: {
    color: colors.ash,
    fontSize: 11,
    marginTop: 2,
  },
  orderTotal: {
    color: colors.ivory,
    fontSize: 15,
    fontWeight: '600',
  },
  sheetButton: {
    width: '100%',
  },
});
