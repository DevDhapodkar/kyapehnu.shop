import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { fetchNearbyVendors } from '../api/vendorApi';
import { colors, radii, spacing } from '../theme/colors';

const CURATED_IMAGES = [
  require('../../assets/images/boutique-anamika.jpg'),
  require('../../assets/images/boutique-maheshwari.jpg'),
  require('../../assets/images/boutique-kalaniketan.jpg'),
];

export default function StorefrontAmbientBoutiquesList({ onSelectBoutique, selectedBoutiqueId }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyVendors(21.1458, 79.0882)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVendors(
            data.map((v, idx) => ({
              id: v._id || `v-${idx}`,
              name: v.shopName,
              locality: v.address ? `${v.address.area || ''}, ${v.address.city || 'Nagpur'}` : 'Nagpur',
              distanceKm: v.distanceKm ? Number(v.distanceKm).toFixed(1) : (1.2 + idx * 0.7).toFixed(1),
              piecesCount: v.productCount || 18,
              dispatchTime: '~25 min cycle',
              indicatorColor: idx % 2 === 0 ? colors.accentCrimson : colors.accentGold,
              image: CURATED_IMAGES[idx % CURATED_IMAGES.length],
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
        <Text style={styles.statusOnline}>{displayList.length} Partner Ateliers</Text>
      </View>

      {/* Boutique Cards List */}
      <View style={styles.list}>
        {displayList.map((boutique) => {
          const isSelected = selectedBoutiqueId === boutique.id || selectedBoutiqueId === boutique.name;
          return (
            <PressableScale
              key={boutique.id}
              onPress={() => onSelectBoutique?.(boutique)}
              style={[styles.card, isSelected && { borderColor: colors.accentCrimson, borderWidth: 1.5 }]}
              accessibilityRole="button"
              accessibilityLabel={`${boutique.name}, ${boutique.locality}`}
            >
            {/* Boutique Thumbnail */}
            <View style={styles.thumbWrap}>
              <Image
                source={boutique.image}
                style={styles.thumbImage}
                contentFit="cover"
                transition={200}
              />
            </View>

            {/* Info Col */}
            <View style={styles.infoCol}>
              <View style={styles.titleRow}>
                <Text style={styles.boutiqueName} numberOfLines={1}>
                  {boutique.name}
                </Text>
                <Text style={styles.distanceText}>
                  {boutique.distanceKm} km
                </Text>
              </View>

              <Text style={styles.localityText} numberOfLines={1}>
                {boutique.locality}
              </Text>

              <View style={styles.badgesRow}>
                <View style={styles.pieceCountPill}>
                  <View
                    style={[
                      styles.indicatorDot,
                      { backgroundColor: boutique.indicatorColor },
                    ]}
                  />
                  <Text style={styles.pieceCountText}>
                    {boutique.piecesCount} pieces
                  </Text>
                </View>

                <Text style={styles.dispatchTimeText}>
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
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  sectionTitle: {
    color: colors.textObsidian,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  statusOnline: {
    color: colors.textAsh,
    fontSize: 11,
    fontWeight: '500',
  },
  list: {
    gap: spacing.xs + 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    borderRadius: radii.md,
    padding: spacing.xs + 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
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
    marginBottom: 2,
  },
  boutiqueName: {
    color: colors.textObsidian,
    fontSize: 15.5,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.xs,
  },
  distanceText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
  localityText: {
    color: colors.textSlate,
    fontSize: 11.5,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieceCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18, 18, 20, 0.04)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 9999,
  },
  indicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pieceCountText: {
    color: colors.textObsidian,
    fontSize: 10,
    fontWeight: '600',
  },
  dispatchTimeText: {
    color: colors.textAsh,
    fontSize: 10,
  },
});
