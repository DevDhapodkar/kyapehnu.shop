import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { fetchNearbyVendors } from '../api/vendorApi';
import { mockStores } from '../data/mockStores';
import { colors, radii, spacing } from '../theme/colors';

const BOUTIQUE_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80',
];

/**
 * StorefrontAmbientBoutiquesList
 *
 * Implements Stitch's Curating Boutiques Section with Live Backend Data:
 * - Fetches live nearby vendors from Express /api/vendors/nearby
 * - Gracefully falls back to mockStores catalogue if backend is cold-starting or empty
 * - Stitch UI styling: glass-card container, 56x56 thumbnail, serif title, gold distance, dispatch chip
 */
export default function StorefrontAmbientBoutiquesList({
  onSelectBoutique,
  selectedBoutiqueId,
}) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch live nearby boutiques from backend
    fetchNearbyVendors({ lat: 21.1458, lng: 79.0882 })
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setVendors(
            data.map((v, idx) => ({
              id: v._id || `v-${idx}`,
              name: v.shopName,
              locality: v.address?.area || v.area || 'Nagpur',
              distanceKm: v.distanceKm
                ? Number(v.distanceKm).toFixed(1)
                : (1.2 + idx * 0.7).toFixed(1),
              dispatchTime: `${15 + idx * 7}m dispatch`,
              image:
                v.images?.[0] ||
                v.image ||
                BOUTIQUE_FALLBACK_IMAGES[idx % BOUTIQUE_FALLBACK_IMAGES.length],
            }))
          );
        } else {
          // Fallback to mockStores when API has no active vendors
          setVendors(
            mockStores.slice(0, 4).map((s, idx) => ({
              id: s.id,
              name: s.name,
              locality: s.area || 'Nagpur',
              distanceKm: s.distanceKm
                ? Number(s.distanceKm).toFixed(1)
                : (1.2 + idx * 0.7).toFixed(1),
              dispatchTime: `${s.etaMinutes || 25}m dispatch`,
              image: s.image || BOUTIQUE_FALLBACK_IMAGES[idx % BOUTIQUE_FALLBACK_IMAGES.length],
            }))
          );
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[StorefrontAmbientBoutiquesList] Live vendor note:', err.message);
        // Fallback to mockStores
        setVendors(
          mockStores.slice(0, 4).map((s, idx) => ({
            id: s.id,
            name: s.name,
            locality: s.area || 'Nagpur',
            distanceKm: s.distanceKm
              ? Number(s.distanceKm).toFixed(1)
              : (1.2 + idx * 0.7).toFixed(1),
            dispatchTime: `${s.etaMinutes || 25}m dispatch`,
            image: s.image || BOUTIQUE_FALLBACK_IMAGES[idx % BOUTIQUE_FALLBACK_IMAGES.length],
          }))
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayList = vendors;

  if (!loading && displayList.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Nagpur Boutiques</Text>
        <Text style={styles.statusOnline}>
          {displayList.length > 0 ? `${displayList.length} Online` : 'Nearby'}
        </Text>
      </View>

      {/* Boutique Cards List */}
      <View style={styles.list}>
        {displayList.map((boutique) => {
          const isSelected =
            selectedBoutiqueId === boutique.id ||
            selectedBoutiqueId === boutique.name;

          const imageSource =
            typeof boutique.image === 'string'
              ? { uri: boutique.image }
              : boutique.image;

          return (
            <PressableScale
              key={boutique.id}
              onPress={() => onSelectBoutique?.(boutique)}
              style={[
                styles.card,
                isSelected && {
                  borderColor: colors.accentCrimson,
                  borderWidth: 1.5,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${boutique.name}, ${boutique.locality}`}
            >
              {/* Boutique Thumbnail (56x56) */}
              <View style={styles.thumbWrap}>
                <Image
                  source={imageSource}
                  style={styles.thumbImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>

              {/* Info Column */}
              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.boutiqueName} numberOfLines={1}>
                    {boutique.name}
                  </Text>
                  <Text style={styles.distanceText}>
                    {boutique.distanceKm} km
                  </Text>
                </View>

                <View style={styles.subRow}>
                  <Text style={styles.localityText} numberOfLines={1}>
                    {boutique.locality}
                  </Text>
                  <Text style={styles.dispatchText}>
                    {boutique.dispatchTime}
                  </Text>
                </View>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textObsidian,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
  },
  statusOnline: {
    color: colors.textAsh,
    fontSize: 11,
    fontWeight: '500',
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(210%) brightness(105%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%) brightness(105%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.85), 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  boutiqueName: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', Georgia, serif",
    }),
  },
  distanceText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '600',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  localityText: {
    color: colors.textSlate,
    fontSize: 12,
  },
  dispatchText: {
    color: colors.textAsh,
    fontSize: 10.5,
  },
});
