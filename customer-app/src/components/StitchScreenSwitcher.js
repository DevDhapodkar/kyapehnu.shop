import React, { useState, useEffect } from 'react';
import stitchScreens from '../data/stitchScreens.json';
import { useThemeStore } from '../store/useThemeStore';

export default function StitchScreenSwitcher({ currentScreen, onSelectScreen }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('light');
  const isDark = useThemeStore((state) => state.isDark);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);

  const screenKeys = Object.keys(stitchScreens);
  const lightScreens = screenKeys.filter((k) => !k.startsWith('final_theme_dark'));
  const darkScreens = screenKeys.filter((k) => k.startsWith('final_theme_dark'));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__STITCH_NAV__ = {
        loadScreen: (key) => onSelectScreen?.(key),
        listScreens: () => screenKeys,
        toggleTheme: () => setThemeMode(isDark ? 'light' : 'dark'),
      };
    }
  }, [screenKeys, onSelectScreen, isDark, setThemeMode]);

  const cleanLabel = (key) => {
    return key
      .replace(/^final_light_theme_/, '')
      .replace(/^final_theme_dark_/, '')
      .replace(/___/g, ' - ')
      .replace(/__/g, ' ')
      .replace(/_/g, ' ')
      .trim();
  };

  const currentList = activeTab === 'light' ? lightScreens : darkScreens;

  return (
    <>
      {/* Subtle Floating Atelier Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 74,
          right: 14,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 9999,
          backgroundColor: isDark ? 'rgba(32,31,33,0.92)' : 'rgba(255,255,255,0.92)',
          color: isDark ? '#D4AF37' : '#9E1929',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          border: '1px solid rgba(212,175,55,0.4)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
        title="Stitch Screen Inspector & Suite Selector"
        aria-label="Stitch Screen Inspector"
      >
        <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
        <span>Stitch Suite</span>
      </button>

      {/* Drawer Modal */}
      {isOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              height: '100%',
              backgroundColor: isDark ? '#161618' : '#FAF8F5',
              color: isDark ? '#F4F4F5' : '#18181B',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'between',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B38A2B', fontWeight: 700 }}>
                  Google Stitch Reference Suite
                </div>
                <div style={{ fontSize: 18, fontFamily: "'EB Garamond', serif", fontWeight: 600, marginTop: 2 }}>
                  Exact Screens Direct from Stitch
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#A1A1AA' : '#71717A',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Theme Toggle & Tab Switcher */}
            <div style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setActiveTab('light');
                  setThemeMode('light');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeTab === 'light' ? '1px solid #B38A2B' : '1px solid transparent',
                  backgroundColor: activeTab === 'light' ? (isDark ? '#27272A' : '#FFFFFF') : 'transparent',
                  color: activeTab === 'light' ? '#B38A2B' : (isDark ? '#A1A1AA' : '#71717A'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>☀️ Light Theme</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>({lightScreens.length})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('dark');
                  setThemeMode('dark');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeTab === 'dark' ? '1px solid #D4AF37' : '1px solid transparent',
                  backgroundColor: activeTab === 'dark' ? (isDark ? '#27272A' : '#FFFFFF') : 'transparent',
                  color: activeTab === 'dark' ? '#D4AF37' : (isDark ? '#A1A1AA' : '#71717A'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>🌙 Dark Theme</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>({darkScreens.length})</span>
              </button>
            </div>

            {/* Screen List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 24px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8E6F6F', marginBottom: 10, paddingLeft: 4 }}>
                Customer Journey & Vendor Desk
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentList.map((key) => {
                  const isCurrent = currentScreen === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onSelectScreen?.(key);
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        backgroundColor: isCurrent ? (isDark ? '#2F1E24' : '#F7EBEF') : (isDark ? '#1F1F23' : '#FFFFFF'),
                        border: isCurrent ? '1px solid #C4243A' : '1px solid rgba(0,0,0,0.04)',
                        color: isCurrent ? '#C4243A' : (isDark ? '#F4F4F5' : '#18181B'),
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500 }}>
                          {cleanLabel(key)}
                        </span>
                        <span style={{ fontSize: 10, color: isDark ? '#A1A1AA' : '#71717A' }}>
                          {key}
                        </span>
                      </div>
                      {isCurrent ? (
                        <span className="material-symbols-outlined text-[18px] text-accent-crimson">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] opacity-40">chevron_right</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
