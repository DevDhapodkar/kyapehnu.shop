import { ScrollView, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../theme/colors';

const CATEGORIES = [
  { id: 'all', label: 'All Near You' },
  { id: 'silks', label: 'Mulmul & Silks' },
  { id: 'evening', label: 'Evening Sets' },
  { id: 'linen', label: 'Contemporary Linen' },
  { id: 'festive', label: 'Festive Edit' },
];

export default function StorefrontFilterPills({
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
                isSelected ? styles.pillSelected : styles.pillDefault,
              ]}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextDefault,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: colors.textObsidian,
    shadowColor: colors.textObsidian,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pillDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 20, 0.05)',
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  pillTextDefault: {
    color: colors.textSlate,
  },
});
