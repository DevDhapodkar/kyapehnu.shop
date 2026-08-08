import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OrderListScreen from '../screens/OrderListScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CatalogManagerScreen from '../screens/CatalogManagerScreen';
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
      <Stack.Navigator initialRouteName="OrderList" screenOptions={screenOptions}>
        {/* OrderList draws its own header so the shop name can sit under the status bar. */}
        <Stack.Screen name="OrderList" component={OrderListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
        <Stack.Screen
          name="CatalogManager"
          component={CatalogManagerScreen}
          options={{ title: 'Catalog', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
