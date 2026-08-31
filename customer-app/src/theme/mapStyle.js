/**
 * Warm map style for Google Maps (Android, and iOS when PROVIDER_GOOGLE is
 * forced). Apple Maps ignores `customMapStyle` entirely — the MapView there is
 * kept light with `userInterfaceStyle="light"` instead.
 *
 * Every surface is pinned to the app's own light ramp so the map reads as
 * another pane of the interface: warm cream land, white roads, soft muted
 * water. The two markers and the terracotta route are the only saturated things
 * on screen.
 *
 * The colours are literals rather than palette imports because Google Maps takes
 * this array as raw JSON and the file has to stay serialisable; they mirror the
 * light palette's `ink`, `inkDeep`, `surface`, `surfaceRaised`, `surfaceHigh`,
 * `ivory`, `platinum`, `ash` and `slate` closely.
 */
export const warmMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#F0E4D7' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5F544A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FCF6EF' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#D8C6B3' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2B231D' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8C8073' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#DCE4CF' }],
  },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#EADBCB' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8C8073' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#F6ECE1' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E9D8C9' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#EDE0D1' }],
  },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFDCE0' }] },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9BB0B6' }],
  },
];

export default warmMapStyle;
