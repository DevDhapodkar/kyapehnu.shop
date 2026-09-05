import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../theme/colors';

const STITCH_BOUTIQUES = [
  {
    id: 'str_studio_anamika',
    name: 'Studio Anamika',
    locality: 'Dharampeth',
    distanceKm: '1.4',
    dispatchTime: '28m dispatch',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBe8eWajVei1XnSWz0Pd5vU5uud5RV0gA_2mLkMnknAWvR7Lq5vaaMNzW-SnbpeyzvKLqGc9ZEl6HonR0iX3rUNI44tl1pjhlteTo1P1Sm0Wos-i_gyQvYqyb2guPn24rlwltIgm5DLbWlNlyX6Nisa5hgyFUVLYN6-kWeAgW-TgSs5Ar0L5wmkBhqdTUEDF5w0Mh2iqRuYd9wA9UD7kKztRdzkgFHVh0ALAq7d1dd2Tl9hC4jzzqW2QQ',
  },
  {
    id: 'str_maheshwari_handlooms',
    name: 'Maheshwari Handlooms',
    locality: 'Gandhibagh',
    distanceKm: '2.1',
    dispatchTime: '32m dispatch',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6-FQR-8cuwJinxs6ur4OsdhqAz9UJhmjX8Hnegq0mHVfrhrX1H2woNzSsDSmluh0HcGBPSWwq40Duif5rKd8f0SU1oI2l0xNAJIoAOF9SuckXB4AQTUqaiTnrE5IPD16iE9FvN85FBzHjrizMhbwYi4pH_6Q4UFDyqh5fjE92iRB_qbw-SDU9E6AQr4NGFTDqS6fiw6J_PoNvJCAwdhKoiLJHOmF7FtJu7wilhh8PnRAzGU9nS0l92w',
  },
  {
    id: 'str_kala_niketan',
    name: 'Kala Niketan',
    locality: 'Sitabuldi',
    distanceKm: '0.6',
    dispatchTime: '15m dispatch',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuByTVCA994DqwMs1gY0S7CBBrkhBAN816xuIaS9Li4qFjjOyC4d_0q8oYlk5oOqa_Dfe7TbjpuMdFwI7aZhTOoibf1sat34s9W1qEY5S-VvYsJpP6vyP9xjIcd4UTWlVs26nTWDOFpJAG-u-Y7yvFmi0TQikkZhSaHy32y80Fc51Fdf0Jvwi_7kweFMwGoudr5bAuKUSFi-ugsXw93eA4uHIopkSDuKD_qlECXwzpu216BF2ay9njqD1Q',
  },
];

export default function StorefrontAmbientBoutiquesList({
  onSelectBoutique,
  selectedBoutiqueId,
}) {
  const displayList = STITCH_BOUTIQUES;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Nagpur Boutiques</Text>
        <Text style={styles.statusOnline}>8 Online</Text>
      </View>

      {/* Boutique Cards List */}
      <View style={styles.list}>
        {displayList.map((boutique) => {
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
              accessibilityLabel={`${boutique.name}, ${boutique.locality}`}
            >
              {/* Boutique Thumbnail (56x56) */}
              <View style={styles.thumbWrap}>
                <Image
                  source={{ uri: boutique.image }}
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
