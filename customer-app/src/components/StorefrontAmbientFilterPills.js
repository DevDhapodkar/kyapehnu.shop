import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { colors, radii, spacing } from '../theme/colors';

// Two tiers that do NOT overlap: the icon row selects the garment *type*
// (who/what it is), the chip rail refines by *fabric / occasion*. Sharing the
// same label in both rows made them read as duplicate controls, so each id now
// appears in exactly one row.
const QUICK_SWITCH_ITEMS = [
  { id: 'women', label: 'Women', icon: 'woman' },
  { id: 'men', label: 'Men', icon: 'man' },
  { id: 'tops', label: 'Tops', icon: 'checkroom' },
  { id: 'shirts', label: 'Shirts', icon: 'dry-cleaning' },
  { id: 'drapes', label: 'Drapes', icon: 'texture' },
];

const FILTER_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'silks', label: 'Silks' },
  { id: 'festive', label: 'Festive' },
  { id: 'linen', label: 'Linen' },
];

export default function StorefrontAmbientFilterPills({
  selectedId = 'all',
  onSelectCategory,
}) {
  return (
    <View style={styles.wrapper}>
      {/* 1. Sleek Category Quick-Switch Bar with Micro-Badges (5 columns) */}
      <View style={styles.quickSwitchContainer}>
        <View style={styles.quickSwitchGrid}>
          {QUICK_SWITCH_ITEMS.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <PressableScale
                key={item.id}
                onPress={() => onSelectCategory?.(isSelected ? 'all' : item.id)}
                style={[
                  styles.quickCard,
                  isSelected && styles.quickCardSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.iconCircle,
                    isSelected ? styles.iconCircleActive : styles.iconCircleInactive,
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={17}
                    color={isSelected ? colors.accentCrimson : colors.textSlate}
                  />
                </View>
                <Text
                  style={[
                    styles.quickLabel,
                    isSelected ? styles.quickLabelActive : styles.quickLabelInactive,
                  ]}
                >
                  {item.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      {/* 2. Frosted Glass Filter Pill Rails with Comprehensive Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.pillRail}
      >
        {FILTER_PILLS.map((pill) => {
          const isSelected = selectedId === pill.id;

          return (
            <PressableScale
              key={pill.id}
              onPress={() => onSelectCategory?.(pill.id)}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillGlass,
              ]}
              accessibilityRole="button"
              accessibilityLabel={pill.label}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextGlass,
                ]}
              >
                {pill.label}
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
    marginTop: 4,
    marginBottom: 4,
  },
  quickSwitchContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  quickSwitchGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickCard: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  quickCardSelected: {
    borderColor: colors.accentCrimson,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(196, 36, 58, 0.12)',
  },
  iconCircleInactive: {
    backgroundColor: 'rgba(18, 18, 20, 0.05)',
  },
  quickLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  quickLabelActive: {
    color: colors.textObsidian,
    fontWeight: '700',
  },
  quickLabelInactive: {
    color: colors.textSlate,
    fontWeight: '600',
  },
  pillRail: {
    marginTop: 2,
    marginBottom: 4,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
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
    borderColor: 'rgba(255, 255, 255, 0.80)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
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
