import { StatusBar } from 'expo-status-bar';
import { View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Provider } from 'react-redux';

import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { Provider as PaperProvider } from 'react-native-paper';

import './global.css';
import COLORS from './src/constents/colors';

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.gray,
            paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
          }}>
          <AppNavigator />
          <StatusBar style="dark" translucent />
          <Toast topOffset={60} position="bottom" />
        </View>
      </PaperProvider>
    </Provider>
  );
}
