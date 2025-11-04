// app/screens/SettingsScreen.jsx
import React, { useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setPinCode } from './../../../store/slices/userSlice';
import AppHeader from './../../../components/AppHeader';
import { useNavigation } from '@react-navigation/native';
import { HelperText, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  checkPinStatus,
  setPin,
  verifyPin,
  requestPinReset,
  logoutUser,
} from './../../../utils/apiService';

const isValidPin = (v) => /^\d{4,6}$/.test(String(v || ''));

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const user = useSelector((state) => state.user);
  const userId = user?.userInfo?.user_id;

  const [pincode, setPincode] = useState(''); // start empty
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPincodeSet, setIsPincodeSet] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const platform = Platform.OS === 'ios' ? '1' : '2';

  // Redirect if not logged in
  useEffect(() => {
    if (!user?.isLoggedIn || !userId) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [user?.isLoggedIn, userId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Settings"
          showBack={false}
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await checkPinStatus({ user_id: userId });
        console.log('checkPinStatus', res);
        setIsPincodeSet(res?.status === 'Success');
      } catch {
        setIsPincodeSet(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleSetNewPin = async () => {
    if (!isValidPin(newPin) || !isValidPin(confirmNewPin)) {
      setErrorMessage('PIN must be 4–6 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMessage('Pincode and confirm pincode do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await setPin({ user_id: userId, pincode: newPin });
      if (res?.status === 'Success') {
        dispatch(setPinCode(newPin));
        setNewPin('');
        setConfirmNewPin('');
        setIsPincodeSet(true);
        setErrorMessage('');
        setSuccessMessage(res?.msg || 'PIN set successfully');
        setVisibleSnackbar(true);
      } else {
        setErrorMessage(res?.msg || 'Failed to set PIN');
      }
    } catch {
      setErrorMessage('Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPin = async () => {
    if (!isValidPin(pincode)) {
      setErrorMessage('PIN must be 4–6 digits.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyPin({ user_id: userId, pincode });
      if (res?.status !== 'Failed') {
        dispatch(setPinCode(pincode));
        const entered = pincode;
        setPincode('');
        navigation.navigate('PartnerCenterSettings', { pincode: entered });
      } else {
        setErrorMessage(res?.msg || 'Invalid PIN');
      }
    } catch {
      setErrorMessage('PIN verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgetPincode = () => {
    Alert.alert('Confirm PIN Reset', 'Confirm if you want to reset your PIN.', [
      { text: 'CONFIRM', onPress: confirmResetPin },
      { text: 'CANCEL', style: 'cancel' },
    ]);
  };

  const confirmResetPin = async () => {
    setLoading(true);
    try {
      const res = await requestPinReset({
        user_id: userId,
        mobile_no: user?.userInfo?.mobile || '',
      });
      setSuccessMessage(res?.msg || 'Request sent');
      setVisibleSnackbar(true);
    } catch {
      setSuccessMessage('Could not send request');
      setVisibleSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem('@token');
      const token = saved ? JSON.parse(saved) : '';
      // best-effort server logout
      await logoutUser({ user_id: userId, platform, token: token || '' });
    } catch {
      // ignore
    } finally {
      // clear local session bits
      await AsyncStorage.multiRemove(['@ActiveRestaurant', '@UserDetails', '@token']);
      //   dispatch(logout());
      //   setLoading(false);
      //   navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      //   await AsyncStorage.multiRemove(['@ActiveRestaurant', '@UserDetails', '@token']);

      dispatch(logout()); // flips isLoggedIn = false
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-backgroundLight px-4">
      {loading ? (
        <ActivityIndicator size="large" color="#EC1D3D" />
      ) : (
        <View className="w-full max-w-md rounded-xl bg-white p-6 shadow-md">
          {isPincodeSet ? (
            <>
              <Text className="mb-4 text-xs tracking-wider text-text">ENTER PINCODE</Text>
              <View className="mb-6 flex-row items-center border-b border-gray-300 pb-2">
                <Entypo name="lock" size={18} color="#EC1D3D" />
                <TextInput
                  className="ml-2 flex-1 text-sm text-text"
                  placeholder="Pincode"
                  placeholderTextColor="#888"
                  secureTextEntry
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={(t) => {
                    setPincode(t.replace(/[^\d]/g, ''));
                    setErrorMessage('');
                  }}
                />
              </View>
              {errorMessage ? <HelperText type="error">{errorMessage}</HelperText> : null}

              <View className="mb-4 flex-row gap-5">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center rounded bg-primary py-3"
                  onPress={handleLogout}>
                  <FontAwesome name="sign-out" size={16} color="#fff" />
                  <Text className="ml-2 text-sm font-semibold text-white">LOGOUT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 items-center rounded py-3 ${isValidPin(pincode) ? 'bg-gray-200' : 'bg-gray-300'}`}
                  disabled={!isValidPin(pincode)}
                  onPress={handleSubmitPin}>
                  <Text className="text-sm font-semibold text-gray-500">SUBMIT</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleForgetPincode}>
                <Text className="text-center text-xs font-medium tracking-wide text-primary">
                  FORGOT PINCODE?
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="mb-4 text-xs tracking-wider text-text">SET YOUR PINCODE</Text>

              <View className="mb-4 flex-row items-center border-b border-gray-300 pb-2">
                <Entypo name="lock" size={18} color="#EC1D3D" />
                <TextInput
                  className="ml-2 flex-1 text-sm text-text"
                  placeholder="Pincode"
                  placeholderTextColor="#888"
                  secureTextEntry
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChangeText={(t) => {
                    setNewPin(t.replace(/[^\d]/g, ''));
                    setErrorMessage('');
                  }}
                />
              </View>

              <View className="mb-6 flex-row items-center border-b border-gray-300 pb-2">
                <Entypo name="lock" size={18} color="#EC1D3D" />
                <TextInput
                  className="ml-2 flex-1 text-sm text-text"
                  placeholder="Confirm Pincode"
                  placeholderTextColor="#888"
                  secureTextEntry
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmNewPin}
                  onChangeText={(t) => {
                    setConfirmNewPin(t.replace(/[^\d]/g, ''));
                    setErrorMessage('');
                  }}
                />
              </View>

              {errorMessage ? <HelperText type="error">{errorMessage}</HelperText> : null}

              <View className="mb-4 flex-row gap-5">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center rounded bg-primary py-3"
                  onPress={handleLogout}>
                  <FontAwesome name="sign-out" size={16} color="#fff" />
                  <Text className="ml-2 text-sm font-semibold text-white">LOGOUT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 items-center rounded py-3 ${
                    isValidPin(newPin) && isValidPin(confirmNewPin) ? 'bg-gray-200' : 'bg-gray-300'
                  }`}
                  disabled={!isValidPin(newPin) || !isValidPin(confirmNewPin)}
                  onPress={handleSetNewPin}>
                  <Text className="text-sm font-semibold text-gray-500">SET NEW PIN</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      <Snackbar
        visible={visibleSnackbar}
        onDismiss={() => {
          setSuccessMessage('');
          setVisibleSnackbar(false);
        }}
        action={{
          label: 'OKAY',
          onPress: () => {
            setSuccessMessage('');
            setVisibleSnackbar(false);
          },
        }}>
        {successMessage}
      </Snackbar>
    </View>
  );
}
