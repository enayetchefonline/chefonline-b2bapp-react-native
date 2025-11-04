// app/screens/InvoiceManager.jsx
import { useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppHeader from './../../../../components/AppHeader';
import {
  getInvoiceList,
  getInvoiceDownloadUrl,
  getInvoiceDetailsPageUrl,
} from './../../../../utils/apiService';
import { useSelector } from 'react-redux';

export default function InvoiceManager() {
  const navigation = useNavigation();

  // 🔑 Prefer activeRestaurant → fallback to original rest_id
  const activeRestId = useSelector((s) => s.user?.activeRestaurant?.restaurant_id);
  const fallbackRestId = useSelector((s) => s.user?.userInfo?.rest_id);
  const restId = activeRestId || fallbackRestId;

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [all, setAll] = useState([]);
  const [list, setList] = useState([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Invoices"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  const fetchInvoices = useCallback(async () => {
    if (!restId) {
      setAll([]);
      setList([]);
      return;
    }
    setLoading(true);
    try {
      // debug log of API params
      console.log('[InvoiceManager] getInvoiceList params:', { rest_id: restId });
      const data = await getInvoiceList({ rest_id: restId });
      const arr = Array.isArray(data) ? data : [];
      setAll(arr);
      setList(
        search.trim()
          ? arr.filter(
              (it) =>
                String(it.week_no ?? '').includes(search.trim()) ||
                String(it.InvoiceNo ?? '')
                  .toLowerCase()
                  .includes(search.trim().toLowerCase())
            )
          : arr
      );
    } finally {
      setLoading(false);
    }
  }, [restId, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filterByWeek = (txt) => {
    setSearch(txt);
    if (!txt) return setList(all);
    setList(
      all.filter(
        (it) =>
          String(it.week_no ?? '').includes(txt.trim()) ||
          String(it.InvoiceNo ?? '')
            .toLowerCase()
            .includes(txt.trim().toLowerCase())
      )
    );
  };

  const openInvoice = (item) => {
    navigation.navigate('InvoiceDetail', {
      downloadUrl: getInvoiceDownloadUrl(item?.InvoiceNo),
      url: getInvoiceDetailsPageUrl(item?.InvoiceNo),
      weekNo: item?.week_no,
    });
  };

  if (!restId) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="text-gray-500">
          No restaurant selected. Please choose a restaurant first.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-4 flex-row items-center rounded border border-gray-300 bg-white px-3 py-2">
        <FontAwesome name="search" size={18} color="#666" />
        <TextInput
          placeholder="Search Week Number or Invoice No..."
          keyboardType="default"
          value={search}
          onChangeText={filterByWeek}
          className="ml-2 flex-1 text-black"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, i) => String(item?.id ?? item?.InvoiceNo ?? i)}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openInvoice(item)}
              className="mb-3 rounded border border-gray-200 bg-white p-4">
              <Text className="text-base font-semibold">Week Number: {item?.week_no}</Text>
              <Text className="text-sm text-gray-700">Invoice No: {item?.InvoiceNo}</Text>
              <Text className="text-sm text-gray-700">Invoice Year: {item?.InvYear}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="mt-16 items-center">
              <Text className="text-gray-500">No invoices found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
