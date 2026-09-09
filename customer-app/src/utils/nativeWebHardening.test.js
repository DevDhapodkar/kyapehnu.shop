import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { applyNativeMobileWebHardening } from './nativeWebHardening';

describe('nativeWebHardening', () => {
  let originalDocument;
  let originalWindow;
  let eventListeners = {};
  let elements = {};
  let createdElements = [];

  beforeEach(() => {
    eventListeners = {};
    elements = {};
    createdElements = [];

    const mockHead = {
      appendChild: (el) => {
        createdElements.push(el);
        if (el.name) {
          elements[`meta[name="${el.name}"]`] = el;
        }
        if (el.id) {
          elements[`#${el.id}`] = el;
        }
        return el;
      },
    };

    const mockDocument = {
      head: mockHead,
      querySelector: (selector) => elements[selector] || null,
      getElementById: (id) => elements[`#${id}`] || null,
      createElement: (tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          attributes: {},
          setAttribute: (k, v) => {
            el.attributes[k] = v;
            if (k === 'name') el.name = v;
            if (k === 'content') el.content = v;
          },
          getAttribute: (k) => el.attributes[k],
        };
        return el;
      },
      addEventListener: (type, listener, options) => {
        eventListeners[type] = eventListeners[type] || [];
        eventListeners[type].push(listener);
      },
      removeEventListener: (type, listener) => {
        if (eventListeners[type]) {
          eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
        }
      },
    };

    const mockWindow = {};

    originalDocument = globalThis.document;
    originalWindow = globalThis.window;
    globalThis.document = mockDocument;
    globalThis.window = mockWindow;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  });

  it('sets viewport meta attributes preventing zooming and scaling', () => {
    const cleanup = applyNativeMobileWebHardening();

    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport).not.toBeNull();
    expect(viewport.content).toContain('user-scalable=no');
    expect(viewport.content).toContain('maximum-scale=1.0');
    expect(viewport.content).toContain('minimum-scale=1.0');
    expect(viewport.content).toContain('viewport-fit=cover');

    cleanup();
  });

  it('injects format-detection and mobile-web-app meta tags', () => {
    const cleanup = applyNativeMobileWebHardening();

    const formatDetection = document.querySelector('meta[name="format-detection"]');
    expect(formatDetection).not.toBeNull();
    expect(formatDetection.content).toBe('telephone=no, date=no, address=no, email=no');

    const appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    expect(appleCapable).not.toBeNull();
    expect(appleCapable.content).toBe('yes');

    const mobileCapable = document.querySelector('meta[name="mobile-web-app-capable"]');
    expect(mobileCapable).not.toBeNull();
    expect(mobileCapable.content).toBe('yes');

    cleanup();
  });

  it('injects CSS hardening styles for overscroll, callout, tap-highlight, and input font size', () => {
    const cleanup = applyNativeMobileWebHardening();

    const style = document.getElementById('native-mobile-web-hardening');
    expect(style).not.toBeNull();
    expect(style.textContent).toContain('overscroll-behavior: none');
    expect(style.textContent).toContain('touch-action: manipulation');
    expect(style.textContent).toContain('-webkit-tap-highlight-color: transparent');
    expect(style.textContent).toContain('-webkit-touch-callout: none');
    expect(style.textContent).toContain('user-select: none');
    expect(style.textContent).toContain('font-size: 16px');

    cleanup();
  });

  it('registers gesture and touch event listeners and unregisters them on cleanup', () => {
    const cleanup = applyNativeMobileWebHardening();

    expect(eventListeners['gesturestart']?.length).toBe(1);
    expect(eventListeners['gesturechange']?.length).toBe(1);
    expect(eventListeners['gestureend']?.length).toBe(1);
    expect(eventListeners['touchmove']?.length).toBe(1);
    expect(eventListeners['touchend']?.length).toBe(1);
    expect(eventListeners['contextmenu']?.length).toBe(1);
    expect(eventListeners['dragstart']?.length).toBe(1);

    // Test preventDefault on gesturestart
    let prevented = false;
    eventListeners['gesturestart'][0]({ preventDefault: () => { prevented = true; } });
    expect(prevented).toBe(true);

    // Test cleanup
    cleanup();
    expect(eventListeners['gesturestart']?.length).toBe(0);
    expect(eventListeners['touchmove']?.length).toBe(0);
    expect(eventListeners['touchend']?.length).toBe(0);
  });
});
