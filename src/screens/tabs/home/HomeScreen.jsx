// screens/tabs/home/HomeScreen.jsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import AppHeader from './../../../components/AppHeader';
import { getRestaurantSummaryData } from './../../../utils/apiService';
import COLORS from './../../../constents/colors';

export default function HomeScreen() {
  const navigation = useNavigation();

  // ======== restaurant context (active -> fallback to userInfo) ========
  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;
  const restaurantName =
    activeRestaurant?.restaurant_name || userInfo?.restaurant_name || 'Partner Center';

  // ======== UI state ========
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const [TotalOrderAmount, setTotalOrderAmount] = useState(0);
  const [CardAmount, setCardAmount] = useState(0);
  const [CardOrder, setCardOrder] = useState(0);
  const [CashAmount, setCashAmount] = useState(0);
  const [CashOrder, setCashOrder] = useState(0);
  const [TotalOrder, setTotalOrder] = useState(0);
  const [TotalDelivery, setTotalDelivery] = useState(0);
  const [TotalCollection, setTotalCollection] = useState(0);

  // Format like: "Jul 09, 2025"
  const displayDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }, []);

  // ======== guard: if no restaurant selected, send to picker ========
  useEffect(() => {
    if (!restId) {
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
    }
  }, [restId, navigation]);

  // ======== data fetch ========
  const fetchRestaurantSummaryData = useCallback(async () => {
    if (!restId) return; // guarded above, but double-check
    setLoading(true);
    try {
      const response = await getRestaurantSummaryData({ rest_id: restId });
      const d = response?.details || {};
      setTotalOrderAmount(Number(d.total_amount || 0));
      setTotalOrder(Number(d.total_order || 0));
      setCardAmount(Number(d.card || 0));
      setCardOrder(Number(d.total_card_order || 0));
      setCashAmount(Number(d.cash || 0));
      setCashOrder(Number(d.total_cash_order || 0));
      setTotalDelivery(Number(d.total_delivery || 0));
      setTotalCollection(Number(d.total_collection || 0));
    } catch (error) {
      console.error('Summary fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [restId]);

  useEffect(() => {
    fetchRestaurantSummaryData();
  }, [fetchRestaurantSummaryData]);

  const handleReload = useCallback(() => {
    fetchRestaurantSummaryData();
  }, [fetchRestaurantSummaryData]);

  // ======== services list ========
  const services = [
    {
      label: 'Online Order',
      icon: <MaterialCommunityIcons name="food" size={24} color="#fff" />,
      color: '#2e7d32',
      link: 'OnlineOrderTab',
    },
    {
      label: 'Reservations',
      icon: <MaterialCommunityIcons name="calendar-check" size={24} color="#fff" />,
      color: '#3949ab',
      link: 'ReservationsTab',
    },
    {
      label: 'EPoS Dashboard',
      icon: <MaterialCommunityIcons name="monitor-dashboard" size={24} color="#fff" />,
      color: '#6a1b9a',
      link: 'EposDashboard',
    },
    {
      label: 'Marketing',
      icon: <MaterialCommunityIcons name="bullhorn" size={24} color="#fff" />,
      color: '#1565c0',
      link: 'Marketing',
    },
    {
      label: 'Support',
      icon: <MaterialCommunityIcons name="headset" size={24} color="#fff" />,
      color: '#ef6c00',
      link: 'Support',
    },
    {
      label: 'FAQ',
      icon: <Ionicons name="help-circle-outline" size={24} color="#fff" />,
      color: '#d84315',
      link: 'Faq',
    },
  ];

  // ======== header ========
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title={restaurantName}
          showBack={false}
          showFilter={false}
          showReload
          onReloadPress={handleReload}
          textColor="text-text"
          bgColor="bg-white"
        />
      ),
    });
  }, [navigation, handleReload, restaurantName]);

  if (!restId) {
    // very short interim while reset happens
    return (
      <View className="flex-1 items-center justify-center bg-backgroundLight">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-2 text-text">Preparing restaurant...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-backgroundLight">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-2 text-text">Loading summary...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-backgroundLight" contentContainerStyle={{ paddingBottom: 70 }}>
      {/* Summary Card */}
      <View className="m-4 rounded-2xl bg-primary p-5">
        <View className="mb-2 flex-row justify-between">
          <Text className="text-sm text-white">{displayDate}</Text>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#fff"
            onPress={() => setModalVisible(true)}
          />
        </View>
        <Text className="mb-1 text-sm font-bold text-white">TOTAL AMOUNT</Text>
        <Text className="mb-3 text-2xl font-bold text-white">£{TotalOrderAmount.toFixed(2)}</Text>

        <View className="flex-row justify-between">
          <View className="mx-1 flex-1 items-center rounded-lg bg-white/10 p-3">
            <MaterialCommunityIcons name="cash" size={20} color="#fff" />
            <Text className="my-1 text-xs text-white">CASH ({CashOrder})</Text>
            <Text className="font-bold text-white">£{CashAmount.toFixed(2)}</Text>
          </View>
          <View className="mx-1 flex-1 items-center rounded-lg bg-white/10 p-3">
            <MaterialCommunityIcons name="credit-card-outline" size={20} color="#fff" />
            <Text className="my-1 text-xs text-white">CARD ({CardOrder})</Text>
            <Text className="font-bold text-white">£{CardAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Action list */}
      <View className="mt-2 px-4">
        {services.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate(item.link)}
            className="mb-3 flex-row items-center rounded-lg bg-white p-4 shadow-sm">
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-md"
              style={{ backgroundColor: item.color }}>
              {item.icon}
            </View>
            <Text className="flex-1 text-base font-medium text-text">{item.label}</Text>
            <Ionicons name="chevron-forward-circle-outline" size={22} color="#bbb" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-11/12 items-center rounded-lg bg-white p-5">
            <Text className="mb-1 text-base text-text">{displayDate}</Text>
            <Text className="mb-1 text-base font-bold text-text">TOTAL AMOUNT</Text>
            <Text className="mb-5 text-2xl font-bold text-primary">
              £{TotalOrderAmount.toFixed(2)}
            </Text>

            <View className="mb-4 w-full flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="mb-1 text-xs text-gray-600">Cash</Text>
                <Text className="text-base font-bold text-text">£{CashAmount.toFixed(2)}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="mb-1 text-xs text-gray-600">Card</Text>
                <Text className="text-base font-bold text-text">£{CardAmount.toFixed(2)}</Text>
              </View>
            </View>

            <View className="mb-4 w-full flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="mb-1 text-center text-xs text-gray-600">TOTAL ORDERS</Text>
                <Text className="text-base font-bold text-text">{TotalOrder}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="mb-1 text-center text-xs text-gray-600">COLLECTION</Text>
                <Text className="text-base font-bold text-text">{TotalCollection}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="mb-1 text-center text-xs text-gray-600">DELIVERY</Text>
                <Text className="text-base font-bold text-text">{TotalDelivery}</Text>
              </View>
            </View>

            <TouchableOpacity
              className="rounded bg-primary px-8 py-2"
              onPress={() => setModalVisible(false)}>
              <Text className="font-bold text-white">CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
