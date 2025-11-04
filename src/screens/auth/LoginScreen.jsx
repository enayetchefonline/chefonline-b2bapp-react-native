// screens/auth/LoginScreen.jsx
import { Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  Image,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  Text,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import CONFIG from '../../constents/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, setActiveRestaurant } from '../../store/slices/userSlice';
import { loginUser } from '../../utils/apiService';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  //   const [username, setUsername] = useState('info@bengalvillage.com');
  //   const [password, setPassword] = useState('coid0093');
  //   Pin: 2222

  //   const [username, setUsername] = useState('info@robistakeaway.co.uk');
  //   const [password, setPassword] = useState('uc2507332');
  //   Pin: 2111

  //   const [username, setUsername] = useState('info@claphamtandooritakeaway.co.uk');
  //   const [password, setPassword] = useState('coid2382');

  //   const [username, setUsername] = useState('info@bombayinn.uk');
  //   const [password, setPassword] = useState('coid3026');

  //   const [username, setUsername] = useState('info@indianfusionkitchen.co.uk');
  //   const [password, setPassword] = useState('coid3025');

  const [remember, setRemember] = useState(false);
  const [token, setToken] = useState(''); // push token if you wire FCM/APNS
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    getRememberedLoginInfo();
  }, []);

  const getRememberedLoginInfo = async () => {
    try {
      const value = await AsyncStorage.getItem('@LoginInfo');
      if (value) {
        const loginData = JSON.parse(value);
        setUsername(loginData.username);
        setPassword(loginData.password);
        setRemember(loginData.rememberMe);
      }
    } catch (e) {
      console.warn(e.message);
    }
  };

  const rememberLoginInfo = async () => {
    try {
      const data = JSON.stringify({ username, password, rememberMe: remember });
      await AsyncStorage.setItem('@LoginInfo', data);
    } catch (e) {
      console.warn(e.message);
    }
  };

  const clearRememberedInfo = async () => {
    try {
      await AsyncStorage.removeItem('@LoginInfo');
    } catch (e) {
      console.warn(e.message);
    }
  };

  const validateEmail = (email) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(email);

  // ======== POST-LOGIN ROUTER =========
  const goAfterLogin = async (details) => {
    await AsyncStorage.setItem('@UserDetails', JSON.stringify(details));
    const list = details?.assign_restaurants ?? [];

    if (list.length > 1) {
      // multiple restaurants → choose
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
      return;
    }

    if (list.length === 1) {
      const r = list[0];
      // set to Redux + persist
      dispatch(setActiveRestaurant(r));
      await AsyncStorage.setItem('@ActiveRestaurant', JSON.stringify(r));
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
      return;
    }

    // Fallback if none
    Toast.show({
      type: 'error',
      text1: 'No Restaurants',
      text2: 'No restaurants are assigned to this account.',
    });
  };

  const handleLogin = async () => {
    if (!validateEmail(username)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Username and password are required',
      });
      return;
    }

    setLoading(true);

    const platform = Platform.OS === 'ios' ? '1' : '2';

    try {
      const response = await loginUser({ username, password, platform, token });

      if (response?.status === 1) {
        if (remember) await rememberLoginInfo();
        else await clearRememberedInfo();

        const details = response.UserDetails;
        dispatch(login(details));

        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${details.name}`,
        });

        await goAfterLogin(details);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response?.msg || 'Invalid credentials',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => navigation.navigate('ForgotPassword');

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Image
        source={require('../../assets/partner-logo.png')}
        className="mb-2 h-20 w-full"
        resizeMode="contain"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#EC1D3D" />
      ) : (
        <>
          {/* Username */}
          <View className="mb-5 w-full flex-row items-center border-b border-border">
            <FontAwesome name="user" size={20} color="#EC1D3D" />
            <TextInput
              className="ml-2 h-10 flex-1 text-text"
              placeholder="USERNAME"
              placeholderTextColor="#888"
              value={username}
              onChangeText={(text) => setUsername(text)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View className="mb-5 w-full flex-row items-center border-b border-border">
            <Entypo name="lock" size={20} color="#EC1D3D" />
            <TextInput
              className="ml-2 h-10 flex-1 text-text"
              placeholder="PASSWORD"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={(text) => setPassword(text)}
              autoCapitalize="none"
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="mt-2 w-full items-center rounded bg-primary py-2"
            onPress={handleLogin}>
            <Text className="font-bold text-white">LOGIN</Text>
          </TouchableOpacity>

          {/* Remember Me */}
          <View className="mt-5 flex-row items-center">
            <TouchableOpacity onPress={() => setRemember(!remember)}>
              <MaterialIcons
                name={remember ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#EC1D3D"
              />
            </TouchableOpacity>
            <Text className="ml-2 font-medium text-primary">REMEMBER PASSWORD</Text>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text className="mt-5 font-medium text-primary">FORGOT YOUR PASSWORD?</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Footer */}
      <Text className="absolute bottom-5 text-center text-xs text-primary">
        © Chefonline {new Date().getFullYear()}, All rights reserved.{'\n'}Version{' '}
        {CONFIG.APP_VERSION}
      </Text>
    </View>
  );
}
