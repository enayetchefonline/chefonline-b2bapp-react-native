// src/screens/tabs/settings/AddBranch.jsx

import { Entypo, FontAwesome } from '@expo/vector-icons';
import { useLayoutEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AppHeader from './../../../../components/AppHeader';
import config from './../../../../constents/config';
import { addBranch } from './../../../../utils/apiService';

const EMAIL_RE = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;

export default function AddBranch() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // current restaurant id from store
  const restId = useSelector((state) => state.user?.userInfo?.rest_id);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Add Branch"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  const validateEmail = (val) => EMAIL_RE.test(String(val || '').trim());

  const handleAddBranch = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Validation Error', 'Enter a valid email address.');
      return;
    }
    if (!restId) {
      Alert.alert('Missing Data', 'Restaurant ID not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      const data = await addBranch({
        parent_restaurant_id: restId,
        username: email.trim(),
        password,
      });

      console.log('add branch response', data);

      if (data?.status !== 'Failure') {
        Alert.alert(
          'Branch Added',
          data?.msg || 'Branch has been added successfully.',
          [{ text: 'Go Back', onPress: () => navigation.goBack() }, { text: 'OK' }],
          { cancelable: true }
        );
        setEmail('');
        setPassword('');
      } else {
        Alert.alert('Error', data?.msg || 'Unable to add branch. Please try again.');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disabled = !email || !password || loading;

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      {/* Email */}
      <View className="mb-5 w-full flex-row items-center border-b border-border">
        <FontAwesome name="envelope" size={20} color="#EC1D3D" />
        <TextInput
          className="ml-2 h-10 flex-1 text-text"
          placeholder="EMAIL"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
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
          onChangeText={setPassword}
        />
      </View>

      {/* Add Branch Button */}
      <TouchableOpacity
        disabled={disabled}
        className={`mt-2 w-full items-center rounded py-2 ${disabled ? 'bg-gray-300' : 'bg-primary'}`}
        onPress={handleAddBranch}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-bold text-white">ADD BRANCH</Text>
        )}
      </TouchableOpacity>

      {/* Footer */}
      <Text className="absolute bottom-5 text-center text-xs text-primary">
        © Chefonline 2025, All rights reserved.{'\n'}Version {config.APP_VERSION}
      </Text>
    </View>
  );
}
