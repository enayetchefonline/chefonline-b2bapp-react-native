import React, { useLayoutEffect, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppHeader from './../../../../components/AppHeader';
import { useSelector } from 'react-redux';

export default function SupportScreen() {
  const navigation = useNavigation();

  // Prefer selected restaurant (multi-branch) → fallback to login payload
  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;
  const restName = activeRestaurant?.restaurant_name || userInfo?.restaurant_name || 'Restaurant';

  console.log('restId', restId, 'restName', restName);

  useEffect(() => {
    if (!restId) {
      // No restaurant set → ask user to choose
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
    }
  }, [restId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Support"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  const supportOptions = [
    {
      label: 'Email',
      icon: <MaterialIcons name="email" size={20} color="#fff" />,
      bg: '#2D278C',
      modalKey: 'Email',
    },
    {
      label: 'Call Us',
      icon: <MaterialIcons name="call" size={20} color="#fff" />,
      bg: '#D87C37',
      modalKey: 'Call',
    },
  ];

  const openTel = async (phone) => {
    const url = Platform.select({ ios: `tel:${phone}`, android: `tel:${phone}` });
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('Cannot open dialer');
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Unable to place call', `Please dial ${phone} manually.`);
    }
  };

  const openMail = async (to, subject, body) => {
    const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('Cannot open mail client');
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Email not configured', `Please email ${to} with subject:\n\n${subject}`);
    }
  };

  const handlePress = (modalKey) => {
    if (modalKey === 'Call') {
      openTel('03303801000');
    } else if (modalKey === 'Email') {
      const email = 'support@chefonline.co.uk';
      const subject = `ID: ${restId} | ${restName}`;
      const body = 'Hello,\n\nI need assistance with...';
      openMail(email, subject, body);
    }
  };

  if (!restId) {
    // brief guard while we redirect above
    return <View className="flex-1 bg-backgroundLight" />;
  }

  return (
    <View className="flex-1 bg-backgroundLight px-4 pt-4">
      <ScrollView>
        {supportOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(item.modalKey)}
            className="mb-3 flex-row items-center rounded-lg bg-white px-4 py-3 shadow-sm">
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-md"
              style={{ backgroundColor: item.bg }}>
              {item.icon}
            </View>
            <Text className="text-base text-gray-800">{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
