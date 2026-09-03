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
    background: '#F4EFE7',
    card: colors.obsidianDeep,
    text: colors.textObsidian,
    border: colors.glassBorder,
    primary: colors.accentCrimson,
    notification: colors.accentCrimson,
  },
};

/**
 * Shared header styling for the screens that keep a native header.
 */
const baseScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#F4EFE7' },
};

/**
 * Screen transitions honour the platform.
 */
function makeScreenOptions(reduced) {
  return {
    ...baseScreenOptions,
    animation: reduced ? 'fade' : 'slide_from_right',
  };
}

function slideUpOptions(reduced, extra = {}) {
  return {
    headerShown: false,
    animation: reduced ? 'fade' : 'slide_from_bottom',
    animationMatchesGesture: true,
    ...extra,
  };
}

/** Buyer side: the full Frosted Glass & Ambient Blobs commerce flow. */
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
      <CustomerStack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <CustomerStack.Screen
        name="Address"
        component={AddressScreen}
        options={{ headerShown: false }}
      />
      <CustomerStack.Screen
        name="LiveTracking"
        component={LiveTrackingScreen}
        options={{ headerShown: false, animation: 'fade' }}
      />
      <CustomerStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <CustomerStack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ headerShown: false }}
      />
      <CustomerStack.Screen
        name="Auth"
        component={AuthScreen}
        options={slideUpOptions(reduced, { headerShown: false })}
      />
      <CustomerStack.Screen
        name="VendorRegister"
        component={VendorRegisterScreen}
        options={slideUpOptions(reduced, { headerShown: false })}
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
