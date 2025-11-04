// navigation/OnlineOrderStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReservationDetailScreen from './../screens/tabs/reservation/reservation-detail/ReservationDetailScreen';
import ReservationScreen from './../screens/tabs/reservation/ReservationScreen';

const Stack = createNativeStackNavigator();

export default function ReservationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Reservations" component={ReservationScreen} />
      <Stack.Screen name="ReservationDetailScreen" component={ReservationDetailScreen} />
    </Stack.Navigator>
  );
}
