import { registerRootComponent } from 'expo';

// Side-effect import: makes Alert.alert actually surface dialogs on web, where
// react-native-web's Alert is a no-op. Must run before the app renders.
import './src/shims/webAlert';
import App from './App';

registerRootComponent(App);
