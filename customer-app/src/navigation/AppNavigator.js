import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useReducedMotion } from 'react-native-reanimated';

export const navigationRef = createNavigationContainerRef();

import HomeScreen from '../screens/HomeScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
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
import ProductIngestionScreen from '../screens/vendor/ProductIngestionScreen';
import VendorProfileScreen from '../screens/vendor/VendorProfileScreen';
import VendorAnalyticsScreen from '../screens/vendor/VendorAnalyticsScreen';
import { useAuthStore, ROLES, selectRole } from '../store/useAuthStore';
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

import { useThemeStore } from '../store/useThemeStore';

/**
 * Screen transitions honour the platform and current theme.
 */
function makeScreenOptions(reduced, themeColors) {
  return {
    headerShown: false,
    contentStyle: { backgroundColor: themeColors.groundBase },
    animation: reduced ? 'fade' : 'slide_from_right',
  };
}

function slideUpOptions(reduced, themeColors, extra = {}) {
  return {
    headerShown: false,
    contentStyle: { backgroundColor: themeColors.groundBase },
    animation: reduced ? 'fade' : 'slide_from_bottom',
    animationMatchesGesture: true,
    ...extra,
  };
}


/** Buyer side: the full Frosted Glass & Ambient Blobs commerce flow. */
function CustomerFlow({ themeColors }) {
  const reduced = useReducedMotion();
  return (
    <CustomerStack.Navigator initialRouteName="Welcome" screenOptions={makeScreenOptions(reduced, themeColors)}>
      <CustomerStack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <CustomerStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <CustomerStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={slideUpOptions(reduced, themeColors, { headerShown: false })}
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
        options={slideUpOptions(reduced, themeColors, { headerShown: false })}
      />
      <CustomerStack.Screen
        name="VendorRegister"
        component={VendorRegisterScreen}
        options={slideUpOptions(reduced, themeColors, { headerShown: false })}
      />
      <CustomerStack.Screen
        name="CatalogManager"
        component={CatalogManagerScreen}
        options={slideUpOptions(reduced, themeColors, { headerShown: false })}
      />
      <CustomerStack.Screen
        name="ProductIngestion"
        component={ProductIngestionScreen}
        options={slideUpOptions(reduced, themeColors, { headerShown: false })}
      />
      <CustomerStack.Screen
        name="VendorOrders"
        component={VendorOrderListScreen}
        options={{ headerShown: false }}
      />
      <CustomerStack.Screen
        name="VendorOrderDetail"
        component={VendorOrderDetailScreen}
        options={{ headerShown: false }}
      />
    </CustomerStack.Navigator>
  );
}

/** Shop-owner side: the order desk and catalogue controls. */
function VendorFlow({ themeColors }) {
  const reduced = useReducedMotion();
  return (
    <VendorStack.Navigator initialRouteName="VendorOrders" screenOptions={makeScreenOptions(reduced, themeColors)}>
      <VendorStack.Screen
        name="VendorOrders"
        component={VendorOrderListScreen}
        options={{ headerShown: false }}
      />
      <VendorStack.Screen
        name="VendorOrderDetail"
        component={VendorOrderDetailScreen}
        options={{ headerShown: false }}
      />
      <VendorStack.Screen
        name="CatalogManager"
        component={CatalogManagerScreen}
        options={slideUpOptions(reduced, themeColors, { headerShown: false })}
      />
      <VendorStack.Screen
        name="ProductIngestion"
        component={ProductIngestionScreen}
        options={slideUpOptions(reduced, themeColors, { headerShown: false })}
      />
      <VendorStack.Screen
        name="VendorAnalytics"
        component={VendorAnalyticsScreen}
        options={{ headerShown: false }}
      />
      <VendorStack.Screen
        name="VendorProfile"
        component={VendorProfileScreen}
        options={{ headerShown: false }}
      />
      <VendorStack.Screen
        name="Profile"
        component={VendorProfileScreen}
        options={{ headerShown: false }}
      />
      {/* Route alias so any residual navigation.navigate('Home') lands safely on the vendor desk */}
      <VendorStack.Screen
        name="Home"
        component={VendorOrderListScreen}
        options={{ headerShown: false }}
      />
    </VendorStack.Navigator>
  );
}

/**
 * One binary, two flows. `role` in the auth store and `themeMode` in the theme store
 * govern the navigation container styling and initial mounts.
 */
export default function AppNavigator() {
  const role = useAuthStore(selectRole);
  const themeMode = useThemeStore((state) => state.themeMode);
  const themeColors = useThemeStore((state) => state.colors);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: themeColors.groundBase,
      card: themeColors.groundBase,
      text: themeColors.textObsidian,
      border: themeColors.borderHairline,
      primary: themeColors.accentCrimson,
      notification: themeColors.accentCrimson,
    },
  };

  if (typeof window !== 'undefined') {
    window.__NAV__ = navigationRef;
  }

  return (
    <NavigationContainer ref={navigationRef} key={`${role}-${themeMode}`} theme={navTheme}>
      {role === ROLES.VENDOR ? <VendorFlow themeColors={themeColors} /> : <CustomerFlow themeColors={themeColors} />}
    </NavigationContainer>
  );
}
