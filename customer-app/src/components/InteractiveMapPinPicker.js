import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from './PressableScale';
import {
  getCurrentCoordinates,
  isWithinNagpur,
  reverseGeocodeLocation,
  NAGPUR_CENTER,
} from '../utils/geolocation';
import { colors, radii, spacing } from '../theme/colors';

/**
 * InteractiveMapPinPicker
 *
 * Genuinely free, open-source delivery location picker powered by OpenStreetMap & Nominatim.
 * Works seamlessly across Web, iOS, and Android with zero paid API keys.
 *
 * Features:
 * - Interactive Leaflet / OpenStreetMap viewport with live pin placement
 * - Real-time Nominatim address search with auto-suggest dropdown
 * - Direct GPS auto-detection button ("My Location")
 * - Live reverse geocoding resolving street, locality, and postal code
 * - Delivery zone validation (Nagpur express delivery radius)
 */
export default function InteractiveMapPinPicker({
  visible,
  onClose,
  onConfirmLocation,
  initialCoordinates = [NAGPUR_CENTER.longitude, NAGPUR_CENTER.latitude],
}) {
  const [selectedCoords, setSelectedCoords] = useState({
    longitude: initialCoordinates[0] || NAGPUR_CENTER.longitude,
    latitude: initialCoordinates[1] || NAGPUR_CENTER.latitude,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [inZone, setInZone] = useState(false);

  const searchTimeoutRef = useRef(null);
  const iframeRef = useRef(null);

  // Responsive map height: the sheet does not scroll, so on short handsets the
  // map must shrink to keep the Confirm button on screen. Clamp between a
  // usable floor and the original 320 ceiling.
  const { height: windowHeight } = useWindowDimensions();
  const mapHeight = Math.max(200, Math.min(320, Math.round(windowHeight * 0.4)));

  // Initialize and reverse geocode initial coords
  useEffect(() => {
    if (!visible) return;
    const lat = initialCoordinates[1] || NAGPUR_CENTER.latitude;
    const lng = initialCoordinates[0] || NAGPUR_CENTER.longitude;
    setSelectedCoords({ latitude: lat, longitude: lng });
    updateResolvedAddress(lat, lng);
  }, [visible, initialCoordinates]);

  // Handle address resolution
  const updateResolvedAddress = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const geo = await reverseGeocodeLocation({ latitude: lat, longitude: lng });
      setResolvedAddress(geo);
      setInZone(isWithinNagpur(lat, lng));
    } catch {
      // Do not invent Nagpur / 440001 — keep coords + zone only; user fills pincode
      setResolvedAddress({
        areaName: null,
        formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        pincode: null,
        geocodeFailed: true,
      });
      setInZone(isWithinNagpur(lat, lng));
    } finally {
      setIsGeocoding(false);
    }
  };

  // Listen for iframe postMessages on Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'MAP_PIN_MOVED') {
        const { lat, lng } = event.data;
        if (typeof lat === 'number' && typeof lng === 'number') {
          setSelectedCoords({ latitude: lat, longitude: lng });
          updateResolvedAddress(lat, lng);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Search address via Nominatim
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
    }, 450);
  };

  // Select search result
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedCoords({ latitude: lat, longitude: lng });
      setSearchQuery('');
      setSearchResults([]);
      updateResolvedAddress(lat, lng);

      // Notify web iframe
      if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'CENTER_MAP', lat, lng },
          '*'
        );
      }
    }
  };

  // Detect GPS Location
  const handleLocateMe = async () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setIsLocating(true);
    try {
      const pos = await getCurrentCoordinates();
      setSelectedCoords({ latitude: pos.latitude, longitude: pos.longitude });
      updateResolvedAddress(pos.latitude, pos.longitude);

      if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'CENTER_MAP', lat: pos.latitude, lng: pos.longitude },
          '*'
        );
      }
    } catch (err) {
      alert(err.message || 'Could not access GPS. Please pin manually.');
    } finally {
      setIsLocating(false);
    }
  };

  // Confirm and return location — never invent city/pincode
  const handleConfirm = () => {
    if (isGeocoding) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onConfirmLocation?.({
      coordinates: [selectedCoords.longitude, selectedCoords.latitude],
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,
      formattedAddress:
        resolvedAddress?.formattedAddress ||
        `${selectedCoords.latitude.toFixed(4)}, ${selectedCoords.longitude.toFixed(4)}`,
      areaName: resolvedAddress?.areaName || '',
      road: resolvedAddress?.road || '',
      pincode: resolvedAddress?.pincode || '',
      inZone,
      geocodeFailed: Boolean(resolvedAddress?.geocodeFailed),
    });
    onClose?.();
  };

  // Leaflet HTML template for web embedding
  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #F4EFE7; }
    /* Fixed center pin: the map pans beneath it so the doorstep sits under the tip. */
    #center-pin {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 1000;
      pointer-events: none;
      transform: translate(-50%, -100%);
      transition: transform 0.12s ease-out;
    }
    #center-pin.lifted { transform: translate(-50%, -115%); }
    .custom-pin {
      width: 32px;
      height: 32px;
      background: #C4243A;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 8px 16px rgba(196, 36, 58, 0.45);
    }
    .custom-pin::after {
      content: '';
      width: 10px;
      height: 10px;
      background: #FFFFFF;
      border-radius: 50%;
      position: absolute;
      top: 8px;
      left: 8px;
    }
    /* Ground shadow anchoring the pin tip while dragging. */
    #pin-shadow {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 999;
      pointer-events: none;
      width: 12px;
      height: 5px;
      background: rgba(18, 18, 20, 0.28);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      filter: blur(1px);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pin-shadow"></div>
  <div id="center-pin"><div class="custom-pin"></div></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${selectedCoords.latitude}, ${selectedCoords.longitude}], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var pinEl = document.getElementById('center-pin');

    // Lift the pin while the map is in motion for a tactile "picking up" feel.
    map.on('movestart', function() { pinEl.classList.add('lifted'); });

    map.on('moveend', function() {
      pinEl.classList.remove('lifted');
      var c = map.getCenter();
      window.parent.postMessage({ type: 'MAP_PIN_MOVED', lat: c.lat, lng: c.lng }, '*');
    });

    // Tapping a spot pans it under the pin.
    map.on('click', function(e) { map.panTo(e.latlng); });

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'CENTER_MAP') {
        map.flyTo([e.data.lat, e.data.lng], 16);
      }
    });
  </script>
