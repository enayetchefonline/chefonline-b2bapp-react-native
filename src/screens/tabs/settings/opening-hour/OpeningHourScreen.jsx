// app/screens/OpeningHourScreen.jsx
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import momentTz from 'moment-timezone';
import { useSelector } from 'react-redux';
import AppHeader from './../../../../components/AppHeader';

import {
  getOpeningHours as apiGetOpeningHours,
  closeShift as apiCloseShift,
  editShift as apiEditShift,
  addNewShift as apiAddNewShift,
} from './../../../../utils/apiService';

export default function OpeningHourScreen() {
  const navigation = useNavigation();

  // Prefer selected restaurant (multi-branch), fallback to login payload
  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;

  console.log('restId', restId);

  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);

  const [showClosePopup, setShowClosePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);

  const [activeDayNo, setActiveDayNo] = useState(null);
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [nextShiftNo, setNextShiftNo] = useState(null);

  const [pickerMode, setPickerMode] = useState(null); // 'edit-open' | 'edit-close' | 'add-open' | 'add-close'
  const [editOpen, setEditOpen] = useState('12:00 pm');
  const [editClose, setEditClose] = useState('11:30 pm');
  const [addOpen, setAddOpen] = useState('');
  const [addClose, setAddClose] = useState('');

  // compact logger
  const log = useCallback((label, obj) => {
    try {
      console.log(`[OpeningHour] ${label}:`, JSON.stringify(obj ?? {}, null, 2));
    } catch {
      console.log(`[OpeningHour] ${label}:`, obj);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Opening Hours"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  // Guard: need a restaurant selected
  useEffect(() => {
    if (!restId) {
      log('No restId – redirecting to RestaurantList', {});
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
    }
  }, [restId, navigation, log]);

  const toUnixLondon = (t) => momentTz.tz(t, ['hh:mm a'], 'Europe/London').unix();
  const isOpenBeforeClose = (o, c) => moment(o, ['hh:mm a']).isBefore(moment(c, ['hh:mm a']));
  const fmt = (d) => {
    let h = d.getHours(),
      m = d.getMinutes();
    const am = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    if (m < 10) m = '0' + m;
    return `${h}:${m} ${am}`;
  };

  const fetchData = useCallback(async () => {
    if (!restId) return;
    try {
      setLoading(true);
      const params = { rest_id: restId };
      log('getOpeningHours params', params);
      const data = await apiGetOpeningHours(params);
      log('getOpeningHours response', data);
      setDays(Array.isArray(data) ? data : data?.openingHours || []);
    } catch (e) {
      log('getOpeningHours error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Failed to load opening hours.');
    } finally {
      setLoading(false);
    }
  }, [restId, log]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // per-shift actions
  const askClose = (dayNo, shiftId) => {
    setActiveDayNo(dayNo);
    setActiveShiftId(shiftId);
    setShowClosePopup(true);
  };

  const doClose = async () => {
    if (!activeShiftId) return;
    try {
      setLoading(true);
      const params = { id: activeShiftId };
      log('closeShift params', params);
      const res = await apiCloseShift(params);
      log('closeShift response', res);
      if (res?.status === 'Success') {
        await fetchData();
        Alert.alert('Success', res?.msg || 'Shift closed.');
      } else {
        Alert.alert('Failed', res?.msg || 'Could not close the shift.');
      }
    } catch (e) {
      log('closeShift error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Could not close the shift.');
    } finally {
      setShowClosePopup(false);
      setLoading(false);
    }
  };

  const askEdit = (dayNo, shift) => {
    setActiveDayNo(dayNo);
    setActiveShiftId(shift.id);
    setEditOpen(shift.opening_time);
    setEditClose(shift.closing_time);
    setShowEditPopup(true);
  };

  const doEdit = async () => {
    if (!activeShiftId) return;
    if (!isOpenBeforeClose(editOpen, editClose)) {
      Alert.alert('Validation', 'Opening time cannot be greater than closing time.');
      return;
    }
    try {
      setLoading(true);
      const params = {
        id: activeShiftId,
        opening_unix: toUnixLondon(editOpen),
        closing_unix: toUnixLondon(editClose),
      };
      log('editShift params', params);
      const res = await apiEditShift(params);
      log('editShift response', res);
      if (res?.status === 'Success') {
        await fetchData();
        setShowEditPopup(false);
        Alert.alert('Success', res?.msg || 'Shift updated.');
      } else {
        Alert.alert('Failed', res?.msg || 'Could not update the shift.');
      }
    } catch (e) {
      log('editShift error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Could not update the shift.');
    } finally {
      setLoading(false);
    }
  };

  const askAdd = (dayNo, currentCount) => {
    setActiveDayNo(dayNo);
    setNextShiftNo(currentCount + 1);
    setAddOpen('');
    setAddClose('');
    setShowAddPopup(true);
  };

  const doAdd = async () => {
    if (!activeDayNo || !nextShiftNo) return;
    if (!addOpen || !addClose) {
      Alert.alert('Validation', 'Please select both opening and closing times.');
      return;
    }
    if (!isOpenBeforeClose(addOpen, addClose)) {
      Alert.alert('Validation', 'Opening time cannot be greater than closing time.');
      return;
    }
    try {
      setLoading(true);
      const params = {
        rest_id: restId,
        weekday: activeDayNo,
        opening_unix: toUnixLondon(addOpen),
        closing_unix: toUnixLondon(addClose),
        shift: nextShiftNo,
        type: 3,
      };
      log('addNewShift params', params);
      const res = await apiAddNewShift(params);
      log('addNewShift response', res);
      if (res?.status === 'Success') {
        await fetchData();
        setShowAddPopup(false);
        Alert.alert('Success', res?.msg || 'Shift added.');
      } else {
        Alert.alert('Failed', res?.msg || 'Could not add the shift.');
      }
    } catch (e) {
      log('addNewShift error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Could not add the shift.');
    } finally {
      setLoading(false);
    }
  };

  const onPick = (date) => {
    const t = fmt(date);
    if (pickerMode === 'edit-open') setEditOpen(t);
    if (pickerMode === 'edit-close') setEditClose(t);
    if (pickerMode === 'add-open') setAddOpen(t);
    if (pickerMode === 'add-close') setAddClose(t);
    setPickerMode(null);
  };

  if (loading && days.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-backgroundLight">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-backgroundLight p-4">
        {(Array.isArray(days) ? days : []).map((day) => {
          const shifts = Array.isArray(day.shift) ? day.shift : [];
          return (
            <View
              key={day.day_no}
              className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm">
              <Text className="px-4 py-3 text-base font-semibold text-text">{day.day_name}</Text>
              <View className="h-[1px] bg-gray-200" />

              {/* Shifts */}
              <View className="gap-2 py-2">
                {shifts.length > 0 ? (
                  shifts.map((s, i) => (
                    <View key={s.id ?? `${day.day_no}-${i}`} className="mx-4 rounded-lg px-4 py-2">
                      {/* top row: times */}
                      <View className="mb-2 flex-row items-center gap-2">
                        <Text className="flex-1 text-xs font-semibold text-gray-700">
                          Shift {i + 1}
                        </Text>
                        <Text className="rounded-md bg-gray-200 px-3 py-1.5 text-xs text-gray-700">
                          Opening: {s.opening_time || '—'}
                        </Text>
                        <Text className="rounded-md bg-gray-200 px-3 py-1.5 text-xs text-gray-700">
                          Closing: {s.closing_time || '—'}
                        </Text>
                      </View>

                      {/* bottom row: actions */}
                      <View className="mt-2 flex-row gap-3">
                        <TouchableOpacity
                          className="flex-1 rounded-md bg-primary py-3"
                          onPress={() => askClose(day.day_no, s.id)}>
                          <Text className="text-center text-xs font-semibold text-white">
                            CLOSE
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="flex-1 rounded-md bg-primary py-3"
                          onPress={() => askEdit(day.day_no, s)}>
                          <Text className="text-center text-xs font-semibold text-white">EDIT</Text>
                        </TouchableOpacity>

                        {/* only show Add Shift when the day has exactly 1 shift, on the first shift row */}
                        {shifts.length === 1 && i === 0 && (
                          <TouchableOpacity
                            className="flex-1 rounded-md bg-primary py-3"
                            onPress={() => askAdd(day.day_no, shifts.length)}>
                            <Text className="text-center text-xs font-semibold text-white">
                              ADD SHIFT
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  // zero shifts: single Add Shift button
                  <View className="px-4 py-2">
                    <TouchableOpacity
                      className="rounded-md bg-primary py-3"
                      onPress={() => askAdd(day.day_no, 0)}>
                      <Text className="text-center text-xs font-semibold text-white">
                        ADD SHIFT
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Close */}
      {showClosePopup && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-xl bg-white p-5">
            <Text className="mb-3 text-base font-semibold text-text">Confirm shift closing</Text>
            <Text className="mb-5 text-sm text-gray-700">
              Press <Text className="font-bold">CONFIRM</Text> to close this shift.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity className="flex-1 rounded-md bg-primary py-3" onPress={doClose}>
                <Text className="text-center font-bold text-white">CONFIRM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-md bg-gray-200 py-3"
                onPress={() => setShowClosePopup(false)}>
                <Text className="text-center font-bold text-gray-700">CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Edit */}
      {showEditPopup && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-xl bg-white p-5 shadow-lg">
            <View className="mb-4 flex-row justify-between">
              <Text className="flex-1 text-center font-bold text-text">OPEN</Text>
              <Text className="flex-1 text-center font-bold text-text">CLOSE</Text>
            </View>
            <View className="mb-5 flex-row gap-4">
              <TouchableOpacity
                className="flex-1 rounded-md border border-gray-300 py-3"
                onPress={() => setPickerMode('edit-open')}>
                <Text className="text-center text-sm text-gray-800">{editOpen}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-md border border-gray-300 py-3"
                onPress={() => setPickerMode('edit-close')}>
                <Text className="text-center text-sm text-gray-800">{editClose}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 rounded-md bg-gray-200 py-3"
                onPress={() => setShowEditPopup(false)}>
                <Text className="text-center font-bold text-gray-700">CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 rounded-md bg-primary py-3" onPress={doEdit}>
                <Text className="text-center font-bold text-white">SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Add */}
      {showAddPopup && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-xl bg-white p-5 shadow-lg">
            <View className="mb-4 flex-row justify-between">
              <Text className="flex-1 text-center font-bold text-text">OPEN</Text>
              <Text className="flex-1 text-center font-bold text-text">CLOSE</Text>
            </View>
            <View className="mb-5 flex-row gap-4">
              <TouchableOpacity
                className="flex-1 rounded-md border border-gray-300 py-3"
                onPress={() => setPickerMode('add-open')}>
                <Text className="text-center text-sm text-gray-800">{addOpen || 'Opening'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-md border border-gray-300 py-3"
                onPress={() => setPickerMode('add-close')}>
                <Text className="text-center text-sm text-gray-800">{addClose || 'Closing'}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 rounded-md bg-gray-200 py-3"
                onPress={() => setShowAddPopup(false)}>
                <Text className="text-center font-bold text-gray-700">CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 rounded-md bg-primary py-3" onPress={doAdd}>
                <Text className="text-center font-bold text-white">CONFIRM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <DateTimePickerModal
        isVisible={!!pickerMode}
        mode="time"
        is24Hour={false}
        onConfirm={onPick}
        onCancel={() => setPickerMode(null)}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      />
    </>
  );
}
