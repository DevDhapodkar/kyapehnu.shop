// Web shim for `Alert.alert`.
//
// react-native-web ships an Alert whose `alert()` is an empty no-op.
// Native `window.confirm` / `window.alert` blocks the browser JavaScript thread,
// breaks automated browser testing, and creates unbranded browser dialogs.
//
// This web shim renders a beautiful, non-blocking in-app frosted glass dialog
// directly to the DOM with full keyboard accessibility (Escape to dismiss/cancel,
// Enter to confirm), supporting custom button actions and styles ('cancel', 'destructive').
// Native builds are untouched.

import { Alert, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
  Alert.alert = (title, message, buttons) => {
    try {
      // Remove any existing active alert modal
      const existing = document.getElementById('kp-web-alert-overlay');
      if (existing) {
        existing.remove();
      }

      const activeButtons =
        Array.isArray(buttons) && buttons.length > 0
          ? buttons
          : [{ text: 'OK', onPress: () => {} }];

      const overlay = document.createElement('div');
      overlay.id = 'kp-web-alert-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(18, 18, 20, 0.65);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif;
      `;

      const card = document.createElement('div');
      card.style.cssText = `
        background: #FFFFFF;
        border-radius: 20px;
        max-width: 380px;
        width: 100%;
        padding: 24px;
        box-shadow: 0 24px 48px rgba(18, 18, 21, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.85);
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: kpAlertPop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      `;

      if (!document.getElementById('kp-web-alert-style')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'kp-web-alert-style';
        styleSheet.textContent = `
          @keyframes kpAlertPop {
            from { opacity: 0; transform: scale(0.94); }
            to { opacity: 1; transform: scale(1); }
          }
        `;
        document.head.appendChild(styleSheet);
      }

      if (title) {
        const titleEl = document.createElement('div');
        titleEl.textContent = title;
        titleEl.style.cssText = `
          font-size: 18px;
          font-weight: 700;
          color: #121215;
          letter-spacing: -0.3px;
        `;
        card.appendChild(titleEl);
      }

      if (message) {
        const msgEl = document.createElement('div');
        msgEl.textContent = message;
        msgEl.style.cssText = `
          font-size: 13.5px;
          line-height: 1.55;
          color: #64748B;
          white-space: pre-wrap;
        `;
        card.appendChild(msgEl);
      }

      const actionsRow = document.createElement('div');
      actionsRow.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 10px;
        flex-wrap: wrap;
      `;

      const cleanup = () => {
        window.removeEventListener('keydown', keyHandler);
        overlay.remove();
      };

      const keyHandler = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanup();
          const cancelBtn = activeButtons.find((b) => b?.style === 'cancel');
          cancelBtn?.onPress?.();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          cleanup();
          const primaryBtn =
            [...activeButtons].reverse().find((b) => b?.style !== 'cancel') ||
            activeButtons[0];
          primaryBtn?.onPress?.();
        }
      };
      window.addEventListener('keydown', keyHandler);

      activeButtons.forEach((btn) => {
        const buttonEl = document.createElement('button');
        buttonEl.type = 'button';
        buttonEl.textContent = btn.text || 'OK';

        const isCancel = btn.style === 'cancel';
        const isDestructive = btn.style === 'destructive';

        buttonEl.style.cssText = `
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.1s;
          border: 1px solid transparent;
          ${
            isDestructive
              ? 'background: #D32F2F; color: #FFFFFF;'
              : isCancel
              ? 'background: rgba(18, 18, 20, 0.05); color: #475569; border-color: rgba(18, 18, 20, 0.08);'
              : 'background: #121215; color: #FFFFFF;'
          }
        `;

        buttonEl.onmouseover = () => {
          buttonEl.style.opacity = '0.88';
        };
        buttonEl.onmouseout = () => {
          buttonEl.style.opacity = '1';
        };

        buttonEl.onclick = () => {
          cleanup();
          try {
            btn.onPress?.();
          } catch (err) {
            console.error('[webAlert] button handler failed:', err?.message || err);
          }
        };

        actionsRow.appendChild(buttonEl);
      });

      card.appendChild(actionsRow);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
    } catch (err) {
      console.warn('[webAlert] Failed to display modal dialog:', err);
    }
  };
}

