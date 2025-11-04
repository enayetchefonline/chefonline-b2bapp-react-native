// src/screens/tabs/reservations/ReservationHours.jsx
import React, { useLayoutEffect, useEffect, useState, useCallback, useMemo } from 'react';
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
import { useSelector } from 'react-redux';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AppHeader from './../../../../components/AppHeader';
import moment from 'moment';
import momentTz from 'moment-timezone';

import {
  getReservationHours,
  editReservationShift,
  closeReservationShift,
  addReservationShift,
} from './../../../../utils/apiService';

export default function ReservationHours() {
  const navigation = useNavigation();

  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;

  const [showClosePopup, setShowClosePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showAddShiftPopup, setShowAddShiftPopup] = useState(false);

  const [pickerMode, setPickerMode] = useState(null);
  const [editOpenTime, setEditOpenTime] = useState('12:00 pm');
  const [editCloseTime, setEditCloseTime] = useState('11:30 pm');
  const [addOpenTime, setAddOpenTime] = useState('');
  const [addCloseTime, setAddCloseTime] = useState('');

  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [selectedDayNo, setSelectedDayNo] = useState(null);
  const [nextShiftNumber, setNextShiftNumber] = useState(1);

  const log = useCallback((label, obj) => {
    try {
      console.log(`[ReservationHours] ${label}:`, JSON.stringify(obj ?? {}, null, 2));
    } catch {
      console.log(`[ReservationHours] ${label}:`, obj);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Reservation Hours"
          showBack
          showFilter={false}
          showReload
          onReloadPress={() => fetchHours()}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  const fetchHours = useCallback(async () => {
    if (!restId) return;
    setLoading(true);
    try {
      const params = { rest_id: restId };
      log('getReservationHours params', params);
      const res = await getReservationHours(params);
      log('getReservationHours response', res);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.openingHours)
          ? res.openingHours
          : [];
      setDays(list.map((d) => ({ ...d, shift: Array.isArray(d.shift) ? d.shift : [] })));
    } catch (e) {
      log('getReservationHours error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Failed to load reservation hours.');
    } finally {
      setLoading(false);
    }
  }, [restId, log]);

  useEffect(() => {
    if (!restId) {
      log('No restId – navigate to RestaurantList', {});
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
      return;
    }
    fetchHours();
  }, [fetchHours, restId, navigation, log]);

  const formatAMPM = (date) => {
    let h = date.getHours();
    let m = date.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m} ${ampm}`;
  };

  const toUnixLondon = (tStr) => momentTz.tz(tStr, ['hh:mm a'], 'Europe/London').unix();

  const handleConfirm = (date) => {
    const formatted = formatAMPM(date);
    if (pickerMode === 'edit-open') setEditOpenTime(formatted);
    else if (pickerMode === 'edit-close') setEditCloseTime(formatted);
    else if (pickerMode === 'add-open') setAddOpenTime(formatted);
    else if (pickerMode === 'add-close') setAddCloseTime(formatted);
    setPickerMode(null);
  };

  const editValid = useMemo(() => {
    const a = moment(editOpenTime, ['hh:mm a']);
    const b = moment(editCloseTime, ['hh:mm a']);
    return a.isValid() && b.isValid() && a.isBefore(b);
  }, [editOpenTime, editCloseTime]);

  const addValid = useMemo(() => {
    const a = moment(addOpenTime, ['hh:mm a']);
    const b = moment(addCloseTime, ['hh:mm a']);
    return a.isValid() && b.isValid() && a.isBefore(b);
  }, [addOpenTime, addCloseTime]);

  const hasAnyShift = useMemo(
    () => (Array.isArray(days) ? days.some((d) => (d.shift || []).length > 0) : false),
    [days]
  );

  const openCloseForShift = (shiftId) => {
    setSelectedShiftId(shiftId);
    setShowClosePopup(true);
  };

  const openEditForShift = (shift) => {
    setSelectedShiftId(shift.id);
    setEditOpenTime(shift.opening_time);
    setEditCloseTime(shift.closing_time);
    setShowEditPopup(true);
  };

  const openAddForDay = (dayNo, shiftNumber) => {
    setSelectedDayNo(dayNo);
    setNextShiftNumber(shiftNumber);
    setAddOpenTime('');
    setAddCloseTime('');
    setShowAddShiftPopup(true);
  };

  const confirmCloseShift = async () => {
    if (!selectedShiftId) return;
    try {
      setLoading(true);
      const params = { id: selectedShiftId };
      log('closeReservationShift params', params);
      const res = await closeReservationShift(params);
      log('closeReservationShift response', res);
      if (res?.status === 'Success') {
        await fetchHours();
      } else {
        Alert.alert('Failed', res?.msg || 'Could not close shift.');
      }
    } catch (e) {
      log('closeReservationShift error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Unable to close shift.');
    } finally {
      setShowClosePopup(false);
      setSelectedShiftId(null);
      setLoading(false);
    }
  };

  const saveEditShift = async () => {
    if (!selectedShiftId || !editValid) {
      Alert.alert('Invalid time', 'Opening time must be before closing time.');
      return;
    }
    try {
      setLoading(true);
      const opening_unix = toUnixLondon(editOpenTime);
      const closing_unix = toUnixLondon(editCloseTime);
      const params = { id: selectedShiftId, opening_unix, closing_unix };
      log('editReservationShift params', params);
      const res = await editReservationShift(params);
      log('editReservationShift response', res);
      if (res?.status === 'Success') {
        await fetchHours();
        setShowEditPopup(false);
        setSelectedShiftId(null);
      } else {
        Alert.alert('Failed', res?.msg || 'Could not update shift.');
      }
    } catch (e) {
      log('editReservationShift error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Unable to update shift.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAddShift = async () => {
    if (!selectedDayNo || !addValid) {
      Alert.alert('Invalid time', 'Opening time must be before closing time.');
      return;
    }
    try {
      setLoading(true);
      const opening_unix = toUnixLondon(addOpenTime);
      const closing_unix = toUnixLondon(addCloseTime);
      const params = {
        rest_id: restId,
        weekday: selectedDayNo,
        opening_unix,
        closing_unix,
        shift: nextShiftNumber,
      };
      log('addReservationShift params', params);
      const res = await addReservationShift(params);
      log('addReservationShift response', res);
      if (res?.status === 'Success') {
        await fetchHours();
        setShowAddShiftPopup(false);
        setSelectedDayNo(null);
      } else {
        Alert.alert('Failed', res?.msg || 'Could not add shift.');
      }
    } catch (e) {
      log('addReservationShift error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Unable to add shift.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView className="flex-1 bg-backgroundLight p-4">
        {loading ? (
          <View className="mt-6 items-center">
            <ActivityIndicator size="large" color="#ed1a3b" />
          </View>
        ) : (
          <>
            {/* 🔔 Global empty-state banner when absolutely no shifts exist */}
            {!hasAnyShift && (
              <View className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
                <Text className="text-xs text-yellow-800">
                  No reservation hours found. Tap <Text className="font-semibold">ADD SHIFT</Text>{' '}
                  on any day to create your first slot.
                </Text>
              </View>
            )}

            {(Array.isArray(days) ? days : []).map((day, index) => {
              const shiftList = Array.isArray(day.shift) ? day.shift : [];
              const isEmpty = shiftList.length === 0;

              return (
                <View
                  key={day.day_no ?? index}
                  className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <Text className="px-4 py-3 text-base font-semibold text-text">
                    {day.day_name}
                  </Text>
                  <View className="h-[1px] bg-gray-200" />

                  <View className="gap-2 space-y-2 py-2">
                    {isEmpty ? (
                      <View className="px-4 py-2">
                        <Text className="text-xs text-gray-500">No shifts for this day.</Text>
                      </View>
                    ) : (
                      shiftList.map((shift, i) => (
                        <View
                          key={shift.id ?? `${day.day_no}-${i}`}
                          className="mx-4 flex-row items-center gap-5 rounded-lg px-4">
                          <Text className="text-xs font-semibold text-gray-700">Shift {i + 1}</Text>
                          <View className="flex-1 flex-row justify-end gap-2">
                            <Text className="rounded-md bg-gray-200 px-3 py-1.5 text-xs text-gray-700">
                              Opening: {shift.opening_time}
                            </Text>
                            <Text className="rounded-md bg-gray-200 px-3 py-1.5 text-xs text-gray-700">
                              Closing: {shift.closing_time}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  <View className="h-[1px] bg-gray-200" />

                  {/* Actions: if empty → only ADD; otherwise → CLOSE / EDIT / ADD */}
                  {isEmpty ? (
                    <View className="mb-4 mt-3 px-4">
                      <TouchableOpacity
                        className="w-full rounded-md bg-primary py-3"
                        onPress={() => openAddForDay(day.day_no, 1)}>
                        <Text className="text-center text-xs font-semibold text-white">
                          ADD SHIFT
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="mb-4 mt-3 flex-row justify-around gap-2 px-4">
                      <TouchableOpacity
                        className="flex-1 rounded-md bg-primary py-3"
                        onPress={() => {
                          const lastShift = shiftList[shiftList.length - 1];
                          if (lastShift) openCloseForShift(lastShift.id);
                        }}>
                        <Text className="text-center text-xs font-semibold text-white">CLOSE</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 rounded-md bg-primary py-3"
                        onPress={() => {
                          const lastShift = shiftList[shiftList.length - 1];
                          if (lastShift) openEditForShift(lastShift);
                        }}>
                        <Text className="text-center text-xs font-semibold text-white">EDIT</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 rounded-md bg-primary py-3"
                        onPress={() => openAddForDay(day.day_no, shiftList.length + 1)}>
                        <Text className="text-center text-xs font-semibold text-white">
                          ADD SHIFT
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Close Confirmation */}
      {showClosePopup && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-xl bg-white p-5">
            <Text className="mb-3 text-base font-semibold text-text">Confirm shift closing</Text>
            <Text className="mb-5 text-sm text-gray-700">
              Press <Text className="font-bold">CONFIRM</Text> to close this shift.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 rounded-md bg-primary py-3"
                onPress={confirmCloseShift}>
                <Text className="text-center font-bold text-white">CONFIRM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-md bg-gray-200 py-3"
                onPress={() => {
                  setShowClosePopup(false);
                  setSelectedShiftId(null);
                }}>
                <Text className="text-center font-bold text-gray-700">CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Edit Popup */}
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
                <Text className="text-center text-sm text-gray-800">{editOpenTime}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-md border border-gray-300 py-3"
                onPress={() => setPickerMode('edit-close')}>
                <Text className="text-center text-sm text-gray-800">{editCloseTime}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 rounded-md bg-gray-200 py-3"
                onPress={() => {
                  setShowEditPopup(false);
                  setSelectedShiftId(null);
                }}>
                <Text className="text-center font-bold text-gray-700">CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-md py-3 ${editValid ? 'bg-primary' : 'bg-gray-300'}`}
                disabled={!editValid}
                onPress={saveEditShift}>
                <Text className="text-center font-bold text-white">SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Add Shift Popup */}
      {showAddShiftPopup && (
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
                <Text className="text-center text-sm text-gray-800">
                  {addOpenTime || 'Opening'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-md border border-gray-300 py-3"
                onPress={() => setPickerMode('add-close')}>
                <Text className="text-center text-sm text-gray-800">
                  {addCloseTime || 'Closing'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                className={`flex-1 rounded-md py-3 ${addValid ? 'bg-primary' : 'bg-gray-300'}`}
                disabled={!addValid}
                onPress={confirmAddShift}>
                <Text className="text-center font-bold text-white">CONFIRM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-md bg-gray-200 py-3"
                onPress={() => {
                  setShowAddShiftPopup(false);
                  setSelectedDayNo(null);
                }}>
                <Text className="text-center font-bold text-gray-700">CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <DateTimePickerModal
        isVisible={!!pickerMode}
        mode="time"
        is24Hour={false}
        onConfirm={handleConfirm}
        onCancel={() => setPickerMode(null)}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        minuteInterval={15}
      />
    </>
  );
}
