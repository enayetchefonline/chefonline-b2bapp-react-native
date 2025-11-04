// src/screens/tabs/orders/OnlineOrderScreen.jsx
import { View, Text, TouchableOpacity, FlatList, Modal, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';

import AppHeader from './../../../components/AppHeader';
import { formatDateDMY } from './../../../utils/dateUtils';
import { getOrderList } from './../../../utils/apiService';
import COLORS from './../../../constents/colors';
import { useSelector } from 'react-redux';

export default function OnlineOrderScreen() {
  const navigation = useNavigation();

  // ---- restaurant context (multi-branch aware) ----
  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;

  // --- Data ---
  const [orderList, setOrderList] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    cashAmount: 0,
    cardAmount: 0,
    totalOrders: 0,
    collectionOrders: 0,
    deliveryOrders: 0,
  });

  // --- UI state ---
  const [loading, setLoading] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState('You have no orders yet.');

  // --- Date / Filter state ---
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [customRangeVisible, setCustomRangeVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [dateType, setDateType] = useState(null); // 'from' or 'to'
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  // --- Summary modal ---
  const [modalVisible, setModalVisible] = useState(false);

  // Nicely formatted label like "Aug 01, 2025 – Aug 23, 2025"
  const formattedFrom = dateFrom ? format(dateFrom, 'MMM dd, yyyy') : '';
  const formattedTo = dateTo ? format(dateTo, 'MMM dd, yyyy') : '';
  const dateLabel =
    dateFrom && dateTo
      ? `${formattedFrom} – ${formattedTo}`
      : `${format(new Date(), 'MMM dd, yyyy')} – ${format(new Date(), 'MMM dd, yyyy')}`;

  // ----- guard: require a restaurant -----
  useEffect(() => {
    if (!restId) {
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
    }
  }, [restId, navigation]);

  // ---------- Fetcher ----------
  const fetchOrderList = useCallback(
    async (fromDate = new Date(), toDate = new Date()) => {
      if (!restId) return;

      try {
        setLoading(true);
        setOrderList([]);

        // keep local state dates in sync for header/summary labels
        setDateFrom(fromDate);
        setDateTo(toDate);

        const response = await getOrderList({
          rest_id: restId,
          startDate: formatDateDMY(fromDate), // expects DD/MM/YYYY from your util
          endDate: formatDateDMY(toDate),
        });

        console.log('response', response);

        if (response?.status !== '1' || !Array.isArray(response?.orders)) {
          setEmptyMessage(response?.msg || 'No orders found.');
          setSummary({
            totalAmount: 0,
            cashAmount: 0,
            cardAmount: 0,
            totalOrders: 0,
            collectionOrders: 0,
            deliveryOrders: 0,
          });
          setOrderList([]);
          return;
        }

        setOrderList(response.orders);
        setEmptyMessage('No orders found.');

        let totalAmount = 0;
        let cashAmount = 0;
        let cardAmount = 0;
        let totalOrders = 0;
        let collectionOrders = 0;
        let deliveryOrders = 0;

        // Prefer API totals
        if (response?.total != null) totalAmount = parseFloat(response.total) || 0;
        if (Array.isArray(response?.payment)) {
          const cash = response.payment.find(
            (p) => (p.payment_method || '').toLowerCase() === 'cash'
          );
          const card = response.payment.find(
            (p) => (p.payment_method || '').toLowerCase() === 'card'
          );
          cashAmount = cash ? parseFloat(cash.amount || 0) : 0;
          cardAmount = card ? parseFloat(card.amount || 0) : 0;
        }
        if (response?.total_order != null) totalOrders = parseInt(response.total_order, 10) || 0;
        if (response?.total_collection_order != null)
          collectionOrders = parseInt(response.total_collection_order, 10) || 0;
        if (response?.total_delivery_order != null)
          deliveryOrders = parseInt(response.total_delivery_order, 10) || 0;

        // Fallbacks
        if (!totalAmount) {
          totalAmount = response.orders.reduce(
            (sum, o) => sum + (parseFloat(o.grand_total) || 0),
            0
          );
        }
        if (!cashAmount || !cardAmount) {
          const cashCalc = response.orders
            .filter((o) => (o.payment_method || '').toLowerCase() === 'cash')
            .reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);
          const cardCalc = response.orders
            .filter((o) => (o.payment_method || '').toLowerCase() === 'card')
            .reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);
          if (!cashAmount) cashAmount = cashCalc;
          if (!cardAmount) cardAmount = cardCalc;
        }
        if (!totalOrders) totalOrders = response.orders.length;
        if (!collectionOrders || !deliveryOrders) {
          collectionOrders =
            collectionOrders ||
            response.orders.filter((o) => (o.order_type || '').toLowerCase() === 'collection')
              .length;
          deliveryOrders =
            deliveryOrders ||
            response.orders.filter((o) => (o.order_type || '').toLowerCase() === 'delivery').length;
        }

        setSummary({
          totalAmount,
          cashAmount,
          cardAmount,
          totalOrders,
          collectionOrders,
          deliveryOrders,
        });
      } catch (error) {
        console.error('Error fetching order list:', error);
        setOrderList([]);
        setSummary({
          totalAmount: 0,
          cashAmount: 0,
          cardAmount: 0,
          totalOrders: 0,
          collectionOrders: 0,
          deliveryOrders: 0,
        });
        setEmptyMessage('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [restId]
  );

  // ---------- Filters ----------
  const handleFilter = () => setFilterSheetVisible(true);

  const handleReload = useCallback(() => {
    const today = new Date();
    fetchOrderList(today, today);
  }, [fetchOrderList]);

  const handleFilterOptions = (option) => {
    const today = new Date();
    switch (option) {
      case 'Today': {
        fetchOrderList(today, today);
        break;
      }
      case 'Yesterday': {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        fetchOrderList(y, y);
        break;
      }
      case 'Last 7 Days': {
        const start = new Date(today);
        start.setDate(today.getDate() - 6);
        fetchOrderList(start, today);
        break;
      }
      case 'Last 30 Days': {
        const start = new Date(today);
        start.setDate(today.getDate() - 29);
        fetchOrderList(start, today);
        break;
      }
      case 'This Month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fetchOrderList(start, end);
        break;
      }
      case 'Last Month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        fetchOrderList(start, end);
        break;
      }
      case 'Custom Range': {
        setCustomRangeVisible(true);
        break;
      }
      default:
        break;
    }
  };

  // ---------- Effects ----------
  // initial + re-run when restaurant changes
  useEffect(() => {
    const today = new Date();
    if (restId) fetchOrderList(today, today);
  }, [restId, fetchOrderList]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Online Order"
          showBack={false}
          showFilter
          showReload
          onFilterPress={handleFilter}
          onReloadPress={handleReload}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation, handleReload]);

  // ---------- Render ----------
  return (
    <View className="flex-1 bg-backgroundLight px-4 pt-4">
      {/* Summary Card */}
      <View className="mb-4 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow">
        <Text className="text-xs text-gray-700">{dateLabel}</Text>
        <Text className="mt-1 text-sm font-semibold text-gray-800">TOTAL AMOUNT</Text>
        <Text className="mt-1 text-lg font-bold text-gray-800">
          £{summary.totalAmount.toFixed(2)}
        </Text>

        <View className="mt-3 h-[1px] w-full bg-gray-300" />

        <TouchableOpacity className="mt-3" onPress={() => setModalVisible(true)}>
          <Text className="bg-primary/10 p-2 text-xs font-semibold text-primary">MORE</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#EC1D3D" className="mt-6" />
      ) : (
        <FlatList
          data={orderList}
          keyExtractor={(item, index) => `${item.order_no || index}-${index}`}
          ListEmptyComponent={
            <View>
              <Ionicons
                name="cart-outline"
                size={60}
                color={COLORS.grey}
                style={{ alignSelf: 'center' }}
              />
              <Text className="mt-4 text-center text-gray-500">{emptyMessage}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('OrderDetails', { order: item })}
              className="mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-text">{item.customer_name}</Text>
              </View>

              <View className="my-2 h-[1px] w-full bg-gray-300" />

              <View className="flex-col gap-1">
                <View className="mb-1 flex-row items-center justify-between">
                  <View className="flex-row">
                    <Ionicons name="location-sharp" size={14} color="#EC1D3D" />
                    <Text className="ml-1 text-xs text-gray-600">{item.postcode}</Text>
                  </View>
                  <Text className="text-xs text-gray-500">{item.order_date}</Text>
                </View>

                <View className="mb-1 flex-row items-center justify-between">
                  <View className="flex-row">
                    <MaterialCommunityIcons name="storefront-outline" size={14} color="#EC1D3D" />
                    <Text className="ml-1 text-xs text-gray-600">{item.order_type}</Text>
                  </View>
                  <Text className="text-right text-xs text-gray-700">
                    {item.payment_method} £{item.grand_total}
                  </Text>
                </View>

                <View className="mt-1 flex-row items-center">
                  <Text className="text-xs text-gray-700">IN: {item.order_in}</Text>
                  <View className="mx-2 h-3 w-px bg-gray-300" />
                  <Text className="text-xs text-gray-700">OUT: {item.order_out}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Summary Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-11/12 items-center rounded-lg bg-white p-5">
            <Text className="mb-1 text-base text-text">{dateLabel}</Text>
            <Text className="mb-1 text-base font-bold text-text">TOTAL AMOUNT</Text>
            <Text className="mb-5 text-2xl font-bold text-primary">
              £{summary.totalAmount.toFixed(2)}
            </Text>

            <View className="mb-4 w-full flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="mb-1 text-xs text-gray-600">Cash</Text>
                <Text className="text-base font-bold text-text">
                  £{summary.cashAmount.toFixed(2)}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="mb-1 text-xs text-gray-600">Card</Text>
                <Text className="text-base font-bold text-text">
                  £{summary.cardAmount.toFixed(2)}
                </Text>
              </View>
            </View>

            <View className="mb-4 w-full flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="mb-1 text-center text-xs text-gray-600">TOTAL ORDERS</Text>
                <Text className="text-base font-bold text-text">{summary.totalOrders}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="mb-1 text-center text-xs text-gray-600">COLLECTION</Text>
                <Text className="text-base font-bold text-text">{summary.collectionOrders}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="mb-1 text-center text-xs text-gray-600">DELIVERY</Text>
                <Text className="text-base font-bold text-text">{summary.deliveryOrders}</Text>
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

      {/* Filter Bottom Sheet */}
      <Modal
        visible={filterSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterSheetVisible(false)}>
        <TouchableOpacity
          className="flex-1 justify-end bg-black/40"
          activeOpacity={1}
          onPressOut={() => setFilterSheetVisible(false)}>
          <View className="rounded-t-2xl bg-white p-5">
            <Text className="mb-4 text-center text-base font-bold text-gray-800">
              Filter Options
            </Text>

            {[
              'Today',
              'Yesterday',
              'Last 7 Days',
              'Last 30 Days',
              'This Month',
              'Last Month',
              'Custom Range',
            ].map((option, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  handleFilterOptions(option);
                  setFilterSheetVisible(false);
                }}
                className="mb-3 rounded-md bg-gray-100 px-4 py-3">
                <Text className="text-center text-sm font-medium text-gray-700">{option}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setFilterSheetVisible(false)}
              className="mt-4 rounded bg-red-500 px-4 py-2">
              <Text className="text-center font-bold text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Range Modal */}
      <Modal visible={customRangeVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-11/12 rounded-xl bg-white px-5 py-6">
            <Text className="mb-4 text-center text-lg font-semibold text-text">CUSTOM RANGE</Text>

            <View className="mb-6 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  setDateType('from');
                  setDatePickerVisibility(true);
                }}
                className="mr-2 flex-1 flex-row items-center border-b border-gray-300 pb-2">
                <Ionicons name="calendar" size={20} color="black" />
                <Text className="ml-2 text-sm text-gray-600">
                  {dateFrom ? dateFrom.toLocaleDateString() : 'DATE FROM'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDateType('to');
                  setDatePickerVisibility(true);
                }}
                className="ml-2 flex-1 flex-row items-center border-b border-gray-300 pb-2">
                <Ionicons name="calendar" size={20} color="black" />
                <Text className="ml-2 text-sm text-gray-600">
                  {dateTo ? dateTo.toLocaleDateString() : 'DATE TO'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => {
                  setCustomRangeVisible(false);
                }}
                className="mr-2 flex-1 rounded bg-red-500 py-2">
                <Text className="text-center font-bold text-white">CLOSE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!dateFrom || !dateTo}
                onPress={() => {
                  if (dateFrom && dateTo) {
                    fetchOrderList(dateFrom, dateTo);
                  }
                  setCustomRangeVisible(false);
                }}
                className={`ml-2 flex-1 rounded py-2 ${dateFrom && dateTo ? 'bg-primary' : 'bg-gray-300'}`}>
                <Text className="text-center font-bold text-white">SUBMIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DateTime Picker */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => {
          setDatePickerVisibility(false);
          if (dateType === 'from') {
            setDateFrom(date);
            if (dateTo && dateTo < date) setDateTo(null);
          } else if (dateType === 'to') {
            setDateTo(date);
          }
        }}
        onCancel={() => setDatePickerVisibility(false)}
        maximumDate={new Date()}
        minimumDate={dateType === 'to' && dateFrom ? dateFrom : undefined}
      />
    </View>
  );
}
