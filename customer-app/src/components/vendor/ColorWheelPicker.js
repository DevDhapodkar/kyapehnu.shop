import { useState, useRef, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PressableScale from '../PressableScale';
import { colors, radii, spacing } from '../../theme/colors';

/**
 * 12 Key Spectral Hues along the 360-degree color wheel
 */
const COLOR_WHEEL_HUES = [
  { name: 'Ruby Crimson', hex: '#E11D48', hue: 348 },
  { name: 'Scarlet Red', hex: '#EF4444', hue: 0 },
  { name: 'Sunset Orange', hex: '#F97316', hue: 25 },
  { name: 'Warm Amber', hex: '#F59E0B', hue: 38 },
  { name: 'Golden Mustard', hex: '#EAB308', hue: 48 },
  { name: 'Lime Zest', hex: '#84CC16', hue: 84 },
  { name: 'Emerald Green', hex: '#10B981', hue: 160 },
  { name: 'Peacock Teal', hex: '#14B8A6', hue: 174 },
  { name: 'Ocean Cyan', hex: '#06B6D4', hue: 190 },
  { name: 'Royal Cobalt', hex: '#2563EB', hue: 217 },
  { name: 'Deep Indigo', hex: '#4F46E5', hue: 239 },
  { name: 'Velvet Violet', hex: '#7C3AED', hue: 263 },
  { name: 'Purple Orchid', hex: '#A855F7', hue: 280 },
  { name: 'Magenta Fuchsia', hex: '#D946EF', hue: 295 },
  { name: 'Blush Rose', hex: '#F43F5E', hue: 343 },
];

/**
 * Shading Tones for the selected hue
 */
const TONES = [
  { label: 'Pastel / Soft', factor: 0.85, namePrefix: 'Pastel' },
  { label: 'Vibrant / True', factor: 1.0, namePrefix: 'Vibrant' },
  { label: 'Deep / Jewel', factor: 0.65, namePrefix: 'Deep' },
  { label: 'Midnight / Dark', factor: 0.4, namePrefix: 'Midnight' },
];

/**
 * Helper to adjust lightness of a hex color
 */
function adjustBrightness(hex, factor) {
  let num = parseInt(hex.replace('#', ''), 16);
  let r = Math.min(255, Math.max(0, Math.round(((num >> 16) & 255) * factor)));
  let g = Math.min(255, Math.max(0, Math.round(((num >> 8) & 255) * factor)));
  let b = Math.min(255, Math.max(0, Math.round((num & 255) * factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Color name estimator based on hex
 */
function getEstimatedColorName(hex) {
  const clean = (hex || '').replace('#', '').toUpperCase();
  if (clean.length !== 6) return 'Custom Shade';

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  // Check grayscale
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if (maxDiff < 18) {
    const avg = (r + g + b) / 3;
    if (avg < 40) return 'Midnight Black';
    if (avg < 90) return 'Charcoal Slate';
    if (avg < 160) return 'Steel Gray';
    if (avg < 220) return 'Silver Mist';
    return 'Pure Snow White';
  }

  // Convert to approximate hue angle
  let hue = Math.round(
    Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * (180 / Math.PI)
  );
  if (hue < 0) hue += 360;

  if (hue >= 345 || hue < 15) return 'Crimson Red';
  if (hue < 40) return 'Sunset Coral';
  if (hue < 65) return 'Warm Gold';
  if (hue < 80) return 'Olive Yellow';
  if (hue < 150) return 'Emerald Green';
  if (hue < 185) return 'Peacock Teal';
  if (hue < 210) return 'Sky Cyan';
  if (hue < 240) return 'Cobalt Blue';
  if (hue < 275) return 'Royal Indigo';
  if (hue < 310) return 'Velvet Violet';
  return 'Rani Pink';
}

export default function ColorWheelPicker({ onAddColor }) {
  const [selectedHex, setSelectedHex] = useState('#E11D48');
  const [colorName, setColorName] = useState('Ruby Crimson');
  const [activeTone, setActiveTone] = useState(1); // 1 = True / Vibrant
  const inputRef = useRef(null);

  // Keep colorName in sync when hex changes if user hasn't typed a custom name
  const handleHexChange = (newHex, baseName) => {
    setSelectedHex(newHex);
    const estimated = baseName || getEstimatedColorName(newHex);
    setColorName(estimated);
  };

  const handleHueSelect = (item) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    const tone = TONES[activeTone];
    const adjusted = adjustBrightness(item.hex, tone.factor);
    setSelectedHex(adjusted);
    setColorName(activeTone === 1 ? item.name : `${tone.namePrefix} ${item.name}`);
  };

  const handleToneSelect = (toneIdx) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setActiveTone(toneIdx);
    const tone = TONES[toneIdx];
    const adjusted = adjustBrightness(selectedHex, tone.factor);
    setSelectedHex(adjusted);
  };

  const handleAddColor = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const finalName = colorName.trim() || getEstimatedColorName(selectedHex);
    onAddColor({
      name: finalName,
      hex: selectedHex,
    });
  };

  return (
    <View style={styles.container}>
      {/* 1. Interactive Wheel Header with Live Swatch */}
      <View style={styles.swatchHeaderRow}>
        <View style={styles.swatchLeftCol}>
          <View style={[styles.mainSwatchPreview, { backgroundColor: selectedHex }]}>
            <MaterialIcons
              name="palette"
              size={24}
              color={selectedHex === '#FFFFFF' || selectedHex === '#F9F6F0' ? '#121215' : '#FFFFFF'}
            />
          </View>
          <View style={styles.swatchDetailsCol}>
            <Text style={styles.swatchLabel}>Active Color</Text>
            <TextInput
              value={colorName}
              onChangeText={setColorName}
              placeholder="Color name (e.g. Sunset Pink)"
              placeholderTextColor={colors.textAsh}
              style={styles.colorNameInput}
            />
          </View>
        </View>

        {/* Web Native Color Wheel Trigger (Hidden input with visible wheel button) */}
        {Platform.OS === 'web' && (
          <View style={styles.nativeWheelWrap}>
            <input
              type="color"
              ref={inputRef}
              value={selectedHex.slice(0, 7)}
              onChange={(e) => handleHexChange(e.target.value)}
              style={styles.nativeColorInputHidden}
              title="Open Color Wheel"
            />
            <PressableScale
              onPress={() => inputRef.current?.click?.()}
              style={styles.openWheelBtn}
              accessibilityLabel="Open visual color wheel"
            >
              <View style={styles.wheelRainbowCircle}>
                <MaterialIcons name="colorize" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.wheelBtnText}>Color Wheel</Text>
            </PressableScale>
          </View>
        )}
      </View>

      {/* 2. Visual Color Spectrum Wheel Rail */}
      <Text style={styles.subSectionTitle}>Tap Spectral Hue on Wheel:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hueWheelRail}
      >
        {COLOR_WHEEL_HUES.map((item) => {
          const isSelected = selectedHex.toLowerCase() === item.hex.toLowerCase();
          return (
            <PressableScale
              key={item.name}
              onPress={() => handleHueSelect(item)}
              style={[
                styles.hueSwatchCircle,
                { backgroundColor: item.hex },
                isSelected && styles.hueSwatchCircleSelected,
              ]}
              accessibilityLabel={item.name}
            >
              {isSelected ? (
                <MaterialIcons name="check" size={16} color="#FFFFFF" />
              ) : null}
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* 3. Tone / Shade Stepper (Pastel -> True -> Deep -> Midnight) */}
      <View style={styles.tonesRow}>
        {TONES.map((tone, idx) => {
          const isActive = activeTone === idx;
          return (
            <PressableScale
              key={tone.label}
              onPress={() => handleToneSelect(idx)}
              style={[
                styles.tonePill,
                isActive && styles.tonePillActive,
              ]}
            >
              <Text style={[styles.tonePillText, isActive && styles.tonePillTextActive]}>
                {tone.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      {/* 4. Action Button: + Add Color to Garment */}
      <PressableScale
        onPress={handleAddColor}
        style={styles.addWheelColorBtn}
        accessibilityRole="button"
        accessibilityLabel={`Add ${colorName} to garment`}
      >
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addWheelColorBtnText}>
          Add "{colorName || 'Custom Shade'}" to Garment
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9F7F2',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    marginVertical: spacing.sm,
    gap: 12,
  },
  swatchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  swatchLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mainSwatchPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDetailsCol: {
    flex: 1,
  },
  swatchLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  colorNameInput: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textObsidian,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 2,
    paddingHorizontal: 0,
    marginTop: 2,
  },
  nativeWheelWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeColorInputHidden: {
    position: 'absolute',
    opacity: 0,
    width: 38,
    height: 38,
    cursor: 'pointer',
    zIndex: 10,
  },
  openWheelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  wheelRainbowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
      },
    }),
  },
  wheelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textObsidian,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSlate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hueWheelRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  hueSwatchCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  hueSwatchCircleSelected: {
    transform: [{ scale: 1.15 }],
    borderColor: colors.textObsidian,
    borderWidth: 2.5,
  },
  tonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tonePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  tonePillActive: {
    backgroundColor: colors.textObsidian,
    borderColor: colors.textObsidian,
  },
  tonePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSlate,
  },
  tonePillTextActive: {
    color: '#FFFFFF',
  },
  addWheelColorBtn: {
    backgroundColor: colors.accentCrimson,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    marginTop: 2,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addWheelColorBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
