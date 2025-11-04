// navigation/OnlineOrderStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnlineOrderScreen from './../screens/tabs/online-order/OnlineOrderScreen';
import OrderDetailsScreen from './../screens/tabs/online-order/order-detail.jsx/OrderDetailsScreen';

const Stack = createNativeStackNavigator();

export default function OnlineOrderStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="OnlineOrder"
        component={OnlineOrderScreen}
        options={{
          title: 'Online Order asdas',
        }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
    </Stack.Navigator>
  );
}
