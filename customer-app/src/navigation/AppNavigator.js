import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
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
 * Every surface here is transparent on purpose. The aurora backdrop is mounted
 * once at the app root, *under* the navigator, and screens are panes of glass
 * over it — so anything the navigator paints would sit between the two and
 * blank the wallpaper out. This is the change that makes the glass visible at
 * all; with an opaque container behind every screen there is nothing for a
 * frosted panel to refract.
 */
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.transparent,
    card: colors.transparent,
    text: colors.ivory,
    border: colors.glassBorder,
    primary: colors.ember,
    notification: colors.ember,
  },
};

/**
 * Shared screen options.
 *
 * No screen keeps the native header. A platform header is an opaque bar the app
 * cannot make out of glass, and it would cut a hard grey line across the
 * wallpaper at the top of every screen. Each screen draws its own `GlassHeader`
 * instead, which floats over its content and blurs what scrolls beneath it —
 * and lets the aurora run edge to edge behind the status bar.
 */
const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.transparent },
  animation: 'slide_from_right',
};

/** Buyer side: the scrollytelling storefront through to live delivery tracking. */
function CustomerFlow() {
  return (
    <CustomerStack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <CustomerStack.Screen name="Home" component={HomeScreen} />
      <CustomerStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <CustomerStack.Screen name="Cart" component={CartScreen} />
      <CustomerStack.Screen
        name="LiveTracking"
        component={LiveTrackingScreen}
        options={{ animation: 'fade' }}
      />
      <CustomerStack.Screen name="Profile" component={ProfileScreen} />
      <CustomerStack.Screen name="MyOrders" component={MyOrdersScreen} />
      <CustomerStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <CustomerStack.Screen
        name="VendorRegister"
        component={VendorRegisterScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </CustomerStack.Navigator>
  );
}

/** Shop-owner side: the order desk and catalogue controls. */
function VendorFlow() {
  return (
    <VendorStack.Navigator initialRouteName="VendorOrders" screenOptions={screenOptions}>
      <VendorStack.Screen name="VendorOrders" component={VendorOrderListScreen} />
      <VendorStack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} />
      <VendorStack.Screen
        name="CatalogManager"
        component={CatalogManagerScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <VendorStack.Screen name="Profile" component={ProfileScreen} />
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
