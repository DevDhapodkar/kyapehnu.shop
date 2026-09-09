/**
 * Mobile-web hardening to eliminate browser artifacts that break the illusion
 * of using a native app on handsets (iOS Safari & Android Chrome).
 *
 * Enforces:
 * 1. Zoom prevention:
 *    - Viewport metadata: width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover
 *    - WebKit gesture prevention: gesturestart, gesturechange, gestureend (iOS Safari ignores user-scalable=no unless gesture events are prevented)
 *    - Multi-touch pinch suppression on touchmove (touches.length > 1)
 *    - Double-tap to zoom suppression (touch-action: manipulation + touchend delta timer)
 *    - Form field auto-zoom elimination (enforces 16px minimum font-size on mobile inputs so iOS Safari never auto-zooms)
 *
 * 2. Native app touch feel:
 *    - Overscroll bounce & pull-to-refresh suppression (overscroll-behavior: none)
 *    - Tap highlight removal (-webkit-tap-highlight-color: transparent)
 *    - Context menu / callout bubble suppression on long press (-webkit-touch-callout: none, contextmenu event handler)
 *    - Unwanted text selection suppression on app chrome / cards / buttons (user-select: none, with inputs remaining selectable)
 *    - Image dragging ghost suppression (-webkit-user-drag: none, dragstart event handler)
 *    - iOS number/date auto-linking suppression (format-detection: telephone=no, date=no, address=no, email=no)
 *    - Standalone PWA / Web App capability flags
 */
export function applyNativeMobileWebHardening() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }

  // 1. Hardened Viewport Meta
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.setAttribute('name', 'viewport');
    document.head.appendChild(viewportMeta);
  }
  viewportMeta.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no, interactive-widget=resizes-content'
  );

  // 2. Mobile Web App & Format Detection Metas
  const metaAttributes = [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-touch-fullscreen', content: 'yes' },
    { name: 'format-detection', content: 'telephone=no, date=no, address=no, email=no' },
    { name: 'HandheldFriendly', content: 'true' },
    { name: 'MobileOptimized', content: 'width' },
  ];

  metaAttributes.forEach(({ name, content }) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  });

  // 3. Inject CSS Hardening Rules
  let styleEl = document.getElementById('native-mobile-web-hardening');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'native-mobile-web-hardening';
    styleEl.textContent = `
      /* Disable rubber-band bouncing, pull-to-refresh, and unwanted font inflation */
      html, body {
        overscroll-behavior: none !important;
        overscroll-behavior-y: none !important;
        overscroll-behavior-x: none !important;
        -webkit-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
      }

      /* Disable double-tap zoom while retaining fast, fluid single-touch panning */
      html, body, #root {
        touch-action: manipulation !important;
      }

      /* Disable WebKit tap highlight rectangle and callout bubble on links/images */
      *, *::before, *::after {
        -webkit-tap-highlight-color: transparent !important;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0) !important;
        -webkit-touch-callout: none !important;
      }

      /* Prevent accidental text selection on app chrome, cards, buttons */
      body, #root {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }

      /* Allow text selection inside editable input fields */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }

      /* iOS Safari auto-zooms whenever an input has font-size < 16px.
         Enforcing 16px on mobile screens completely eliminates this zoom bug. */
      @media screen and (max-width: 768px) {
        input, textarea, select {
          font-size: 16px !important;
        }
      }

      /* Disable image dragging ghost on mobile browsers */
      img {
        -webkit-user-drag: none !important;
        user-drag: none !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // 4. Runtime Event Listeners
  // a) Block WebKit pinch gestures (iOS Safari 10+)
  const preventGesture = (e) => {
    e.preventDefault();
  };
  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });

  // b) Block multi-touch pinch on touchmove unless explicitly inside an iframe/canvas with its own pinch
  const preventMultiTouch = (e) => {
    if (e.touches && e.touches.length > 1) {
      const target = e.target;
      if (target && target.closest && target.closest('iframe, .leaflet-container, .allow-pinch')) {
        return;
      }
      e.preventDefault();
    }
  };
  document.addEventListener('touchmove', preventMultiTouch, { passive: false });

  // c) Block double-tap to zoom fallback for older Safari versions
  let lastTouchEnd = 0;
  const preventDoubleTapZoom = (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        lastTouchEnd = now;
        return;
      }
      e.preventDefault();
    }
    lastTouchEnd = now;
  };
  document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

  // d) Suppress context menu on long-press (except editable text fields)
  const preventContextMenu = (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    e.preventDefault();
  };
  document.addEventListener('contextmenu', preventContextMenu);

  // e) Suppress image dragging ghost
  const preventImageDrag = (e) => {
    if (e.target && e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  };
  document.addEventListener('dragstart', preventImageDrag);

  // Return cleanup function
  return () => {
    document.removeEventListener('gesturestart', preventGesture);
    document.removeEventListener('gesturechange', preventGesture);
    document.removeEventListener('gestureend', preventGesture);
    document.removeEventListener('touchmove', preventMultiTouch);
    document.removeEventListener('touchend', preventDoubleTapZoom);
    document.removeEventListener('contextmenu', preventContextMenu);
    document.removeEventListener('dragstart', preventImageDrag);
  };
}