</body>
</html>
  `;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Pin Delivery Location</Text>
              <Text style={styles.headerSubtitle}>
                Move the map to place the pin on your exact doorstep
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
          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={18} color={colors.accentGold} />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search locality, landmark or street in Nagpur..."
              placeholderTextColor={colors.textAsh}
              style={styles.searchInput}
              accessibilityLabel="Search for a delivery locality in Nagpur"
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={colors.accentGold} />
            ) : searchQuery ? (
              <PressableScale onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={18} color={colors.textAsh} />
              </PressableScale>
            ) : null}
          </View>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <View style={styles.resultsDropdown}>
              {searchResults.map((item) => (
                <PressableScale
                  key={item.place_id}
                  onPress={() => handleSelectSearchResult(item)}
                  style={styles.resultItem}
                >
                  <MaterialIcons name="place" size={16} color={colors.accentCrimson} />
                  <Text style={styles.resultText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </PressableScale>
              ))}
            </View>
          )}

          {/* Map View Container */}
          <View style={[styles.mapFrame, { height: mapHeight }]}>
            {Platform.OS === 'web' ? (
              <iframe
                ref={iframeRef}
                srcDoc={leafletHtml}
                style={styles.iframe}
                title="Delivery Pin Map"
              />
            ) : (
              <View style={styles.nativeMapPlaceholder}>
                <MaterialIcons name="location-on" size={42} color={colors.accentCrimson} />
                <Text style={styles.nativeMapText}>
                  {selectedCoords.latitude.toFixed(4)}, {selectedCoords.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            {/* Floating GPS Quick-Button */}
            <PressableScale
              onPress={handleLocateMe}
              style={styles.locateMeBtn}
              accessibilityRole="button"
              accessibilityLabel="Locate current position"
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.accentCrimson} />
              ) : (
                <MaterialIcons name="my-location" size={20} color={colors.accentCrimson} />
              )}
            </PressableScale>
          </View>

          {/* Resolved Address Footer */}
          <View style={styles.addressFooter}>
            <View style={styles.addressRow}>
              <View style={styles.pinDotWrap}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={inZone ? colors.accentCrimson : '#D97706'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resolvedAreaName}>
                  {isGeocoding
                    ? 'Pinpointing locality...'
                    : resolvedAddress?.areaName ||
                      (resolvedAddress?.geocodeFailed
                        ? 'Locality unresolved — enter pincode below'
                        : 'Move the map to set your doorstep')}
                </Text>
                <Text style={styles.resolvedFullAddress} numberOfLines={2}>
                  {isGeocoding
                    ? 'Resolving street particulars...'
                    : resolvedAddress?.formattedAddress ||
                      `${selectedCoords.latitude.toFixed(4)}, ${selectedCoords.longitude.toFixed(4)}`}
                </Text>
              </View>
            </View>

            {!inZone && (
              <View style={styles.warningBanner}>
                <MaterialIcons name="info-outline" size={15} color="#B45309" />
                <Text style={styles.warningText}>
                  This pin is slightly outside central Nagpur. Delivery may take over 45 minutes.
                </Text>
              </View>
            )}

            {/* Confirm Button */}
            <PressableScale
              onPress={handleConfirm}
              disabled={isGeocoding}
              style={[styles.confirmBtn, isGeocoding && styles.confirmBtnDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isGeocoding }}
              accessibilityLabel="Confirm Delivery Location"
            >
              {isGeocoding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="done" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.confirmBtnText}>
                {isGeocoding ? 'Resolving Doorstep...' : 'Confirm This Location'}
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
    backgroundColor: 'rgba(18, 18, 21, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FAF9F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 20, 0.06)',
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 19,
    fontWeight: '600',
    color: colors.textObsidian,
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
    backgroundColor: 'rgba(18, 18, 20, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.1)',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textObsidian,
    height: '100%',
  },
  resultsDropdown: {
    position: 'absolute',
    top: 118,
    left: 16,
    right: 16,
    zIndex: 99,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 20, 0.05)',
  },
  resultText: {
    fontSize: 12,
    color: colors.textSlate,
    flex: 1,
  },
  mapFrame: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.1)',
    position: 'relative',
    backgroundColor: '#F4EFE7',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
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
  locateMeBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.08)',
  },
  addressFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.06)',
  },
  pinDotWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedAreaName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  resolvedFullAddress: {
    fontSize: 12,
    color: colors.textAsh,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: colors.accentCrimson,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  confirmBtnDisabled: {
    opacity: 0.55,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
