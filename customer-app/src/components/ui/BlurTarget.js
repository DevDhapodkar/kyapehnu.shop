import { createContext, useContext, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { BlurTargetView } from 'expo-blur';

/**
 * The view every pane of glass blurs.
 *
 * Android's blur does not work the way iOS's does. There is no compositor-level
 * backdrop filter, so `expo-blur` renders the target view to an offscreen
 * bitmap and blurs *that* — which means each `BlurView` has to be told which
 * view it is looking through. Without a `blurTarget` the Dimezis methods
 * silently fall back to no blur at all and warn once per panel, and the whole
 * interface quietly loses its material on Android.
 *
 * So the provider wraps the app once, and `GlassPanel` reads the ref from
 * context. Passing it down by prop would mean every screen threading a ref it
 * has no other use for through to every card.
 *
 * On iOS and web `BlurTargetView` is a plain `View` and the ref is unused —
 * those platforms blur what is actually behind the pane.
 */
const BlurTargetContext = createContext(null);

export function BlurTargetProvider({ children, style }) {
  const target = useRef(null);

  return (
    <BlurTargetView ref={target} style={[styles.root, style]}>
      <BlurTargetContext.Provider value={target}>{children}</BlurTargetContext.Provider>
    </BlurTargetView>
  );
}

/** The app-wide blur target, or null outside a provider. */
export function useBlurTarget() {
  return useContext(BlurTargetContext);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
