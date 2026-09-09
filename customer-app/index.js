import { registerRootComponent } from 'expo';

// Side-effect import: makes Alert.alert actually surface dialogs on web, where
// react-native-web's Alert is a no-op. Must run before the app renders.
import './src/shims/webAlert';
// Side-effect import: disables zooming, tap highlights, rubber-banding, callout menus,
// and auto-zoom on inputs to maintain the native app illusion on mobile browsers.
import './src/shims/webNativeHardening';
import App from './App';

registerRootComponent(App);
