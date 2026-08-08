import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

/**
 * Navigation theme.
 *
 * React Navigation paints the screen container itself, so its background has to
 * match the obsidian base or a light flash shows during the push transition.
 */
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.obsidian,
    card: colors.obsidianDeep,
    text: colors.ivory,
    border: colors.glassBorder,
    primary: colors.crimsonBright,
    notification: colors.crimsonBright,
  },
};

/**
 * Shared header styling for the screens that keep a native header. Home and
 * LiveTracking hide it so their content can run under the status bar.
 */
const screenOptions = {
  headerStyle: { backgroundColor: colors.obsidianDeep },
  headerTitleStyle: {
    color: colors.ivory,
    fontWeight: '300',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  headerTintColor: colors.ivory,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.obsidian },
  animation: 'slide_from_right',
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Bag' }} />
        <Stack.Screen
          name="LiveTracking"
          component={LiveTrackingScreen}
          options={{ headerShown: false, animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
