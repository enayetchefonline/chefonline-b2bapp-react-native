// navigation/OnlineOrderStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddBranch from './../screens/tabs/settings/add-branch/AddBranch';
import ChangePassword from './../screens/tabs/settings/change-password/ChangePassword';
import ChangePincode from './../screens/tabs/settings/change-pincode/ChangePincode';
import DeliveryAndCollection from './../screens/tabs/settings/delivery-and-collection/DeliveryAndCollection';
import InvoiceDetailScreen from './../screens/tabs/settings/invoice-manager/InvoiceDetail';
import InvoiceManager from './../screens/tabs/settings/invoice-manager/InvoiceManager';
import NotificationCode from './../screens/tabs/settings/notification-code/NotificationCode';
import OpeningHourScreen from './../screens/tabs/settings/opening-hour/OpeningHourScreen';
import PartnerCenterSettings from './../screens/tabs/settings/partner-center-settings/PartnerCenterSettings';
import ReservationHours from './../screens/tabs/settings/reservation-hours/ReservationHours';
import ReservationSetting from './../screens/tabs/settings/reservation-setting/ReservationSetting';
import ReviewManager from './../screens/tabs/settings/review-manager/ReviewManager';
import SettingsScreen from './../screens/tabs/settings/SettingsScreen';
import TicketDetail from './../screens/tabs/settings/ticket-manager/TicketDetail';
import TicketManager from './../screens/tabs/settings/ticket-manager/TicketManager';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PartnerCenterSettings" component={PartnerCenterSettings} />
      <Stack.Screen name="OpeningHour" component={OpeningHourScreen} />
      <Stack.Screen name="DeliveryAndCollection" component={DeliveryAndCollection} />
      <Stack.Screen name="ReservationSetting" component={ReservationSetting} />
      <Stack.Screen name="ReservationHours" component={ReservationHours} />
      <Stack.Screen name="AddBranch" component={AddBranch} />
      <Stack.Screen name="NotificationCode" component={NotificationCode} />
      <Stack.Screen name="TicketManager" component={TicketManager} />
      <Stack.Screen name="InvoiceManager" component={InvoiceManager} />
      <Stack.Screen name="ReviewManager" component={ReviewManager} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} />
      <Stack.Screen name="ChangePincode" component={ChangePincode} />
      <Stack.Screen name="TicketDetail" component={TicketDetail} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
    </Stack.Navigator>
  );
}
