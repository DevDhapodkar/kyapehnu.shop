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
import { typography } from '../theme/typography';

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
 * match the ink base or a light flash shows during the push transition.
 */
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.ink,
    card: colors.inkDeep,
    text: colors.ivory,
    border: colors.glassBorder,
    primary: colors.iris,
    notification: colors.blush,
  },
};

/**
 * Shared header styling for the screens that keep a native header. Home and
 * LiveTracking hide it so their content can run under the status bar.
 *
 * The title takes the design system's `h3` weight rather than the old hairline
 * 300: a native header sitting above bento cards has to read as part of the
 * same interface, and light type at 17px looks like a different app's chrome.
 */
const screenOptions = {
  headerStyle: { backgroundColor: colors.ink },
  headerTitleStyle: {
    color: colors.ivory,
    fontWeight: typography.h3.fontWeight,
    fontSize: typography.h3.fontSize,
    letterSpacing: typography.h3.letterSpacing,
  },
  headerTintColor: colors.ivory,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.ink },
  animation: 'slide_from_right',
};

/** Buyer side: the scrollytelling storefront through to live delivery tracking. */
function CustomerFlow() {
  return (
    <CustomerStack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <CustomerStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <CustomerStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />
      <CustomerStack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Bag' }} />
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
        options={{ title: 'Sign In', animation: 'slide_from_bottom' }}
      />
      <CustomerStack.Screen
        name="VendorRegister"
        component={VendorRegisterScreen}
        options={{ title: 'Register Your Shop', animation: 'slide_from_bottom' }}
      />
    </CustomerStack.Navigator>
  );
}

/** Shop-owner side: the order desk and catalogue controls. */
function VendorFlow() {
  return (
    <VendorStack.Navigator initialRouteName="VendorOrders" screenOptions={screenOptions}>
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
        options={{ title: 'Catalog', animation: 'slide_from_bottom' }}
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
