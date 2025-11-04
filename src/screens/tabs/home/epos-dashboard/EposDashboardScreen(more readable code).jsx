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

  const renderHeaderRow = (titles, colors, align = 'center') => (
    <View className="flex flex-row items-center gap-1">
      {titles.map((title, idx) => (
        <Text
          key={idx}
          className={`${idx === 0 ? 'flex-1' : 'w-1/4'} rounded-md px-1 py-2 text-[12px] text-white text-${align}`}
          style={{ backgroundColor: colors[idx] }}>
          {title}
        </Text>
      ))}
    </View>
  );

  const renderDataRow = (title, values) => (
    <View className="flex flex-row items-center gap-1">
      <Text className="flex-1 rounded-md bg-[#DAC3D5] px-2 py-2 text-left text-[12px] text-text">
        {title}
      </Text>
      {values.map((v, idx) => (
        <Text
          key={idx}
          className={`w-1/4 rounded-md px-1 py-2 text-center text-[12px] text-text`}
          style={{ backgroundColor: v.bg }}>
          £ {v.amount}
        </Text>
      ))}
    </View>
  );

  const defaultValues = [
    { bg: '#EFC7D0', amount: '0.00' },
    { bg: '#CBCDE2', amount: '0.00' },
    { bg: '#C9E7DD', amount: '0.00' },
  ];

  return (
    <ScrollView className="flex-1 bg-backgroundLight px-4 pt-4">
      {/* Date Row */}
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text className="text-sm text-gray-600">10 Jul 2025</Text>
      </View>

      {/* Section: Order Overview */}
      <View className="mb-4 flex-col gap-1">
        {renderHeaderRow(
          ['Description', 'Cash', 'Card', 'Total'],
          ['#740053', '#DC143B', '#2E3192', '#23B574']
        )}

        {renderDataRow('Online Order', defaultValues)}
        {renderDataRow('Offline Order', defaultValues)}
        {renderDataRow('Grand Total', defaultValues)}
      </View>

      {/* Section: Refund/Discount/Net */}
      <View className="mb-4 flex-col gap-1">
        {renderDataRow('Refund', defaultValues)}
        {renderDataRow('Discount', defaultValues)}
        {renderDataRow('Net Income', defaultValues)}
      </View>

      {/* Section: Reservation */}
      <View className="flex-col gap-1">
        {renderHeaderRow(
          ['Reservation', 'Today', 'Onwards', 'Total'],
          ['#740053', '#DC143B', '#2E3192', '#23B574']
        )}
        {renderDataRow('Grand Total', defaultValues)}
      </View>

      {/* Coming soon message */}
      <View className="mt-6 rounded-lg bg-yellow-200 px-3 py-3">
        <Text className="text-center text-gray-800">This feature will appear soon!</Text>
      </View>
    </ScrollView>
  );
}
