// navigation/AppNavigator.jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPassword from '../screens/auth/ForgotPassword';
import TabsNavigator from './TabsNavigator';
import OrderDetailsScreen from './../screens/tabs/online-order/order-detail.jsx/OrderDetailsScreen';
import RestaurantListScreen from './../screens/auth/RestaurantList';

const Stack = createNativeStackNavigator();

// navigation/AppNavigator.jsx
export default function AppNavigator() {
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          // 🔒 Protected section
          <>
            <Stack.Screen name="MainApp" component={TabsNavigator} />
            <Stack.Screen name="RestaurantList" component={RestaurantListScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          </>
        ) : (
          // 🔓 Auth section
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPassword}
              options={{ headerShown: true, title: 'Forgot Password' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
