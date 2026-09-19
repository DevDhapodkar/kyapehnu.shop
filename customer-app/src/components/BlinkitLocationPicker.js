import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from './PressableScale';
import {
  getCurrentCoordinates,
  isWithinNagpur,
  reverseGeocodeLocation,
  NAGPUR_CENTER,
  NAGPUR_AREAS,
} from '../utils/geolocation';
import { colors, radii, spacing } from '../theme/colors';

// Popular Nagpur Express Hubs for instant 1-tap snap
const QUICK_HUBS = [
  { name: 'Sitabuldi', lat: 21.1458, lng: 79.0835, pincode: '440012' },
  { name: 'Dharampeth', lat: 21.1432, lng: 79.0617, pincode: '440010' },
  { name: 'Ramdaspeth', lat: 21.1345, lng: 79.0745, pincode: '440010' },
  { name: 'Civil Lines', lat: 21.1553, lng: 79.0734, pincode: '440001' },
  { name: 'Sadar', lat: 21.1633, lng: 79.0818, pincode: '440001' },
  { name: 'Wardha Rd', lat: 21.0905, lng: 79.0805, pincode: '440015' },
];

const DELIVERY_INSTRUCTION_OPTIONS = [
  { id: 'no_bell', label: "Don't ring bell", icon: 'notifications-off' },
  { id: 'leave_door', label: 'Leave at door', icon: 'door-front' },
  { id: 'call_arrival', label: 'Call on arrival', icon: 'phone-in-talk' },
  { id: 'hanger', label: 'Garment hanger handover', icon: 'checkroom' },
  { id: 'guard_handover', label: 'Leave with security / guard', icon: 'shield' },
];

/**
 * BlinkitLocationPicker
 *
 * Direct DOM Leaflet interactive delivery location picker.
 * Features:
 * 1. Fixed center pin with lift-on-drag and spring-bounce-on-drop physics.
 * 2. Real-time reverse geocoding resolving street, locality, and pincode.
 * 3. Floating debounced Nominatim auto-suggest search bar.
 * 4. 1-tap quick Nagpur locality hubs.
 * 5. Floating GPS button with animated radar pulse.
 * 6. Bottom sheet for complete doorstep details (House/Flat, Landmark, Home/Work chips, Delivery instructions).
 */
