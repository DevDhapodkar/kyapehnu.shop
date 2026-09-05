import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

export default function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Check if on iOS device
    const userAgent = window.navigator?.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    // Check if already running in standalone mode (PWA installed)
    const isStandalone =
      window.navigator?.standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches;

    // Check if user already dismissed the prompt
    let dismissed = false;
    try {
      dismissed = window.localStorage?.getItem('kya_pehnu_ios_prompt_dismissed') === '1';
    } catch {
      // ignore storage access errors
    }

    if (isIOS && !isStandalone && !dismissed) {
      // Delay prompt slightly so the app loads first
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      window.localStorage?.setItem('kya_pehnu_ios_prompt_dismissed', '1');
    } catch {
      // ignore
    }
  };

  if (!showPrompt) return null;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>INSTALL KYA PEHNU ON IPHONE</Text>
          <Text style={styles.description}>
            Tap <Text style={styles.bold}>Share ⎋</Text> in Safari and select{' '}
            <Text style={styles.bold}>"Add to Home Screen"</Text> for full-screen luxury shopping.
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss prompt"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  banner: {
    backgroundColor: '#131316',
    borderWidth: 1,
    borderColor: 'rgba(200, 162, 74, 0.35)', // gold accent border
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system' : undefined,
    color: '#C8A24A', // Gold
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  description: {
    color: '#C9C7C2',
    fontSize: 12,
    lineHeight: 16,
  },
  bold: {
    color: '#F5F3EF',
    fontWeight: '600',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#8A8891',
    fontSize: 13,
    fontWeight: '600',
  },
});
