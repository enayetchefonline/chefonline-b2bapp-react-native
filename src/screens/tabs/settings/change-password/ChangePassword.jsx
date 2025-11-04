import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AppHeader from './../../../../components/AppHeader';
import { changeBackofficePassword } from './../../../../utils/apiService';

export default function ChangePassword() {
  const navigation = useNavigation();
  const user = useSelector((s) => s.user);
  const email = user?.userInfo?.email ?? '';

  //   console.log('user', JSON.stringify(user));
  console.log('email', email);

  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Change Password"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  const lengthOk = newPassword.length >= 6 && newPassword.length <= 16;
  const matchOk = newPassword === confirm;
  const fieldsOk = current.trim() && newPassword.trim() && confirm.trim();
  const isValid = useMemo(() => fieldsOk && lengthOk && matchOk, [fieldsOk, lengthOk, matchOk]);

  const validate = useCallback(() => {
    if (!fieldsOk) return 'Please fill all fields.';
    if (!lengthOk) return 'Password must be 6 to 16 characters.';
    if (!matchOk) return 'New Password & Confirm Password do not match.';
    if (!email) return 'Missing user email.';
    return '';
  }, [fieldsOk, lengthOk, matchOk, email]);

  const handleChangePassword = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await changeBackofficePassword({
        email,
        previouspassword: current,
        newpassword: newPassword,
      });

      if (res?.status !== 'Failed') {
        Alert.alert('Success', res?.msg || 'Password changed successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        setCurrent('');
        setNewPassword('');
        setConfirm('');
      } else {
        setError(res?.msg || 'Failed to change password.');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (placeholder, value, setValue) => (
    <View className="mb-4 flex-row items-center border-b border-gray-300 px-2 pb-2">
      <FontAwesome name="lock" size={20} color="#f43f5e" style={{ marginRight: 8 }} />
      <TextInput
        className="flex-1 text-black"
        placeholder={placeholder}
        placeholderTextColor="#888"
        secureTextEntry
        value={value}
        onChangeText={(t) => {
          setValue(t);
          setError('');
        }}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="rounded border border-gray-300 bg-white p-4">
        {renderInput('Current Password', current, setCurrent)}
        {renderInput('New Password', newPassword, setNewPassword)}
        {renderInput('Confirm Password', confirm, setConfirm)}

        {!!error && (
          <Text className="mt-1 text-center text-xs font-semibold text-red-500">{error}</Text>
        )}

        <TouchableOpacity
          className={`mt-4 items-center rounded py-3 ${isValid ? 'bg-red-500' : 'bg-gray-300'}`}
          onPress={handleChangePassword}
          disabled={!isValid || submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">CHANGE PASSWORD</Text>
          )}
        </TouchableOpacity>

        {/* Optional helper tips */}
        <View className="mt-3">
          {!lengthOk && newPassword.length > 0 && (
            <Text className="text-xs text-gray-500">• Password must be 6–16 characters.</Text>
          )}
          {!matchOk && confirm.length > 0 && (
            <Text className="text-xs text-gray-500">• New and Confirm passwords must match.</Text>
          )}
        </View>
      </View>
    </View>
  );
}
