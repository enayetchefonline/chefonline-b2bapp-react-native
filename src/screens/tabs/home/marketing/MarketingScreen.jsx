import React, { useLayoutEffect, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AppHeader from './../../../../components/AppHeader';
import COLORS from './../../../../constents/colors';

export default function MarketingScreen() {
  const navigation = useNavigation();
  const [modal, setModal] = useState(null);

  // Prefer selected restaurant, fallback to userInfo
  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;
  const restName = activeRestaurant?.restaurant_name || userInfo?.restaurant_name || 'Restaurant';

  // If no restaurant chosen, send user to selector
  useEffect(() => {
    if (!restId) {
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
    }
  }, [restId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Marketing"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  const marketingOptions = useMemo(
    () => [
      {
        label: 'SMS',
        icon: <Ionicons name="mail" size={20} color="#fff" />,
        bg: '#D87C37',
        modalKey: 'SMS',
      },
      {
        label: 'Newsletter',
        icon: <Ionicons name="mail-open-outline" size={20} color="#fff" />,
        bg: '#0B703C',
        modalKey: 'Newsletter',
      },
      {
        label: 'SEO',
        icon: <FontAwesome5 name="search" size={18} color="#fff" />,
        bg: '#2D278C',
        modalKey: 'SEO',
      },
      {
        label: 'SMM',
        icon: <MaterialIcons name="campaign" size={20} color="#fff" />,
        bg: '#980F24',
        modalKey: 'SMM',
      },
    ],
    []
  );

  const packages = useMemo(
    () => [
      { qty: 500, price: '£40' },
      { qty: 1000, price: '£60' },
      { qty: 2000, price: '£100' },
      { qty: 5000, price: '£200' },
    ],
    []
  );

  const modalColors = { SMS: '#D87C37', Newsletter: '#0B703C', SEO: '#2D278C', SMM: '#980F24' };
  const modalColorLight = { SMS: '#f1e5da', Newsletter: '#d9f2de', SEO: '#d9e2f2', SMM: '#f2d9da' };

  const openMail = (type, label, priceNumber) => {
    const subject = `ID: ${restId} | ${restName} | ${type} | ${label}`;
    const body = `Hello,\n\nI would like to purchase the ${type} package.\n\n${label} : £${priceNumber} + VAT\n\nPlease take this payment from my Merchant Account.\n\nThank you.`;
    const url = `mailto:mohibullah.siddiqui@chefonline.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(url);
  };

  const handlePackageAlert = (type, label, priceNumber) => {
    Alert.alert(
      'Would you like to purchase?',
      `${type} - ${label} : £${priceNumber}\n\nPayment will be taken from your Merchant Account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => openMail(type, label, priceNumber) },
      ]
    );
  };

  const handlePackageSelection = (qty, price) => {
    // strip "£" → pass numeric part for display/email
    handlePackageAlert(modal, String(qty), price.replace('£', ''));
  };

  if (!restId) {
    return (
      <View className="flex-1 items-center justify-center bg-backgroundLight">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-2 text-text">Preparing restaurant...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-backgroundLight px-4 pt-4">
      <ScrollView>
        {marketingOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setModal(item.modalKey)}
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

      {/* Shared Modal */}
      <Modal visible={!!modal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="w-full rounded-xl bg-white px-5 pb-4 pt-2">
            {/* Modal Header */}
            <View
              className="m-auto mt-[-30px] w-full rounded-md px-4 py-3"
              style={{ backgroundColor: modalColors[modal] }}>
              <Text className="text-base font-semibold text-white">{modal}</Text>
            </View>

            {/* Table Header */}
            <View className="m-auto my-3 w-full flex-row justify-between rounded-md bg-secondary px-4 py-2">
              <Text className="font-semibold text-white">Package (Tap to Select)</Text>
              <Text className="font-semibold text-white">Price</Text>
            </View>

            {/* Package List */}
            {packages.map((pkg, idx) => (
              <TouchableOpacity
                key={idx}
                className="m-auto mb-2 w-full flex-row items-center justify-between rounded-md px-4 py-2"
                style={{ backgroundColor: modalColorLight[modal] }}
                onPress={() => handlePackageSelection(pkg.qty, pkg.price)}>
                <Text className="text-sm text-gray-700">{pkg.qty}</Text>
                <Text className="text-sm font-semibold text-gray-800">{pkg.price}</Text>
              </TouchableOpacity>
            ))}

            {/* Note */}
            <Text className="w-full text-[11px] italic text-gray-500">
              * All Prices are subject to VAT.
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setModal(null)}
              className="mt-4 self-center rounded-md bg-primary px-6 py-2">
              <Text className="text-sm font-semibold text-white">CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
