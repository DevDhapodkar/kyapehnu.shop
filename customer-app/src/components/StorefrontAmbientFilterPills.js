import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../theme/colors';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'silks', label: 'Silks' },
  { id: 'evening', label: 'Evening' },
  { id: 'linen', label: 'Linen' },
  { id: 'festive', label: 'Festive' },
];

export default function StorefrontAmbientFilterPills({
  selectedId = 'all',
  onSelectCategory,
}) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedId === cat.id;

          return (
            <PressableScale
              key={cat.id}
              onPress={() => onSelectCategory?.(cat.id)}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillGlass,
              ]}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextGlass,
                ]}
              >
                {cat.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.xs,
  },
  scrollContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: colors.textObsidian,
    shadowColor: colors.textObsidian,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  pillGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  pillTextGlass: {
    color: colors.textSlate,
  },
});
