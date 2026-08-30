/**
 * Obsidian map style for Google Maps (Android, and iOS when PROVIDER_GOOGLE is
 * forced). Apple Maps ignores `customMapStyle` entirely — the MapView there is
 * darkened with `userInterfaceStyle="dark"` instead.
 *
 * Every surface is pinned to the app's own ink ramp so the map reads as another
 * panel of the interface, and the two markers and the iris route are the only
 * saturated things on screen.
 *
 * The colours are literals rather than palette imports because Google Maps takes
 * this array as raw JSON and the file has to stay serialisable; they mirror
 * `colors.inkDeep`, `surface`, `surfaceRaised`, `surfaceHigh`, `ash`, `platinum`
 * and `slate` exactly.
 */
export const obsidianMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0B0B0D' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A8891' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#050506' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#26262C' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#C9C7C2' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5C5A63' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#101318' }],
  },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#141417' }] },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1C1C21' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5C5A63' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1C1C21' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#26262C' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#141417' }],
  },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#04040A' }] },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#26262C' }],
  },
];

export default obsidianMapStyle;
