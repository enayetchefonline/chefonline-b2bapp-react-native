import React, { useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import AppHeader from './../../../../components/AppHeader';

export default function NotificationCode() {
  const navigation = useNavigation();
  const [code] = useState(() => generateRandomCode());

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Notification Code"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  function generateRandomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  }

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Toast.show({
      type: 'success',
      text1: 'Copied!',
      text2: 'Verification code copied to clipboard.',
      position: 'bottom',
    });
  };

  return (
    <View className="flex-1 items-center justify-center bg-background px-4">
      <Text className="mb-4 text-xl font-bold text-text">Your Notification Code</Text>

      <View className="mb-6 rounded-xl border border-gray-300 bg-white px-6 py-4 shadow">
        <Text className="font-mono text-3xl font-bold tracking-widest text-primary">{code}</Text>
      </View>

      <TouchableOpacity className="rounded-md bg-primary px-6 py-3" onPress={handleCopy}>
        <Text className="text-sm font-semibold text-white">COPY CODE</Text>
      </TouchableOpacity>
    </View>
  );
}
