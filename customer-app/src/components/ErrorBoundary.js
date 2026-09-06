import React from 'react';
import { StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme/colors';

/**
 * ErrorBoundary
 *
 * Catches uncaught runtime and rendering exceptions anywhere in the React tree.
 * Prevents blank/white screen dropouts by rendering an Ivory Studio Luxury
 * recovery screen with options to retry or re-enter the Nagpur storefront.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  handleResetState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="refresh" size={28} color={colors.accentCrimson} />
            </View>

            <Text style={styles.eyebrow}>NAGPUR HYPERLOCAL COUTURE</Text>
            <Text style={styles.title}>Session Recovered</Text>
            <Text style={styles.description}>
              We encountered a temporary display glitch while preparing your atelier view. Tap below to refresh your couture connection.
            </Text>

            {this.state.error?.message ? (
              <View style={styles.debugBox}>
                <Text style={styles.debugText} numberOfLines={4}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={this.handleReload}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Reload Nagpur Ateliers"
            >
              <MaterialIcons name="sync" size={17} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Reload Nagpur Ateliers</Text>
            </Pressable>

            <Pressable
              onPress={this.handleResetState}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Try Again"
            >
              <Text style={styles.secondaryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(196, 36, 58, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.accentGoldDeep,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textObsidian,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  description: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  debugBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    color: colors.accentCrimson,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    backgroundColor: colors.accentCrimson,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
