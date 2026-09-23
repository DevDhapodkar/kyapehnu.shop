import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import stitchScreens from '../data/stitchScreens.json';

const LIGHT_HTML = stitchScreens['final_light_theme_Product_Ingestion___Catalog_Listing_Form']?.html || '';
const DARK_HTML = stitchScreens['final_theme_dark_Product_Ingestion___Catalog_Listing_Form']?.html || '';

export default function StitchProductIngestion({ onClose }) {
  const isDark = useThemeStore((s) => s.isDark);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleClick = (e) => {
      const target = e.target.closest('button, a');
      if (!target) return;

      const aria = (target.getAttribute('aria-label') || '').toLowerCase();
      const text = (target.textContent || '').trim().toLowerCase();

      if (aria.includes('close') || aria.includes('back') || text.includes('cancel')) {
        e.preventDefault();
        onClose?.();
      } else if (text.includes('publish') || text.includes('save') || text.includes('submit')) {
        e.preventDefault();
        alert('Garment published to Nagpur Storefront live inventory.');
        onClose?.();
      }
    };

    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex justify-center items-center p-2 sm:p-4">
      <div className="relative w-full max-w-lg bg-surface-porcelain dark:bg-noir-base rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border-hairline dark:border-white/10">
          <span className="font-semibold text-xs uppercase tracking-wider">Product Ingestion &amp; Catalog Listing Form</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-surface-container-low dark:bg-white/10 flex items-center justify-center text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: isDark ? DARK_HTML : LIGHT_HTML }}
        />
      </div>
    </div>
  );
}
