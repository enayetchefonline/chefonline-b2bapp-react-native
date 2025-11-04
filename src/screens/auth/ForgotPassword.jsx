import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    Alert.alert('Reset Link Sent', `Instructions sent to ${email}`);
  };

  return (
    <View className="bg-background flex-1 justify-center px-8">
      <Text className="text-text mb-2 text-sm">Email Address</Text>

      <TextInput
        placeholder="Enter your email"
        placeholderTextColor="#888888"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        className="border-border text-text mb-5 rounded border px-3 py-2 text-base"
      />

      <TouchableOpacity className="bg-primary items-center rounded py-3" onPress={handleReset}>
        <Text className="text-base font-bold text-white">SEND RESET LINK</Text>
      </TouchableOpacity>
    </View>
  );
}
