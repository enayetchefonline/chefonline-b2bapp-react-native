import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from './../../../../components/AppHeader';

// -------- helpers --------
const toNum = (v, fallback = 0) =>
  v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : fallback;

const fmtGBP = (n) => `£${toNum(n).toFixed(2)}`;

const normalizeItems = (rawItems = []) =>
  rawItems.map((it) => ({
    name: it.name || it.item_name || it.product_name || it.menu_name || it.title || 'Item',
    qty: toNum(it.qty ?? it.quantity ?? it.item_qty, 1),
    // Some APIs give unit price, some give line total; assume price field if present
    price: toNum(it.price ?? it.item_price ?? it.unit_price ?? it.total, 0),
  }));

const normalizeOrder = (o) => {
  if (!o) return null;

  // Try to build an address from parts if 'address' missing
  const addressParts = [o.address, o.address1, o.address2, o.city, o.town, o.postcode].filter(
    Boolean
  );

  // Try to find items in multiple possible places
  const rawItems =
    (Array.isArray(o.items) && o.items) ||
    (Array.isArray(o.order_items) && o.order_items) ||
    (Array.isArray(o.details?.items) && o.details.items) ||
    [];

  return {
    name: o.customer_name || o.name || o.customer || 'Customer',
    address: addressParts.length ? addressParts.join(', ') : o.postcode || '—',
    phone: o.customer_mobile || o.phone || o.customer_phone || '',
    date: o.order_date || o.date || '—',
    timeIn: o.order_in || o.timeIn || '—',
    timeOut: o.order_out || o.timeOut || '—',
    type: o.order_type || o.type || '—',
    payment: o.payment_method || o.payment || '—',
    subtotal: toNum(o.sub_total ?? o.subtotal, 0),
    discount: toNum(o.discount ?? o.discount_amount, 0),
    total: toNum(o.grand_total ?? o.total, 0),
    items: normalizeItems(rawItems),
  };
};

// Fallback dummy (only used if route param missing)
const fallbackOrder = {
  name: 'Julie Bowles',
  address: '83 Send Road, Send, GU23 7EZ',
  phone: '+447860632452',
  date: 'Jul 09, 2025',
  timeIn: '8:10 PM',
  timeOut: '8:45 PM',
  type: 'Collection',
  payment: 'Card',
  subtotal: 87.0,
  discount: 8.7,
  total: 78.3,
  items: [
    { name: 'Butter Chicken', qty: 1, price: 15 },
    { name: 'Korzai Lamb', qty: 1, price: 15 },
    { name: 'Chicken Tikka Biriani', qty: 1, price: 16 },
    { name: 'Lamb Tikka Biriani', qty: 1, price: 16 },
    { name: 'Saag Paneer', qty: 1, price: 6 },
    { name: 'Pilau Rice', qty: 1, price: 4 },
    { name: 'Chilli Masala;Chicken', qty: 1, price: 15 },
  ],
};

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const incomingOrder = route.params?.order;

  const order = useMemo(() => {
    const normalized = normalizeOrder(incomingOrder);
    // If we couldn’t normalize (no route param), use fallback
    if (!normalized) return normalizeOrder(fallbackOrder);
    // If totals missing but we have items, compute a reasonable fallback subtotal/total
    const hasTotals = normalized.subtotal > 0 || normalized.total > 0 || normalized.discount > 0;
    if (!hasTotals && Array.isArray(normalized.items) && normalized.items.length) {
      const computedSubtotal = normalized.items.reduce(
        (sum, it) => sum + toNum(it.price) * toNum(it.qty, 1),
        0
      );
      return {
        ...normalized,
        subtotal: computedSubtotal,
        total: computedSubtotal - normalized.discount,
      };
    }
    return normalized;
  }, [incomingOrder]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader title="Order Details" showBack bgColor="bg-white" textColor="text-text" />
      ),
    });
  }, [navigation]);

  const handleCall = async () => {
    if (!order?.phone) {
      Alert.alert('No phone number', 'This order has no customer phone number.');
      return;
    }
    const url = `tel:${order.phone}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('Cannot open dialer');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to place call', `Please dial ${order.phone} manually.`);
    }
  };

  return (
    <ScrollView className="flex-1 bg-backgroundLight px-4 pt-4">
      {/* Header Card */}
      <View className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
        <View className="mb-2 flex-row justify-between">
          <Text className="text-xs text-gray-700">{order.date}</Text>
          <Text className="text-xs font-semibold text-gray-700">{order.type}</Text>
        </View>
        <View className="mb-2 flex-row justify-between">
          <Text className="text-xs text-gray-600">IN TIME: {order.timeIn}</Text>
          <Text className="text-xs text-gray-600">OUT TIME: {order.timeOut}</Text>
        </View>

        <View className="my-2 h-[1px] w-full bg-gray-200" />

        <View className="flex-row items-center justify-between">
          <View className="pr-3">
            <Text className="text-sm font-semibold text-text">{order.name}</Text>
            <Text className="text-xs text-gray-600">{order.address}</Text>
            {!!order.phone && <Text className="text-xs text-gray-600">{order.phone}</Text>}
          </View>
          <TouchableOpacity
            onPress={handleCall}
            disabled={!order.phone}
            className={`mt-3 self-end rounded px-4 py-1.5 ${
              order.phone ? 'bg-primary' : 'bg-gray-300'
            }`}>
            <View className="flex-row items-center gap-1">
              <Ionicons name="call" size={14} color="#fff" />
              <Text className="text-sm font-bold text-white">CALL</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List */}
      <View className="mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <View className="flex-row justify-between bg-gray-100 px-4 py-2">
          <Text className="w-1/2 text-xs font-semibold text-gray-600">DISH</Text>
          <Text className="w-1/4 text-center text-xs font-semibold text-gray-600">QTY</Text>
          <Text className="w-1/4 text-right text-xs font-semibold text-gray-600">PRICE</Text>
        </View>

        {Array.isArray(order.items) && order.items.length > 0 ? (
          order.items.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              className="flex-row items-center justify-between border-b border-gray-100 px-4 py-2">
              <Text className="w-1/2 text-xs text-gray-800">{item.name}</Text>
              <Text className="w-1/4 text-center text-xs text-gray-800">{item.qty}</Text>
              <Text className="w-1/4 text-right text-xs text-gray-800">{fmtGBP(item.price)}</Text>
            </View>
          ))
        ) : (
          <View className="px-4 py-3">
            <Text className="text-center text-xs text-gray-500">
              No items found for this order.
            </Text>
          </View>
        )}
      </View>

      {/* Summary */}
      <View className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-600">SUBTOTAL</Text>
          <Text className="text-xs font-semibold text-gray-800">{fmtGBP(order.subtotal)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-600">DISCOUNT</Text>
          <Text className="text-xs font-semibold text-gray-800">{fmtGBP(order.discount)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-600">TOTAL</Text>
          <Text className="text-sm font-bold text-gray-900">{fmtGBP(order.total)}</Text>
        </View>
      </View>

      {/* Footer Info */}
      <View className="mb-5 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-600">TOTAL ITEMS</Text>
          <Text className="text-xs font-semibold text-gray-800">
            {Array.isArray(order.items) ? order.items.length : 0}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-600">PAYMENT METHOD</Text>
          <Text className="text-xs font-semibold text-gray-800">{order.payment}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
