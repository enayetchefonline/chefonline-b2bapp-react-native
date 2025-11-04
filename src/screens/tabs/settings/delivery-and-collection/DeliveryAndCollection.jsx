// app/screens/DeliveryAndCollection.jsx
import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AppHeader from './../../../../components/AppHeader';

import {
  getDelColTimes,
  closePolicyTime,
  editPolicyTime,
  addPolicyTime,
} from './../../../../utils/apiService';

export default function DeliveryAndCollection() {
  const navigation = useNavigation();

  // Prefer selected restaurant (multi-branch) → fallback to login payload
  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;

  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]); // API -> response.data.opening_shift

  // popups & inputs
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [minutes, setMinutes] = useState('');

  // targets
  const [selectedDay, setSelectedDay] = useState(null); // { day_no, day_name, ... }
  const [selectedItem, setSelectedItem] = useState(null); // existing record to edit/close
  const [addTarget, setAddTarget] = useState(null); // { day_no, shift_no, policy_id, label }

  // compact logger
  const log = useCallback((label, obj) => {
    try {
      console.log(`[DelCol] ${label}:`, JSON.stringify(obj ?? {}, null, 2));
    } catch {
      console.log(`[DelCol] ${label}:`, obj);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Delivery and Collection"
          showBack
          showFilter={false}
          showReload
          onReloadPress={() => fetchData()}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  // Guard: need restaurant
  useEffect(() => {
    if (!restId) {
      log('No restId – redirecting to RestaurantList', {});
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
    }
  }, [restId, navigation, log]);

  const fetchData = useCallback(async () => {
    if (!restId) return;
    try {
      setLoading(true);
      const params = { rest_id: restId };
      log('getDelColTimes params', params);
      const data = await getDelColTimes(params);
      log('getDelColTimes response', data);
      setDays(Array.isArray(data?.opening_shift) ? data.opening_shift : []);
    } catch (e) {
      log('getDelColTimes error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Failed to load Delivery/Collection times');
    } finally {
      setLoading(false);
    }
  }, [restId, log]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- UI Helpers ----------
  const findForShift = (day, shiftNo, name /*'Delivery'|'Collection'*/) => {
    const list = Array.isArray(day?.shift) ? day.shift : [];
    return list.find((s) => String(s.shift) === String(shiftNo) && (s.policy_name || '') === name);
  };

  const onPressExisting = (item, day) => {
    setSelectedDay(day);
    setSelectedItem(item);
    setMinutes(String(item?.minutes ?? ''));
    log('existing item pressed', { item, day });
    Alert.alert(
      'Select Your Action',
      `Change your ${item.policy_name} settings for Shift ${item.shift} on ${day.day_name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Close ${item.policy_name}`,
          style: 'destructive',
          onPress: () => confirmClose(item, day),
        },
        { text: `Edit ${item.policy_name} Time`, onPress: () => setShowEditPopup(true) },
      ]
    );
  };

  const onPressAdd = (day, shiftNo, policyId, label) => {
    setSelectedDay(day);
    setAddTarget({ day_no: day.day_no, shift_no: shiftNo, policy_id: policyId, label });
    setMinutes('');
    log('add target init', { day, shiftNo, policyId, label });
    setShowAddPopup(true);
  };

  const shiftRow = (day, shiftNo) => {
    const col = findForShift(day, shiftNo, 'Collection');
    const del = findForShift(day, shiftNo, 'Delivery');

    return (
      <View
        className="flex-row items-center justify-between px-5 py-4"
        key={`${day.day_no}-${shiftNo}`}>
        <Text className="w-[20%] text-sm font-medium text-gray-600">{`Shift ${shiftNo}`}</Text>

        {/* Collection pill or Add */}
        {col ? (
          <TouchableOpacity
            className="w-[38%] rounded-full bg-gray-100 px-4 py-2"
            onPress={() => onPressExisting(col, day)}>
            <Text className="text-xs font-medium text-gray-700">{`Collection: ${col.minutes} mins`}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="w-[38%] rounded-full bg-primary/10 px-4 py-2"
            onPress={() => onPressAdd(day, shiftNo, day?.policy_collection_id, 'Collection')}>
            <Text className="text-left text-xs font-semibold text-primary">
              Add Collection Time
            </Text>
          </TouchableOpacity>
        )}

        {/* Delivery pill or Add */}
        {del ? (
          <TouchableOpacity
            className="w-[38%] rounded-full bg-gray-100 px-4 py-2"
            onPress={() => onPressExisting(del, day)}>
            <Text className="text-xs font-medium text-gray-700">{`Delivery: ${del.minutes} mins`}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="w-[38%] rounded-full bg-primary/10 px-4 py-2"
            onPress={() => onPressAdd(day, shiftNo, day?.policy_delivery_id, 'Delivery')}>
            <Text className="text-left text-xs font-semibold text-primary">Add Delivery Time</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ---------- Actions ----------
  const confirmClose = (item, day) => {
    log('confirmClose modal', { item, day });
    Alert.alert(
      `Confirm ${item.policy_name} closing`,
      `Press CONFIRM to close ${item.policy_name} for Shift ${item.shift} on ${day.day_name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CONFIRM', style: 'destructive', onPress: () => doClose(item) },
      ]
    );
  };

  const doClose = async (item) => {
    try {
      setLoading(true);
      const params = { id: item.id };
      log('closePolicyTime params', params);
      const res = await closePolicyTime(params);
      log('closePolicyTime response', res);
      if (res?.status === 'Success') {
        await fetchData();
        Alert.alert('Success', res?.msg || 'Closed successfully.');
      } else {
        Alert.alert('Failed', res?.msg || 'Could not close.');
      }
    } catch (e) {
      log('closePolicyTime error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Could not close.');
    } finally {
      setShowEditPopup(false);
      setShowAddPopup(false);
      setSelectedItem(null);
      setMinutes('');
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    const min = parseInt(minutes, 10);
    if (!min || min <= 0) {
      Alert.alert('Validation', 'Time cannot be empty or 0');
      return;
    }
    try {
      setLoading(true);
      const params = { id: selectedItem.id, minutes: min };
      log('editPolicyTime params', params);
      const res = await editPolicyTime(params);
      log('editPolicyTime response', res);
      if (res?.status === 'Success') {
        await fetchData();
        Alert.alert('Success', res?.msg || 'Updated successfully.');
      } else {
        Alert.alert('Failed', res?.msg || 'Could not update.');
      }
    } catch (e) {
      log('editPolicyTime error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Could not update.');
    } finally {
      setShowEditPopup(false);
      setSelectedItem(null);
      setMinutes('');
      setLoading(false);
    }
  };

  const saveAdd = async () => {
    const min = parseInt(minutes, 10);
    if (!min || min <= 0) {
      Alert.alert('Validation', 'Time cannot be empty or 0');
      return;
    }
    if (!addTarget?.policy_id && addTarget?.policy_id !== 0) {
      Alert.alert('Permission Denied');
      return;
    }
    try {
      setLoading(true);
      const params = {
        rest_id: restId,
        day_no: addTarget.day_no,
        policy_id: addTarget.policy_id,
        minutes: min,
        shift_no: addTarget.shift_no,
      };
      log('addPolicyTime params', params);
      const res = await addPolicyTime(params);
      log('addPolicyTime response', res);
      if (res?.status === 'Success') {
        await fetchData();
        Alert.alert('Success', res?.msg || 'Saved successfully.');
      } else {
        Alert.alert('Failed', res?.msg || 'Could not save.');
      }
    } catch (e) {
      log('addPolicyTime error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Could not save.');
    } finally {
      setShowAddPopup(false);
      setAddTarget(null);
      setMinutes('');
      setLoading(false);
    }
  };

  // ---------- Render ----------
  if (loading && days.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-backgroundLight">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-backgroundLight"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        {(Array.isArray(days) ? days : []).map((day) => (
          <View
            key={day.day_no}
            className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Day Header */}
            <View className="border-b border-gray-200 bg-gray-100">
              <Text className="px-5 py-3 text-sm font-bold text-gray-700">{day.day_name}</Text>
            </View>

            {/* Shift 1 */}
            {shiftRow(day, 1)}

            {/* Divider */}
            <View className="h-[1px] bg-gray-200" />

            {/* Shift 2 */}
            {shiftRow(day, 2)}
          </View>
        ))}
      </ScrollView>

      {/* EDIT minutes popup */}
      {showEditPopup && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-xl bg-white p-5">
            <Text className="mb-3 text-base font-semibold text-text">Edit time</Text>
            <TextInput
              keyboardType="number-pad"
              inputMode="numeric"
              value={String(minutes)}
              onChangeText={(t) => setMinutes(String(t).replace(/[^\d]/g, ''))}
              placeholder="Enter minutes..."
              className="mb-4 rounded-md border border-gray-300 px-3 py-2 text-sm"
              maxLength={3}
            />
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 rounded-md bg-gray-200 py-3"
                onPress={() => {
                  setShowEditPopup(false);
                  setSelectedItem(null);
                  setMinutes('');
                }}>
                <Text className="text-center font-bold text-gray-700">CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 rounded-md bg-primary py-3" onPress={saveEdit}>
                <Text className="text-center font-bold text-white">SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ADD minutes popup */}
      {showAddPopup && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-xl bg-white p-5">
            <Text className="mb-1 text-base font-semibold text-text">Add time</Text>
            {addTarget && (
              <Text className="mb-3 text-xs text-gray-600">
                {selectedDay?.day_name} • Shift {addTarget.shift_no} • {addTarget.label}
              </Text>
            )}
            <TextInput
              keyboardType="number-pad"
              inputMode="numeric"
              value={String(minutes)}
              onChangeText={(t) => setMinutes(String(t).replace(/[^\d]/g, ''))}
              placeholder="Enter minutes..."
              className="mb-4 rounded-md border border-gray-300 px-3 py-2 text-sm"
              maxLength={3}
            />
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 rounded-md bg-gray-200 py-3"
                onPress={() => {
                  setShowAddPopup(false);
                  setAddTarget(null);
                  setMinutes('');
                }}>
                <Text className="text-center font-bold text-gray-700">CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 rounded-md bg-primary py-3" onPress={saveAdd}>
                <Text className="text-center font-bold text-white">SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
}
