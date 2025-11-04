import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Entypo, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import OnlineOrderStack from './OnlineOrderStack';
import ReservationsStack from './ReservationStack';
import HomeStack from './HomeStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

const TabsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F54748',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: styles.tabBar, // 👈 curved style
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'HomeTab':
              return <Entypo name="home" size={size} color={color} />;
            case 'OnlineOrderTab':
              return <MaterialIcons name="shopping-cart" size={size} color={color} />;
            case 'ReservationsTab':
              return <FontAwesome5 name="calendar-check" size={size} color={color} />;
            case 'SettingsTab':
              return <Ionicons name="settings-sharp" size={size} color={color} />;
            default:
              return null;
          }
        },
      })}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="OnlineOrderTab"
        component={OnlineOrderStack}
        options={{
          headerShown: false,
          title: 'Online Order',
        }}
      />
      <Tab.Screen
        name="ReservationsTab"
        component={ReservationsStack}
        options={{
          title: 'Reservations',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{ title: 'Settings', headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 70,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'white',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
});

export default TabsNavigator;
