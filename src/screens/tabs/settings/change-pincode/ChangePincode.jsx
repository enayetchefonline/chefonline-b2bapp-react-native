import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AppHeader from './../../../../components/AppHeader';
import { changeDevicePincode } from './../../../../utils/apiService';

export default function ChangePincode() {
  const navigation = useNavigation();
  const user = useSelector((s) => s.user);
  const userId = user?.userInfo?.user_id;

  const [current, setCurrent] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Change Pincode"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  const sanitizePin = (t) => t.replace(/[^0-9]/g, '').slice(0, 4);

  const lengthOk =
    current.trim().length === 4 && newPin.trim().length === 4 && confirm.trim().length === 4;
  const matchOk = newPin === confirm;
  const isValid = useMemo(() => lengthOk && matchOk, [lengthOk, matchOk]);

  const validate = useCallback(() => {
    if (!userId) return 'Missing user id.';
    if (!lengthOk) return 'Pincode must be 4 digits.';
    if (!matchOk) return 'New Pincode & Confirm Pincode do not match.';
    return '';
  }, [userId, lengthOk, matchOk]);

  const handleChangePincode = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const res = await changeDevicePincode({
        user_id: userId,
        old_pincode: current,
        new_pincode: newPin,
      });

      if (res?.status !== 'Failed') {
        Alert.alert('Success', res?.msg || 'Pincode changed successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        setCurrent('');
        setNewPin('');
        setConfirm('');
      } else {
        setError(res?.msg || 'Failed to change pincode.');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPinInput = (placeholder, value, setValue) => (
    <View className="mb-4 flex-row items-center border-b border-gray-300 px-2 pb-2">
      <FontAwesome name="lock" size={20} color="#f43f5e" style={{ marginRight: 8 }} />
      <TextInput
        className="flex-1 text-black"
        placeholder={placeholder}
        placeholderTextColor="#888"
        secureTextEntry
        keyboardType="numeric"
        maxLength={4}
        value={value}
        onChangeText={(t) => {
          setValue(sanitizePin(t));
          setError('');
        }}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="rounded border border-gray-300 bg-white p-4">
        {renderPinInput('Current Pincode', current, setCurrent)}
        {renderPinInput('New Pincode', newPin, setNewPin)}
        {renderPinInput('Confirm Pincode', confirm, setConfirm)}

        {!!error && (
          <Text className="mt-1 text-center text-xs font-semibold text-red-500">{error}</Text>
        )}

        <TouchableOpacity
          onPress={handleChangePincode}
          disabled={!isValid || submitting}
          className={`mt-4 items-center rounded py-3 ${isValid ? 'bg-red-500' : 'bg-gray-300'}`}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">CHANGE PINCODE</Text>
          )}
        </TouchableOpacity>

        {/* Tiny tips */}
        <View className="mt-3">
          {!lengthOk && (current || newPin || confirm) ? (
            <Text className="text-xs text-gray-500">• Pincode must be exactly 4 digits.</Text>
          ) : null}
          {!matchOk && confirm.length === 4 ? (
            <Text className="text-xs text-gray-500">• New and Confirm pincodes must match.</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
