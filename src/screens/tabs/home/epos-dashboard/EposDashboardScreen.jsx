import React, { useLayoutEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppHeader from './../../../../components/AppHeader';

export default function EposDashboardScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader title="EPoS Dashboard" showBack bgColor="bg-white" textColor="text-text" />
      ),
    });
  }, [navigation]);

  return (
    <ScrollView className="flex-1 bg-backgroundLight px-4 pt-4">
      {/* Date Row */}
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text className="text-sm text-gray-600">10 Jul 2025</Text>
      </View>

      <View className="flex-col gap-5">
        <View className="flex-col gap-1">
          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#740053] px-1 py-2 text-center text-[12px] text-white">
              Description
            </Text>
            <Text className="w-1/4 rounded-md bg-[#DC143B] px-1 py-2 text-center text-[12px] text-white">
              Cash
            </Text>
            <Text className="w-1/4 rounded-md bg-[#2E3192] px-1 py-2 text-center text-[12px] text-white">
              Card
            </Text>
            <Text className="w-1/4 rounded-md bg-[#23B574] px-1 py-2 text-center text-[12px] text-white">
              Total
            </Text>
          </View>
          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#DAC3D5] px-2 py-2 text-left text-[12px] text-text">
              Online Order
            </Text>
            <Text className="w-1/4 rounded-md bg-[#EFC7D0] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#CBCDE2] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#C9E7DD] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
          </View>
          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#DAC3D5] px-2 py-2 text-left text-[12px] text-text">
              Offline Order
            </Text>
            <Text className="w-1/4 rounded-md bg-[#EFC7D0] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#CBCDE2] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#C9E7DD] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
          </View>
          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#DAC3D5] px-2 py-2 text-left text-[12px] text-text">
              Grand Total
            </Text>
            <Text className="w-1/4 rounded-md bg-[#EFC7D0] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#CBCDE2] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#C9E7DD] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
          </View>
        </View>
        <View className="flex-col gap-1">
          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#DAC3D5] px-2 py-2 text-left text-[12px] text-text">
              Refund
            </Text>
            <Text className="w-1/4 rounded-md bg-[#EFC7D0] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#CBCDE2] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#C9E7DD] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
          </View>
          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#DAC3D5] px-2 py-2 text-left text-[12px] text-text">
              Discount
            </Text>
            <Text className="w-1/4 rounded-md bg-[#EFC7D0] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#CBCDE2] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#C9E7DD] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
          </View>
          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#DAC3D5] px-2 py-2 text-left text-[12px] text-text">
              Net Income
            </Text>
            <Text className="w-1/4 rounded-md bg-[#EFC7D0] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#CBCDE2] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#C9E7DD] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
          </View>
        </View>
        <View className="flex-col gap-1">
          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#740053] px-1 py-2 text-center text-[12px] text-white">
              Reservation
            </Text>
            <Text className="w-1/4 rounded-md bg-[#DC143B] px-1 py-2 text-center text-[12px] text-white">
              Today
            </Text>
            <Text className="w-1/4 rounded-md bg-[#2E3192] px-1 py-2 text-center text-[12px] text-white">
              Onwards
            </Text>
            <Text className="w-1/4 rounded-md bg-[#23B574] px-1 py-2 text-center text-[12px] text-white">
              Total
            </Text>
          </View>

          <View className="flex flex-row items-center gap-1">
            <Text className="flex-1 rounded-md bg-[#DAC3D5] px-2 py-2 text-left text-[12px] text-text">
              Grand Total
            </Text>
            <Text className="w-1/4 rounded-md bg-[#EFC7D0] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#CBCDE2] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
            <Text className="w-1/4 rounded-md bg-[#C9E7DD] px-1 py-2 text-center text-[12px] text-text">
              £ 0.00
            </Text>
          </View>
        </View>
      </View>

      {/* Coming soon note */}
      <View className="mt-6 rounded-lg bg-yellow-200 px-3 py-3">
        <Text className="text-center text-gray-800">This feature will appear soon!</Text>
      </View>
    </ScrollView>
  );
}
