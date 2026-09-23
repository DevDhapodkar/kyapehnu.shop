import React, { useState, useEffect, useRef } from 'react';
import useAuthStore, { ROLES } from '../store/useAuthStore';
import stitchScreens from '../data/stitchScreens.json';

const VARIANTS = {
  remastered: stitchScreens['final_light_theme_Register_Your_Shop__Remastered_']?.html || '',
  desk: stitchScreens['Register_Your_Shop___Vendor_Desk']?.html || '',
};

export default function StitchVendorRegister({ navigation }) {
  const [variant, setVariant] = useState('remastered');
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleClick = (e) => {
      const target = e.target.closest('button, a');
      if (!target) return;

      const text = (target.textContent || '').trim().toLowerCase();
      const aria = (target.getAttribute('aria-label') || '').toLowerCase();

      if (aria.includes('back') || target.querySelector('[class*="arrow_back"]')) {
        e.preventDefault();
        navigation.goBack();
      } else if (text.includes('submit') || text.includes('register') || text.includes('apply')) {
        e.preventDefault();
        useAuthStore.getState().setRole(ROLES.VENDOR);
      }
    };

    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [navigation]);

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      <div className="sticky top-0 z-40 w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-black/5 backdrop-blur-md border-b border-black/5 text-xs">
        <span className="font-semibold text-[10px] tracking-wider uppercase opacity-60">Stitch Variant:</span>
        <button
          onClick={() => setVariant('remastered')}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
            variant === 'remastered' ? 'bg-accent-crimson text-white shadow-xs' : 'bg-white/60 text-stone-700 hover:bg-white'
          }`}
        >
          Remastered
        </button>
        <button
          onClick={() => setVariant('desk')}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
            variant === 'desk' ? 'bg-accent-crimson text-white shadow-xs' : 'bg-white/60 text-stone-700 hover:bg-white'
          }`}
        >
          Vendor Desk
        </button>
      </div>

      <div
        ref={containerRef}
        className="w-full flex-1 flex flex-col"
        dangerouslySetInnerHTML={{ __html: VARIANTS[variant] }}
      />
    </div>
  );
}
