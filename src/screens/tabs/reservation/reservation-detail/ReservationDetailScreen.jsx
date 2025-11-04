// src/screens/tabs/reservations/ReservationDetailScreen.jsx
import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from './../../../../components/AppHeader';

// -- helpers --
const toNum = (v, f = 0) => (v === 0 || v ? Number(v) || f : f);

const normalizeReservation = (r) => {
  if (!r) return null;
  const fullName =
    r.name || [r.title, r.first_name, r.last_name].filter(Boolean).join(' ').trim() || '—';

  // Dates/times from various backends
  const date = r.date || r.reservation_date || r.req_date || '—';
  const time = r.time || r.reservation_time || r.req_time || '—';

  // Created/added/requested
  const createdRaw =
    r.created_at || r.added_date || r.request_time || r.request_date_time || r.req_datetime || '';

  return {
    id: r.id ?? r.reservation_id ?? '',
    name: fullName,
    email: (r.email || '').trim(),
    phone: r.mobile || r.telephone || r.phone || '',
    guests: toNum(r.guests ?? r.no_of_guest ?? r.person, 0),
    date,
    time,
    createdAt: createdRaw || '—',
  };
};

export default function ReservationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const raw = route.params?.reservation;
  const status = route.params?.status || 'UNCONFIRMED';

  const resv = useMemo(() => normalizeReservation(raw), [raw]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader title="Reservation Details" showBack bgColor="bg-white" textColor="text-text" />
      ),
    });
  }, [navigation]);

  const handleCall = async () => {
    if (!resv?.phone) {
      Alert.alert('No phone number', 'This reservation has no phone number.');
      return;
    }
    const url = `tel:${resv.phone}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('Cannot open dialer');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to place call', `Please dial ${resv.phone} manually.`);
    }
  };

  if (!resv) {
    return (
      <View className="flex-1 items-center justify-center bg-backgroundLight px-4">
        <Text className="text-gray-600">No reservation data.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-backgroundLight px-4 py-4">
      {/* Summary */}
      <View className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <View className="mb-2 flex-row justify-between">
          <Text className="text-xs text-gray-700">Reservation Date</Text>
          <Text className="text-xs text-gray-700">
            {resv.date} {resv.time}
          </Text>
        </View>

        <View className="mb-2 flex-row justify-between">
          <Text className="text-xs text-gray-700">Created Date</Text>
          <Text className="text-xs text-gray-700">{resv.createdAt}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-700">Number of Guests</Text>
          <Text className="text-xs font-bold text-text">{resv.guests}</Text>
        </View>
      </View>

      {/* Contact Info */}
      <View className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
        <View className="pr-3">
          <Text className="text-sm font-medium text-text">{resv.name}</Text>
          {!!resv.email && <Text className="text-xs text-gray-600">{resv.email}</Text>}
          {!!resv.phone && <Text className="text-xs text-gray-600">{resv.phone}</Text>}
        </View>

        <TouchableOpacity
          onPress={handleCall}
          disabled={!resv.phone}
          className={`rounded px-4 py-1.5 ${resv.phone ? 'bg-primary' : 'bg-gray-300'}`}>
          <View className="flex-row items-center gap-1">
            <Ionicons name="call" size={14} color="#fff" />
            <Text className="text-sm font-bold text-white">CALL</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Show Accept/Reject only for UNCONFIRMED */}
      {status === 'UNCONFIRMED' && (
        <View className="mb-5 flex-row items-center justify-between gap-4">
          <TouchableOpacity
            className="flex-1 rounded bg-red-600 py-3"
            onPress={() => Alert.alert('Reject', 'Implement API call to reject here.')}>
            <Text className="text-center font-bold text-white">REJECT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded bg-primary py-3"
            onPress={() => Alert.alert('Accept', 'Implement API call to accept here.')}>
            <Text className="text-center font-bold text-white">ACCEPT</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
