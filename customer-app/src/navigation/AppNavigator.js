import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useReducedMotion } from 'react-native-reanimated';

import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import AddressScreen from '../screens/AddressScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import VendorRegisterScreen from '../screens/VendorRegisterScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import VendorOrderListScreen from '../screens/vendor/OrderListScreen';
import VendorOrderDetailScreen from '../screens/vendor/OrderDetailScreen';
import CatalogManagerScreen from '../screens/vendor/CatalogManagerScreen';
import useAuthStore, { ROLES, selectRole } from '../store/useAuthStore';
import { colors } from '../theme/colors';

/**
 * Two distinct navigator instances, not one reused twice.
 *
 * Both flows render at the same position under NavigationContainer, so if they
 * shared a factory React would reconcile them as the same component and carry
 * navigation state across the role change — flipping to Vendor Mode from the
 * Profile screen would land on the vendor stack's Profile instead of the order
 * desk. Separate component types force an unmount, which is what discards the
 * old flow's history.
 */
const CustomerStack = createNativeStackNavigator();
const VendorStack = createNativeStackNavigator();

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
 *
 * The transition is built per-flow from the device's reduce-motion setting, so
 * `animation` is not baked in here — `makeScreenOptions` adds it.
 */
const baseScreenOptions = {
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
};

/**
 * Screen transitions honour the platform: the native push runs on the OS side,
 * keeps the interactive back-swipe, and matches every other app on the device —
 * never rebuild it in JS. Under reduce-motion the sliding push collapses to a
 * cross-fade (the gentler, non-vestibular equivalent), everywhere at once.
 */
function makeScreenOptions(reduced) {
  return {
    ...baseScreenOptions,
    animation: reduced ? 'fade' : 'slide_from_right',
  };
}

// A screen that slides up from the edge (modal-ish tasks the user can abandon).
// `animationMatchesGesture` makes the iOS back-swipe run this same transition in
// reverse under the finger, so dragging back never looks like a different app
// than pushing forward. Collapses to a fade under reduce-motion.
function slideUpOptions(reduced, extra = {}) {
  return {
    animation: reduced ? 'fade' : 'slide_from_bottom',
    animationMatchesGesture: true,
    ...extra,
  };
}

/** Buyer side: the scrollytelling storefront through to live delivery tracking. */
function CustomerFlow() {
  const reduced = useReducedMotion();
  return (
    <CustomerStack.Navigator initialRouteName="Home" screenOptions={makeScreenOptions(reduced)}>
      <CustomerStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <CustomerStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={slideUpOptions(reduced, { headerShown: false })}
      />
      <CustomerStack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Bag' }} />
      <CustomerStack.Screen
        name="Address"
        component={AddressScreen}
        options={{ title: 'Delivery Address' }}
      />
      <CustomerStack.Screen
        name="LiveTracking"
        component={LiveTrackingScreen}
        options={{ headerShown: false, animation: 'fade' }}
      />
      <CustomerStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <CustomerStack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: 'My Orders' }}
      />
      <CustomerStack.Screen
        name="Auth"
        component={AuthScreen}
        options={slideUpOptions(reduced, { title: 'Sign In' })}
      />
      <CustomerStack.Screen
        name="VendorRegister"
        component={VendorRegisterScreen}
        options={slideUpOptions(reduced, { title: 'Register Your Shop' })}
      />
    </CustomerStack.Navigator>
  );
}

/** Shop-owner side: the order desk and catalogue controls. */
function VendorFlow() {
  const reduced = useReducedMotion();
  return (
    <VendorStack.Navigator initialRouteName="VendorOrders" screenOptions={makeScreenOptions(reduced)}>
      {/* VendorOrders draws its own header so the shop name can sit under the status bar. */}
      <VendorStack.Screen
        name="VendorOrders"
        component={VendorOrderListScreen}
        // `title` is still read for the back-button label on pushed screens,
        // even though this screen paints its own header.
        options={{ headerShown: false, title: 'Orders' }}
      />
      <VendorStack.Screen
        name="VendorOrderDetail"
        component={VendorOrderDetailScreen}
        options={{ title: 'Order' }}
      />
      <VendorStack.Screen
        name="CatalogManager"
        component={CatalogManagerScreen}
        options={slideUpOptions(reduced, { title: 'Catalog' })}
      />
      <VendorStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </VendorStack.Navigator>
  );
}

/**
 * One binary, two flows. `role` in the auth store is the only switch: changing
 * it unmounts one stack and mounts the other, which also throws away the
 * navigation history — deliberate, since a customer's back stack has no
 * meaning inside the vendor desk.
 */
export default function AppNavigator() {
  const role = useAuthStore(selectRole);

  return (
    // Keyed by role on purpose. NavigationContainer owns the navigation state
    // and rehydrates a remounting child navigator from it, so without this the
    // two flows share history by route name — flipping Vendor Mode from the
    // customer Profile would land on the vendor Profile instead of the order
    // desk. Changing the key tears the container down and starts the new flow
    // at its own initial route.
    <NavigationContainer key={role} theme={navTheme}>
      {role === ROLES.VENDOR ? <VendorFlow /> : <CustomerFlow />}
    </NavigationContainer>
  );
}
