// src/screens/tabs/reservations/ReservationScreen.jsx
import React, { useEffect, useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import AppHeader from './../../../components/AppHeader';
import { getReservationList } from './../../../utils/apiService';
import { formatDateDMY } from './../../../utils/dateUtils';

// Map backend status -> tabs
const STATUS_TO_TAB = (s) => {
  if (s === '1' || s === 'accepted') return 'CONFIRMED';
  if (s === '-1' || s === 'rejected') return 'REJECTED';
  return 'UNCONFIRMED';
};

// Convert "6:40 PM" -> {h: 18, m: 40}
const parse12to24 = (t) => {
  if (!t) return { h: 0, m: 0 };
  const m = String(t).match(/^\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*$/i);
  if (!m) return { h: 0, m: 0 };
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { h, m: min };
};

// Parse '27-05-2025' + '6:40 PM' reliably into Date
const parseResvDate = (dmy, time12) => {
  if (!dmy) return new Date(0);
  const [dd, mm, yyyy] = dmy.split('-').map((n) => parseInt(n, 10));
  const { h, m } = parse12to24(time12 || '00:00 AM');
  // Build ISO-ish string to avoid platform-dependent parsing
  const iso = `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  return new Date(iso);
};

export default function ReservationScreen() {
  const navigation = useNavigation();

  // ---- restaurant context (multi-branch) ----
  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;

  // -------- UI / state --------
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('UNCONFIRMED');

  // Range state (DD/MM/YYYY for label only)
  const todayStr = formatDateDMY(new Date());
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [isFiltered, setIsFiltered] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [customRangeVisible, setCustomRangeVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [dateType, setDateType] = useState(null); // 'from' | 'to'
  const [dateFromObj, setDateFromObj] = useState(new Date());
  const [dateToObj, setDateToObj] = useState(new Date());

  // Grouped lists
  const [listsByTab, setListsByTab] = useState({
    UNCONFIRMED: [],
    CONFIRMED: [],
    REJECTED: [],
  });

  const counts = useMemo(
    () => ({
      UNCONFIRMED: listsByTab.UNCONFIRMED.length,
      CONFIRMED: listsByTab.CONFIRMED.length,
      REJECTED: listsByTab.REJECTED.length,
    }),
    [listsByTab]
  );

  // -------- Helpers --------
  const dateLabel = isFiltered ? `${startDate} – ${endDate}` : 'Upcoming reservations';
  const toDDMMYYYY = (d) => formatDateDMY(d);

  // ---- guard: require selected restaurant ----
  useEffect(() => {
    if (!restId) {
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
    }
  }, [restId, navigation]);

  // -------- Fetcher --------
  const normalizeBucket = (arr, statusKey) =>
    (Array.isArray(arr?.list) ? arr.list : Array.isArray(arr) ? arr : []).map((r) => {
      const fullName = [r.title, r.first_name, r.last_name].filter(Boolean).join(' ').trim();
      const sortKey = parseResvDate(r.reservation_date, r.reservation_time).getTime();
      return {
        id: r.id,
        name: fullName || '—',
        phone: r.mobile || r.telephone || '—',
        email: (r.email || '').trim(),
        guests: Number(r.no_of_guest || 0),
        date: r.reservation_date, // DD-MM-YYYY (backend)
        time: r.reservation_time, // 12h
        platform: r.platform,
        status: String(r.status ?? statusKey),
        sortKey,
        raw: r,
      };
    });

  const fetchReservations = useCallback(
    async ({ from = '', to = '', filtered = false } = {}) => {
      if (!restId) return;
      setLoading(true);
      try {
        // Empty start/end for server "upcoming" buckets
        const startParam = filtered ? from : '';
        const endParam = filtered ? to : '';
        const res = await getReservationList({
          rest_id: restId,
          start_date: startParam,
          end_date: endParam,
          status: '',
        });

        let grouped = { UNCONFIRMED: [], CONFIRMED: [], REJECTED: [] };

        if (res?.status === 'Success' && res?.reservation?.list) {
          // New structured buckets
          const { accepted, pending, rejected } = res.reservation.list;

          const mergeAll = (bucket, defaultStatus) => [
            ...normalizeBucket(bucket?.today, defaultStatus),
            ...normalizeBucket(bucket?.tomorrow, defaultStatus),
            ...normalizeBucket(bucket?.upcoming, defaultStatus),
          ];

          grouped.CONFIRMED = mergeAll(accepted, '1');
          grouped.UNCONFIRMED = mergeAll(pending, '3');
          grouped.REJECTED = mergeAll(rejected, '-1');
        } else {
          // Legacy flat list
          const raw = Array.isArray(res?.reservation_list) ? res.reservation_list : [];
          raw.forEach((r) => {
            const fullName = [r.title, r.first_name, r.last_name].filter(Boolean).join(' ').trim();
            const sortKey = parseResvDate(r.reservation_date, r.reservation_time).getTime();
            const norm = {
              id: r.id,
              name: fullName || '—',
              phone: r.mobile || r.telephone || '—',
              email: (r.email || '').trim(),
              guests: Number(r.no_of_guest || 0),
              date: r.reservation_date,
              time: r.reservation_time,
              platform: r.platform,
              status: String(r.status ?? ''),
              sortKey,
              raw: r,
            };
            const tab = STATUS_TO_TAB(norm.status);
            grouped[tab].push(norm);
          });
        }

        // Sort by soonest
        Object.keys(grouped).forEach((k) => grouped[k].sort((a, b) => a.sortKey - b.sortKey));
        setListsByTab(grouped);

        if (filtered) {
          setStartDate(from);
          setEndDate(to);
          setIsFiltered(true);
        } else {
          setIsFiltered(false);
          const t = formatDateDMY(new Date());
          setStartDate(t);
          setEndDate(t);
        }
      } catch (e) {
        console.error('Error fetching reservations:', e);
        setListsByTab({ UNCONFIRMED: [], CONFIRMED: [], REJECTED: [] });
      } finally {
        setLoading(false);
      }
    },
    [restId]
  );

  // -------- Filters --------
  const handleFilter = () => setFilterSheetVisible(true);

  const handleReload = useCallback(() => {
    if (isFiltered) {
      fetchReservations({ from: startDate, to: endDate, filtered: true });
    } else {
      fetchReservations();
    }
  }, [fetchReservations, isFiltered, startDate, endDate]);

  const applyRange = (fromDateObj, toDateObj) => {
    const fromStr = toDDMMYYYY(fromDateObj);
    const toStr = toDDMMYYYY(toDateObj);
    fetchReservations({ from: fromStr, to: toStr, filtered: true });
  };

  const handleFilterOption = (option) => {
    const today = new Date();

    switch (option) {
      case 'Today': {
        applyRange(today, today);
        break;
      }
      case 'Tomorrow': {
        const tmr = new Date(today);
        tmr.setDate(tmr.getDate() + 1);
        applyRange(tmr, tmr);
        break;
      }
      case 'Next week': {
        const end = new Date(today);
        end.setDate(end.getDate() + 6);
        applyRange(today, end);
        break;
      }
      case 'This Month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        applyRange(start, end);
        break;
      }
      case 'Next Month': {
        const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        applyRange(start, end);
        break;
      }
      case 'Next 3 month': {
        const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 3, 0);
        applyRange(start, end);
        break;
      }
      case 'Next 6 month': {
        const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 6, 0);
        applyRange(start, end);
        break;
      }
      case 'Next year': {
        const start = new Date(today.getFullYear() + 1, 0, 1);
        const end = new Date(today.getFullYear() + 1, 12, 0);
        applyRange(start, end);
        break;
      }
      case 'Custom Range': {
        setCustomRangeVisible(true);
        break;
      }
      default:
        break;
    }
    setFilterSheetVisible(false);
  };

  // -------- Effects --------
  // initial + re-run when restaurant changes
  useEffect(() => {
    if (restId) {
      fetchReservations();
    }
  }, [restId, fetchReservations]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Reservations"
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

  // -------- Render --------
  const activeList = listsByTab[activeTab] || [];

  return (
    <SafeAreaView className="flex-1 bg-backgroundLight">
      {/* Tabs */}
      <View className="mt-4 flex-row items-center justify-center gap-4 px-4">
        {[
          { label: 'UNCONFIRMED', count: counts.UNCONFIRMED },
          { label: 'CONFIRMED', count: counts.CONFIRMED },
          { label: 'REJECTED', count: counts.REJECTED },
        ].map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <TouchableOpacity
              key={tab.label}
              onPress={() => setActiveTab(tab.label)}
              className={`rounded-full px-3 py-1.5 ${isActive ? 'bg-primary' : 'bg-gray-200'}`}>
              <Text
                className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Range label */}
      <View className="mb-2 mt-3">
        <Text className="text-center text-sm font-medium text-gray-600">{dateLabel}</Text>
      </View>

      {/* Loading */}
      {loading && (
        <View className="mt-6 items-center">
          <ActivityIndicator />
          <Text className="mt-2 text-xs text-gray-500">Loading reservations...</Text>
        </View>
      )}

      {/* List */}
      {!loading && (
        <ScrollView className="flex-1 px-4 py-3">
          {activeList.length === 0 ? (
            <View className="mt-10 items-center">
              <Ionicons name="calendar-outline" size={28} color="#9ca3af" />
              <Text className="mt-2 text-xs text-gray-500">No reservations found</Text>
            </View>
          ) : (
            activeList.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() =>
                  navigation.navigate('ReservationDetailScreen', {
                    reservation: r.raw,
                    status: activeTab,
                  })
                }
                className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <View className="mb-1 flex-row justify-between">
                  <Text className="text-sm font-medium text-text" numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text className="text-xs text-gray-500">{r.guests} Guests</Text>
                </View>

                {!!r.phone && (
                  <View className="mb-1 flex-row items-center gap-2">
                    <Ionicons name="call" size={14} color="#999" />
                    <Text className="text-xs text-gray-600">{r.phone}</Text>
                  </View>
                )}

                {!!r.email && (
                  <View className="mb-1 flex-row items-center gap-2">
                    <Ionicons name="mail-outline" size={14} color="#999" />
                    <Text className="text-xs text-gray-600">{r.email}</Text>
                  </View>
                )}

                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={14} color="#999" />
                  <Text className="flex-1 text-xs text-gray-600">{r.date}</Text>
                  <Text className="text-xs text-gray-700">{r.time}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* ---------- Filter Bottom Sheet ---------- */}
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
              'Tomorrow',
              'Next week',
              'This Month',
              'Next Month',
              'Next 3 month',
              'Next 6 month',
              'Next year',
              'Custom Range',
            ].map((option, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleFilterOption(option)}
                className="mb-3 rounded-md bg-gray-100 px-4 py-3">
                <Text className="text-center text-sm font-medium text-gray-700">{option}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setFilterSheetVisible(false)}
              className="mt-2 rounded bg-red-500 px-4 py-2">
              <Text className="text-center font-bold text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ---------- Custom Range Modal ---------- */}
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
                <Text className="ml-2 text-sm text-gray-600">{toDDMMYYYY(dateFromObj)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDateType('to');
                  setDatePickerVisibility(true);
                }}
                className="ml-2 flex-1 flex-row items-center border-b border-gray-300 pb-2">
                <Ionicons name="calendar" size={20} color="black" />
                <Text className="ml-2 text-sm text-gray-600">{toDDMMYYYY(dateToObj)}</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setCustomRangeVisible(false)}
                className="mr-2 flex-1 rounded bg-red-500 py-2">
                <Text className="text-center font-bold text-white">CLOSE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!dateFromObj || !dateToObj || dateToObj < dateFromObj}
                onPress={() => {
                  applyRange(dateFromObj, dateToObj);
                  setCustomRangeVisible(false);
                }}
                className={`ml-2 flex-1 rounded py-2 ${
                  dateFromObj && dateToObj && dateToObj >= dateFromObj
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}>
                <Text className="text-center font-bold text-white">SUBMIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------- Date Picker ---------- */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(picked) => {
          setDatePickerVisibility(false);
          if (dateType === 'from') {
            setDateFromObj(picked);
            if (dateToObj < picked) setDateToObj(picked);
          } else if (dateType === 'to') {
            setDateToObj(picked);
          }
        }}
        onCancel={() => setDatePickerVisibility(false)}
        minimumDate={dateType === 'to' ? dateFromObj : undefined}
      />
    </SafeAreaView>
  );
}
