// Mobile web hardening shim for Kya Pehnu customer app.
//
// Eliminates web-specific behaviors on mobile devices (iOS Safari, Android Chrome,
// mobile WebViews, and installed PWAs) that break the illusion of a native app:
// - Accidental pinch-to-zoom and multi-touch page scaling
// - Double-tap to zoom (and eliminates 300ms double-tap delay)
// - Form input auto-zoom on iOS (enforces 16px minimum on mobile handsets)
// - Text selection highlighting, magnifier lens, and contextual callout popups on UI chrome
// - Gray/blue tap highlight overlay flashes
// - Browser pull-to-refresh and rubber-band overscroll tearing
// - iOS automatic phone number, date, and address link detection
// - Touch image ghost dragging
// - Long-press browser context menu on buttons and UI components

import { Platform } from 'react-native';
import { applyNativeMobileWebHardening } from '../utils/nativeWebHardening';

if (Platform.OS === 'web') {
  applyNativeMobileWebHardening();
}

