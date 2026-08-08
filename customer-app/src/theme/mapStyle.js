/**
 * Obsidian map style for Google Maps (Android, and iOS when PROVIDER_GOOGLE is
 * forced). Apple Maps ignores `customMapStyle` entirely — the MapView there is
 * darkened with `userInterfaceStyle="dark"` instead.
 *
 * Everything is desaturated toward the charcoal palette so the two markers and
 * the crimson route are the only saturated things on screen.
 */
export const obsidianMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0A0A0C' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A8891' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#050506' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#2A2A31' }],
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
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#131316' }] },
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
    stylers: [{ color: '#2A2A31' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#131316' }],
  },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#04040A' }] },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2A2A31' }],
  },
];

export default obsidianMapStyle;