export default function BlinkitLocationPicker({
  visible,
  onClose,
  onConfirmLocation,
  initialCoordinates = [NAGPUR_CENTER.longitude, NAGPUR_CENTER.latitude],
  initialHouseFlat = '',
  initialLandmark = '',
  initialAddressType = 'Home',
  initialDeliveryInstructions = "Leave garment sleeve with concierge desk",
}) {
  const [selectedCoords, setSelectedCoords] = useState({
    longitude: initialCoordinates[0] || NAGPUR_CENTER.longitude,
    latitude: initialCoordinates[1] || NAGPUR_CENTER.latitude,
  });

  const [isMapMoving, setIsMapMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [inZone, setInZone] = useState(true);

  // Address Details Form State
  const [houseFlat, setHouseFlat] = useState(initialHouseFlat);
  const [landmark, setLandmark] = useState(initialLandmark);
  const [addressType, setAddressType] = useState(initialAddressType || 'Home');
  const [deliveryInstruction, setDeliveryInstruction] = useState(
    initialDeliveryInstructions || "Leave garment sleeve with concierge desk"
  );

  const searchTimeoutRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  const { height: windowHeight } = useWindowDimensions();
  const mapHeight = Math.max(260, Math.min(380, Math.round(windowHeight * 0.42)));

  // Load Leaflet dynamically on web if not present
  const ensureLeafletLoaded = useCallback(() => {
    if (Platform.OS !== 'web') return Promise.resolve(null);
    if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);

    return new Promise((resolve) => {
      // Check if Leaflet CSS exists
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Check if Leaflet JS exists
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.L) {
            clearInterval(interval);
            resolve(window.L);
          }
        }, 100);
      }

      // Ensure pin styles are always applied at top stacking layer
      if (!document.getElementById('blinkit-pin-styles')) {
        const style = document.createElement('style');
        style.id = 'blinkit-pin-styles';
        style.textContent = `
          #center-pin, .blinkit-center-pin {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            z-index: 99999 !important;
            pointer-events: none !important;
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          #pin-shadow, .blinkit-ground-shadow {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            z-index: 99998 !important;
            pointer-events: none !important;
            display: block !important;
            visibility: visible !important;
          }
          #blinkit-locate-btn {
            z-index: 99999 !important;
          }
        `;
        document.head.appendChild(style);
      }
    });
  }, []);

  // Handle reverse geocoding with debounce
  const triggerReverseGeocode = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const geo = await reverseGeocodeLocation({ latitude: lat, longitude: lng });
      setResolvedAddress(geo);
      setInZone(isWithinNagpur(lat, lng));
      if (geo?.road && !landmark) {
        setLandmark(geo.road);
      }
    } catch {
      setResolvedAddress({
        areaName: 'Sitabuldi',
        formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        pincode: '440012',
        geocodeFailed: true,
      });
      setInZone(isWithinNagpur(lat, lng));
    } finally {
      setIsGeocoding(false);
    }
  }, [landmark]);

  // Initialize and mount Leaflet map directly in the DOM
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    let isSubscribed = true;

    ensureLeafletLoaded().then((L) => {
      if (!isSubscribed || !L || !mapContainerRef.current) return;

      const initialLat = initialCoordinates[1] || NAGPUR_CENTER.latitude;
      const initialLng = initialCoordinates[0] || NAGPUR_CENTER.longitude;

      // Clean up previous map if container was re-used
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      try {
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        // Free Google Maps roadmap tiles (Fast CDN, full Nagpur roads, building outlines & landmarks, zero watermark)
        const googleTileUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
        const osmFallbackUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

        const tileLayer = L.tileLayer(googleTileUrl, {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: '&copy; Google Maps',
        });

        tileLayer.on('tileerror', function () {
          // Seamless fallback if Google tile is unreachable
          tileLayer.setUrl(osmFallbackUrl);
        });

        tileLayer.addTo(map);

        // Blinkit physics: lift center pin when drag/pan starts
        map.on('movestart', () => {
          setIsMapMoving(true);
        });

        // Blinkit physics: drop center pin with bounce when pan finishes, then geocode
        map.on('moveend', () => {
          setIsMapMoving(false);
          const center = map.getCenter();
          setSelectedCoords({ latitude: center.lat, longitude: center.lng });

          if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
          geocodeTimeoutRef.current = setTimeout(() => {
            triggerReverseGeocode(center.lat, center.lng);
          }, 200);
        });

        // Tapping map smoothly centers that spot under the pin
        map.on('click', (e) => {
          map.panTo(e.latlng, { animate: true, duration: 0.4 });
        });

        leafletMapRef.current = map;

        // Initial geocode
        triggerReverseGeocode(initialLat, initialLng);

        // Invalidate map size across animation frames to guarantee full tile paint on mobile Safari
        const sizeTimeouts = [80, 250, 600].map((delay) =>
          setTimeout(() => {
            try {
              if (isSubscribed && leafletMapRef.current === map && map._container && map._mapPane) {
                map.invalidateSize();
              }
            } catch (e) {}
          }, delay)
        );

        return () => {
          sizeTimeouts.forEach(clearTimeout);
        };
      } catch (err) {
        console.warn('[BlinkitLocationPicker] Leaflet map initialization error:', err);
      }
    });

    return () => {
      isSubscribed = false;
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {}
        leafletMapRef.current = null;
      }
    };
  }, [visible, ensureLeafletLoaded, initialCoordinates, triggerReverseGeocode]);

  // Search address via Nominatim with debounce
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text.trim() || text.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = encodeURIComponent(`${text.trim()} Nagpur`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=in&limit=5`,
          { headers: { 'User-Agent': 'KyaPehnuApp/1.0' } }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Fly to search result
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      setSearchQuery('');
      setSearchResults([]);
      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo([lat, lng], 17, { duration: 1.0 });
      } else {
        setSelectedCoords({ latitude: lat, longitude: lng });
        triggerReverseGeocode(lat, lng);
      }
    }
  };

  // Fly to Quick Nagpur Locality Hub
  const handleSnapToHub = (hub) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([hub.lat, hub.lng], 16, { duration: 0.8 });
    } else {
      setSelectedCoords({ latitude: hub.lat, longitude: hub.lng });
      triggerReverseGeocode(hub.lat, hub.lng);
    }
  };

  // Detect and fly to GPS location
  const handleLocateMe = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLocating(true);
    try {
      const pos = await getCurrentCoordinates();
      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo([pos.latitude, pos.longitude], 17, { duration: 1.2 });
      } else {
        setSelectedCoords({ latitude: pos.latitude, longitude: pos.longitude });
        triggerReverseGeocode(pos.latitude, pos.longitude);
      }
    } catch (err) {
      alert(err.message || 'Could not access GPS. Please pin manually.');
    } finally {
      setIsLocating(false);
    }
  };

  // Confirm and return location payload
  const handleFinalConfirm = () => {
    if (isGeocoding || !inZone) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const payload = {
      coordinates: [selectedCoords.longitude, selectedCoords.latitude],
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,
      formattedAddress:
        resolvedAddress?.formattedAddress ||
        `${resolvedAddress?.areaName || 'Sitabuldi'}, Nagpur (${resolvedAddress?.pincode || '440012'})`,
      areaName: resolvedAddress?.areaName || 'Sitabuldi',
      road: resolvedAddress?.road || landmark || '',
      pincode: resolvedAddress?.pincode || '440012',
      houseFlat: houseFlat.trim(),
      landmark: landmark.trim(),
      addressType,
      deliveryInstructions: deliveryInstruction,
      inZone,
      isDetected: true,
      geocodeFailed: Boolean(resolvedAddress?.geocodeFailed),
    };

    onConfirmLocation?.(payload);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>Select Delivery Location</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                Move the map so the pin points exactly to your doorstep
              </Text>
            </View>
            <PressableScale
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close location picker"
            >
              <MaterialIcons name="close" size={20} color={colors.textObsidian} />
            </PressableScale>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={colors.accentGold} />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search area, apartment, street in Nagpur..."
                placeholderTextColor={colors.textAsh}
                style={styles.searchInput}
                accessibilityLabel="Search delivery location in Nagpur"
                returnKeyType="search"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.accentCrimson} />
              ) : searchQuery ? (
                <PressableScale onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="clear" size={18} color={colors.textAsh} />
                </PressableScale>
              ) : null}
            </View>

            {/* Predictive Search Dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.searchDropdown}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.place_id}
                    onPress={() => handleSelectSearchResult(item)}
                    style={styles.searchResultItem}
                    activeOpacity={0.7}
                  >
                    <View style={styles.searchResultIconWrap}>
                      <MaterialIcons name="location-on" size={16} color={colors.accentCrimson} />
                    </View>
                    <Text style={styles.searchResultText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Nagpur Locality Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hubsScroll}
            >
              {QUICK_HUBS.map((hub) => (
                <TouchableOpacity
                  key={hub.name}
                  onPress={() => handleSnapToHub(hub)}
                  style={styles.hubChip}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="near-me" size={12} color={colors.accentGold} />
                  <Text style={styles.hubChipText}>{hub.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Map Viewport with Fixed Stationary Center Pin & Ground Shadow */}
          <View style={[styles.mapFrame, { height: mapHeight }]}>
            {Platform.OS === 'web' ? (
              <div
                ref={mapContainerRef}
                id="blinkit-map-container"
                style={{ width: '100%', height: '100%', outline: 'none' }}
              />
            ) : (
              <View style={styles.nativeMapPlaceholder}>
                <MaterialIcons name="location-on" size={44} color={colors.accentCrimson} />
                <Text style={styles.nativeMapText}>
                  {selectedCoords.latitude.toFixed(4)}, {selectedCoords.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            {/* Center Ground Shadow (shrinks when pin lifts during drag) */}
            {/* Center Ground Shadow (shrinks when pin lifts during drag) */}
            {Platform.OS === 'web' ? (
              <div
                id="pin-shadow"
                data-testid="pin-shadow"
                className={`ground-shadow blinkit-ground-shadow ${isMapMoving ? 'lifted blinkit-shadow-lifted' : 'blinkit-shadow-dropped'}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '20px',
                  height: '7px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(18, 18, 20, 0.45)',
                  zIndex: 9998,
                  pointerEvents: 'none',
                  transform: isMapMoving ? 'translate3d(-50%, -50%, 0) scale(0.48)' : 'translate3d(-50%, -50%, 0) scale(1)',
                  opacity: isMapMoving ? 0.25 : 0.85,
                  transition: 'all 0.18s ease-out',
                }}
              />
            ) : (
              <View
                style={[
                  styles.groundShadow,
                  isMapMoving ? styles.groundShadowLifted : styles.groundShadowDropped,
                ]}
                pointerEvents="none"
              />
            )}

            {/* Fixed Center Pin (stationary in center, lifts on drag, spring drops on release) */}
            {Platform.OS === 'web' ? (
              <div
                id="center-pin"
                data-testid="center-pin"
                className={`center-pin blinkit-center-pin ${isMapMoving ? 'lifted blinkit-pin-lifted' : 'blinkit-pin-dropped'}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  zIndex: 99999,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  transform: isMapMoving
                    ? 'translate3d(-50%, -135%, 0) scale(1.08)'
                    : 'translate3d(-50%, -100%, 0) scale(1)',
                  transformOrigin: 'bottom center',
                  transition: 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  willChange: 'transform',
                }}
              >
                {/* Luxury Tooltip above pin */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '48px',
                    backgroundColor: 'rgba(18, 18, 21, 0.92)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: '#FAF9F5',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
                    border: '1px solid rgba(200, 162, 74, 0.4)',
                    pointerEvents: 'none',
                  }}
                >
                  {isMapMoving ? 'Locating Doorstep...' : 'Order will be delivered here'}
                </div>

                {/* High-Visibility Vector Pin (Red Crimson with White & Gold border) */}
                <svg
                  width="38"
                  height="46"
                  viewBox="0 0 38 46"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    filter: 'drop-shadow(0 6px 12px rgba(196, 36, 58, 0.5))',
                    display: 'block',
                  }}
                >
                  <path
                    d="M19 0C8.50659 0 0 8.50659 0 19C0 31.5 19 46 19 46C19 46 38 31.5 38 19C38 8.50659 29.4934 0 19 0Z"
                    fill="#C4243A"
                    stroke="#FAF9F5"
                    strokeWidth="2.5"
                  />
                  <circle cx="19" cy="18" r="7" fill="#FAF9F5" />
                  <circle cx="19" cy="18" r="3.5" fill="#C4243A" />
                </svg>
              </div>
            ) : (
              <View
                style={[
                  styles.centerPinWrap,
                  isMapMoving ? styles.centerPinLifted : styles.centerPinDropped,
                ]}
                pointerEvents="none"
              >
                {/* Luxury Tooltip above pin */}
                <View style={styles.pinTooltip}>
                  <Text style={styles.pinTooltipText}>
                    {isMapMoving ? 'Locating Doorstep...' : 'Order will be delivered here'}
                  </Text>
                </View>

                {/* Pin Head */}
                <View style={styles.pinHead}>
                  <View style={styles.pinDot} />
                </View>
                {/* Pin Needle Tip */}
                <View style={styles.pinNeedle} />
              </View>
            )}

            {/* Floating GPS Locate Me Button with Radar Wave */}
            <TouchableOpacity
              id="blinkit-locate-btn"
              nativeID="blinkit-locate-btn"
              testID="blinkit-locate-btn"
              onPress={handleLocateMe}
              style={[styles.floatingGpsBtn, { zIndex: 9999 }]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Locate current position"
            >
              <View style={styles.gpsRadarRing} />
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.accentCrimson} />
              ) : (
                <MaterialIcons name="my-location" size={22} color={colors.accentCrimson} />
              )}
            </TouchableOpacity>
          </View>

          {/* Resolved Address Bottom Sheet & Details Completion Drawer */}
          <ScrollView style={styles.addressSheetScroll} contentContainerStyle={styles.addressSheetContent}>
            {/* Locality & Address Title Card */}
            <View style={styles.addressCard}>
              <View style={styles.addressCardHeader}>
                <View style={styles.addressCardIcon}>
                  <MaterialIcons
                    name={inZone ? 'check-circle' : 'warning'}
                    size={20}
                    color={inZone ? '#16A34A' : '#D97706'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.areaTitleRow}>
                    <Text nativeID="resolvedAreaName" testID="resolvedAreaName" style={styles.areaTitleText}>
                      {isGeocoding
                        ? 'Pinpointing exact doorstep...'
                        : resolvedAddress?.areaName || 'Sitabuldi, Nagpur'}
                    </Text>
                    {inZone && (
                      <View style={styles.expressBadge}>
                        <MaterialIcons name="bolt" size={12} color="#16A34A" />
                        <Text style={styles.expressBadgeText}>45-MIN EXPRESS</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.fullAddressText} numberOfLines={2}>
                    {isGeocoding
                      ? 'Resolving street particulars & postal code...'
                      : resolvedAddress?.formattedAddress ||
                        `${selectedCoords.latitude.toFixed(4)}, ${selectedCoords.longitude.toFixed(4)}`}
                  </Text>
                </View>
              </View>

              {/* Out of Zone Warning */}
              {!inZone && (
                <View style={styles.outOfZoneBox}>
                  <MaterialIcons name="error-outline" size={18} color="#B91C1C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.outOfZoneText}>
                      This pin is outside Nagpur city limits (~25km radius). Kya Pehnu express trials operate in Nagpur.
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleSnapToHub(QUICK_HUBS[0])}
                      style={styles.snapBtn}
                    >
                      <MaterialIcons name="my-location" size={13} color="#795900" style={{ marginRight: 4 }} />
                      <Text style={styles.snapBtnText}>Snap to Central Nagpur (Sitabuldi)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Enter Complete Address Details Drawer (Blinkit Style) */}
            <View style={styles.drawerSection}>
              <Text style={styles.drawerSectionTitle}>Complete Address Particulars</Text>

              {/* House / Flat / Floor */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HOUSE / FLAT / FLOOR NO. *</Text>
                <TextInput
                  nativeID="flatHouse"
                  testID="flatHouse"
                  value={houseFlat}
                  onChangeText={setHouseFlat}
                  placeholder="e.g. Flat 402, 4th Floor, Royal Palms"
                  placeholderTextColor={colors.textAsh}
                  style={styles.detailInput}
                />
              </View>

              {/* Landmark / Area */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>APARTMENT / ROAD / LANDMARK</Text>
                <TextInput
                  nativeID="streetLandmark"
                  testID="streetLandmark"
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="e.g. Near Eternity Mall, Wardha Road"
                  placeholderTextColor={colors.textAsh}
                  style={styles.detailInput}
                />
              </View>

              {/* Save Address As Chips */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SAVE ADDRESS AS</Text>
                <View style={styles.typeChipsRow}>
                  {[
                    { id: 'Home', icon: 'home', label: 'Home' },
                    { id: 'Work', icon: 'apartment', label: 'Office / Work' },
                    { id: 'Other', icon: 'place', label: 'Other' },
                  ].map((chip) => {
                    const isSelected = addressType.toLowerCase() === chip.id.toLowerCase() ||
                      (chip.id === 'Work' && (addressType.toLowerCase().includes('work') || addressType.toLowerCase().includes('office') || addressType.toLowerCase().includes('atelier')));
                    return (
                      <TouchableOpacity
                        key={chip.id}
                        onPress={() => setAddressType(chip.id)}
                        style={[styles.typeChip, isSelected && styles.typeChipActive]}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name={chip.icon}
                          size={16}
                          color={isSelected ? '#FFFFFF' : colors.textSlate}
                        />
                        <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 1-Tap Delivery Instructions Pills */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DELIVERY INSTRUCTIONS (1-TAP)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instructionsRow}>
                  {DELIVERY_INSTRUCTION_OPTIONS.map((opt) => {
                    const isSelected = deliveryInstruction === opt.label;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setDeliveryInstruction(opt.label)}
                        style={[styles.instructionPill, isSelected && styles.instructionPillActive]}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name={opt.icon}
                          size={14}
                          color={isSelected ? colors.accentCrimson : colors.textSlate}
                        />
                        <Text style={[styles.instructionPillText, isSelected && styles.instructionPillTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Blinkit-Style Bottom Action Bar */}
          <View style={styles.modalFooter}>
            <PressableScale
              nativeID="confirmDeliveryPinBtn"
              testID="confirmDeliveryPinBtn"
              id="confirmDeliveryPinBtn"
              onPress={handleFinalConfirm}
              disabled={isGeocoding || !inZone}
              style={[
                styles.confirmBtn,
                (isGeocoding || !inZone) && styles.confirmBtnDisabled,
                !inZone && styles.confirmBtnOutOfZone,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Confirm Delivery Location"
            >
              {isGeocoding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name={!inZone ? 'block' : 'done-all'} size={20} color="#FFFFFF" />
              )}
              <Text style={styles.confirmBtnText}>
                {isGeocoding
                  ? 'Pinpointing Doorstep...'
                  : !inZone
                  ? 'Outside Nagpur Delivery Zone'
                  : 'Confirm Location & Proceed'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 21, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FAF9F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 20, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentCrimson,
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textAsh,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 18, 20, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textObsidian,
    height: '100%',
  },
  searchDropdown: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    maxHeight: 220,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 20, 0.05)',
  },
  searchResultIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultText: {
    fontSize: 12.5,
    color: colors.textSlate,
    flex: 1,
    lineHeight: 16,
  },
  hubsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 2,
  },
  hubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  hubChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  mapFrame: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.12)',
    position: 'relative',
    backgroundColor: '#F4EFE7',
    isolation: 'isolate',
    zIndex: 1,
  },
  nativeMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nativeMapText: {
    fontSize: 13,
    color: colors.textSlate,
    fontWeight: '600',
  },
  // Fixed Center Pin & Ground Shadow
  centerPinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  centerPinLifted: {
    transform: [{ translateX: -16 }, { translateY: -44 }, { scale: 1.08 }],
  },
  centerPinDropped: {
    transform: [{ translateX: -16 }, { translateY: -32 }, { scale: 1.0 }],
  },
  pinTooltip: {
    position: 'absolute',
    bottom: 38,
    backgroundColor: 'rgba(18, 18, 21, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    whiteSpace: 'nowrap',
  },
  pinTooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pinHead: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentCrimson,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  pinNeedle: {
    width: 4,
    height: 8,
    backgroundColor: colors.accentCrimson,
    borderRadius: 2,
    marginTop: -2,
  },
  groundShadow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 14,
    height: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(18, 18, 20, 0.35)',
    zIndex: 90,
  },
  groundShadowLifted: {
    transform: [{ translateX: -7 }, { translateY: -3 }, { scale: 0.55 }],
    opacity: 0.25,
  },
  groundShadowDropped: {
    transform: [{ translateX: -7 }, { translateY: -3 }, { scale: 1.0 }],
    opacity: 0.75,
  },
  floatingGpsBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.08)',
    zIndex: 110,
  },
  gpsRadarRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: colors.accentCrimson,
    opacity: 0.4,
  },
  addressSheetScroll: {
    maxHeight: 280,
    marginTop: 8,
  },
  addressSheetContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.08)',
    gap: 8,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addressCardIcon: {
    marginTop: 2,
  },
  areaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  areaTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textObsidian,
    flex: 1,
  },
  expressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  expressBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.3,
  },
  fullAddressText: {
    fontSize: 12,
    color: colors.textAsh,
    marginTop: 2,
    lineHeight: 16,
  },
  outOfZoneBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  outOfZoneText: {
    fontSize: 11.5,
    color: '#991B1B',
    lineHeight: 15,
    fontWeight: '500',
  },
  snapBtn: {
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  snapBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B91C1C',
  },
  drawerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.08)',
    gap: 12,
  },
  drawerSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textObsidian,
    letterSpacing: 0.2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textAsh,
  },
  detailInput: {
    height: 42,
    backgroundColor: '#F9F8F5',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.textObsidian,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F9F8F5',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.08)',
  },
  typeChipActive: {
    backgroundColor: colors.accentCrimson,
    borderColor: colors.accentCrimson,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSlate,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  instructionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F9F8F5',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.08)',
  },
  instructionPillActive: {
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    borderColor: colors.accentCrimson,
  },
  instructionPillText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.textSlate,
  },
  instructionPillTextActive: {
    color: colors.accentCrimson,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: colors.accentCrimson,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    marginTop: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.55,
  },
  confirmBtnOutOfZone: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(18, 18, 20, 0.08)',
    backgroundColor: '#FAF9F5',
  },
});
