import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Chip, IconButton, PillButton, Surface } from '../components/ui';
import { NAGPUR_CENTER, formatINR, mockStores } from '../data/mockStores';
import { obsidianMapStyle } from '../theme/mapStyle';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

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
          strokeColor={colors.iris}
          strokeWidth={4}
          lineDashPattern={[6, 8]}
        />

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
            <View style={styles.driverHalo} />
            <View style={styles.driverCore} />
          </View>
        </Marker>
      </MapView>

      {/* Floating header — a disc and a pill over the map, not a bar across it. */}
      <View style={[styles.header, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
        <IconButton
          glyph="←"
          tone="glass"
          onPress={() => navigation.navigate('Home')}
          accessibilityLabel="Back to shopping"
        />

        <Surface tone="glassDense" radius={radii.pill} elevation="high" style={styles.headerPill}>
          <View style={styles.livePulse} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {order ? `Order ${order.id.slice(-6).toUpperCase()}` : 'Demo delivery'}
          </Text>
        </Surface>
      </View>

      {/* Status sheet. */}
      <View
        style={[styles.sheetDock, { paddingBottom: insets.bottom + spacing.sm }]}
        pointerEvents="box-none"
      >
        <Surface tone="glassDense" radius={radii.xl} elevation="high" style={styles.sheet} sheen>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Chip label="Live" tint={colors.mint} size="sm" style={styles.liveChip} />
              <Text style={styles.statusLabel}>{stage.label}</Text>
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
            <Text style={[styles.legText, styles.legTextEnd]} numberOfLines={1}>
              {DESTINATION.label}
            </Text>
          </View>

          <Surface tone="raised" radius={radii.lg} elevation="none" style={styles.riderCard}>
            <Avatar name="Sandeep K" size={42} />
            <View style={styles.riderBody}>
              <Text style={styles.riderName}>Sandeep K.</Text>
              <Text style={styles.riderMeta}>Porter partner  ·  MH 31  ·  4.9 ★</Text>
            </View>
            {order ? <Text style={styles.orderTotal}>{formatINR(order.total)}</Text> : null}
          </Surface>

          <PillButton
            label={progress >= 1 ? 'Done' : 'Back to shopping'}
            variant={progress >= 1 ? 'gradient' : 'light'}
            size="lg"
            icon="→"
            full
            onPress={() => navigation.navigate('Home')}
            style={styles.sheetButton}
          />
        </Surface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  destMarker: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.ivory,
    backgroundColor: colors.glassFillDense,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destCore: {
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.ivory,
  },
  driverMarker: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
    backgroundColor: colors.iris,
    opacity: 0.3,
  },
  driverCore: {
    width: 14,
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.iris,
    borderWidth: 2,
    borderColor: colors.ivory,
  },

  header: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    height: 44,
  },
  // A solid dot standing in for a blinking "live" indicator; the map behind it
  // is already moving, so a second animation here would only add noise.
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
  },
  headerTitle: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ivory,
    flex: 1,
  },

  sheetDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
  },
  sheet: {
    paddingHorizontal: spacing.md - 2,
    paddingTop: spacing.md - 2,
    paddingBottom: spacing.sm + 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  statusLeft: {
    flex: 1,
  },
  liveChip: {
    marginBottom: spacing.xs + 2,
  },
  statusLabel: {
    ...typography.h2,
    color: colors.ivory,
  },
  statusDetail: {
    ...typography.caption,
    color: colors.ash,
    marginTop: 4,
  },
  etaBlock: {
    alignItems: 'flex-end',
  },
  etaValue: {
    ...typography.numericLg,
    fontSize: 42,
    lineHeight: 44,
    color: colors.ivory,
  },
  etaUnit: {
    ...typography.micro,
    fontSize: 9,
    letterSpacing: 2.4,
    color: colors.ash,
    marginTop: 2,
  },
  rail: {
    height: 6,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.pill,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  railFill: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.iris,
  },
  legRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs + 2,
  },
  legText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.slate,
    flex: 1,
  },
  legTextEnd: {
    textAlign: 'right',
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  riderBody: {
    flex: 1,
    minWidth: 0,
  },
  riderName: {
    ...typography.h3,
    color: colors.ivory,
  },
  riderMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.ash,
    marginTop: 2,
  },
  orderTotal: {
    ...typography.numeric,
    fontSize: 16,
    color: colors.ivory,
  },
  sheetButton: {
    width: '100%',
  },
});
