import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { fetchNearbyVendors } from '../api/vendorApi';
import { colors, radii, spacing } from '../theme/colors';

/**
 * StorefrontAmbientBoutiquesList
 *
 * Live nearby vendors from Express /api/vendors/nearby.
 * Never invents boutiques or distances from mockStores / Unsplash.
 */
export default function StorefrontAmbientBoutiquesList({
  onSelectBoutique,
  selectedBoutiqueId,
}) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchNearbyVendors({ lat: 21.1458, lng: 79.0882 })
      .then((data) => {
        if (!isMounted) return;
        if (!Array.isArray(data) || data.length === 0) {
          setVendors([]);
          return;
        }
        setVendors(
          data.map((v, idx) => ({
            id: v._id || `v-${idx}`,
            name: v.shopName,
            locality: v.address?.area || v.area || '',
            distanceKm:
              typeof v.distanceKm === 'number'
                ? Number(v.distanceKm).toFixed(1)
                : null,
            dispatchTime:
              typeof v.etaMinutes === 'number'
                ? `${v.etaMinutes}m dispatch`
                : null,
            image: v.images?.[0] || v.image || null,
          }))
        );
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[StorefrontAmbientBoutiquesList] Live vendor note:', err.message);
        setVendors([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || vendors.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Nagpur Boutiques</Text>
        <Text style={styles.statusOnline}>{vendors.length} Online</Text>
      </View>

      <View style={styles.list}>
        {vendors.map((boutique) => {
          const isSelected =
            selectedBoutiqueId === boutique.id ||
            selectedBoutiqueId === boutique.name;

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
              accessibilityLabel={`${boutique.name}, ${boutique.locality || 'Nagpur'}`}
            >
              <View style={styles.thumbWrap}>
                {boutique.image ? (
                  <Image
                    source={{ uri: boutique.image }}
                    style={styles.thumbImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.thumbPlaceholder} />
                )}
              </View>

              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.boutiqueName} numberOfLines={1}>
                    {boutique.name}
                  </Text>
                  {boutique.distanceKm ? (
                    <Text style={styles.distanceText}>{boutique.distanceKm} km</Text>
                  ) : null}
                </View>

                <View style={styles.subRow}>
                  <Text style={styles.localityText} numberOfLines={1}>
                    {boutique.locality || 'Nagpur'}
                  </Text>
                  {boutique.dispatchTime ? (
                    <Text style={styles.dispatchText}>{boutique.dispatchTime}</Text>
                  ) : null}
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
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(18, 18, 21, 0.06)',
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
