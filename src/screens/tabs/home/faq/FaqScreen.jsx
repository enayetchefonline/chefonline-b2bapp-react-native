import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from './../../../../components/AppHeader';
import { getFaqs } from './../../../../utils/apiService';

export default function FaqScreen() {
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [faqData, setFaqData] = useState([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="FAQs"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const response = await getFaqs();
      if (response.length > 0) {
        setFaqData(response);
        setActiveIndex(0);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIndex = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <View className="flex-1 bg-backgroundLight px-4 py-4">
      <ScrollView
        className=""
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}>
        {loading ? (
          <View className="mt-10 items-center justify-center">
            <ActivityIndicator size="large" color="#EF4444" />
            <Text className="mt-2 text-xs text-gray-500">Loading FAQs...</Text>
          </View>
        ) : faqData.length === 0 ? (
          <View className="mt-10 items-center justify-center">
            <Text className="text-sm text-gray-500">No FAQs available at the moment.</Text>
          </View>
        ) : (
          faqData.map((faq, index) => {
            const isOpen = index === activeIndex;
            return (
              <View key={faq.id || index} className="mb-2 rounded-xl bg-white shadow-sm">
                <TouchableOpacity
                  onPress={() => toggleIndex(index)}
                  className={`rounded-t-xl px-4 py-3 ${isOpen ? 'bg-primary' : 'bg-white'}`}>
                  <Text className={`text-sm font-medium ${isOpen ? 'text-white' : 'text-text'}`}>
                    {`${index + 1}. ${faq.title}`}
                  </Text>
                </TouchableOpacity>

                {isOpen && faq.content ? (
                  <View className="rounded-b-xl bg-white px-4 py-3">
                    <Text className="text-xs text-gray-600">{faq.content}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
