import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

/**
 * BrandLogo — Kya Pehnu? Official Stitch Brand Identity
 *
 * Implements the brand identity from Stitch project 15360757500694020784:
 * - Miniature Royal Crimson & Gold Squircle Emblem
 * - High-fashion serif typography: "KYA" in obsidian + "PEHNU?" in italic crimson
 * - Antique gold provenance accent dot
 */
export default function BrandLogo({
  size = 'md',
  showEmblem = true,
  style,
  dark = false,
}) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const emblemSize = isSm ? 22 : isLg ? 34 : 26;
  const fontSize = isSm ? 12 : isLg ? 19 : 14.5;

  return (
    <View style={[styles.container, style]}>
      {showEmblem ? (
        <View style={[styles.emblemWrap, { width: emblemSize, height: emblemSize }]}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={[
              styles.emblemImage,
              { width: emblemSize, height: emblemSize, borderRadius: emblemSize * 0.28 },
            ]}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={styles.textRow}>
        <Text
          style={[
            styles.kyaText,
            { fontSize, color: dark ? '#FFFFFF' : colors.textObsidian },
          ]}
        >
          KYA
        </Text>
        <Text style={[styles.pehnuText, { fontSize }]}> PEHNU?</Text>
        <View
          style={[
            styles.goldDot,
            isSm && styles.goldDotSm,
            isLg && styles.goldDotLg,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemWrap: {
    marginRight: 7,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emblemImage: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kyaText: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', 'Cinzel', Georgia, serif",
    }),
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  pehnuText: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "'EB Garamond', 'Playfair Display', Georgia, serif",
    }),
    fontStyle: 'italic',
    color: colors.accentCrimson,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  goldDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentGold,
    marginLeft: 4,
  },
  goldDotSm: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    marginLeft: 3,
  },
  goldDotLg: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 5,
  },
});
