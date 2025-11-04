// navigation/OnlineOrderStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EposDashboardScreen from './../screens/tabs/home/epos-dashboard/EposDashboardScreen';
import FaqScreen from './../screens/tabs/home/faq/FaqScreen';
import HomeScreen from './../screens/tabs/home/HomeScreen';
import MarketingScreen from './../screens/tabs/home/marketing/MarketingScreen';
import SupportScreen from './../screens/tabs/home/support/SupportScreen';
import SettingsScreen from './../screens/tabs/settings/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen
        name="EposDashboard"
        component={EposDashboardScreen}
        options={{ title: 'EPoS Dashboard' }}
      />
      <Stack.Screen name="Marketing" component={MarketingScreen} options={{ title: 'Marketing' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
      <Stack.Screen name="Faq" component={FaqScreen} options={{ title: 'FAQ' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
