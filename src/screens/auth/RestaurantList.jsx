// screens/auth/RestaurantList.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { selectAssignRestaurants, setActiveRestaurant } from '../../store/slices/userSlice';

export default function RestaurantListScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const assignFromRedux = useSelector(selectAssignRestaurants);

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState(assignFromRedux);

  useEffect(() => {
    (async () => {
      try {
        if (!assignFromRedux?.length) {
          const raw = await AsyncStorage.getItem('@UserDetails');
          const details = raw ? JSON.parse(raw) : null;
          const list = details?.assign_restaurants ?? [];
          setRestaurants(list);

          // If only one, auto select and go in
          if (list.length === 1) {
            const r = list[0];
            dispatch(setActiveRestaurant(r));
            await AsyncStorage.setItem('@ActiveRestaurant', JSON.stringify(r));
            navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
            return;
          }
        }
      } catch (e) {
        console.warn('RestaurantList load error:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [assignFromRedux, dispatch, navigation]);

  const handleSelect = async (item) => {
    dispatch(setActiveRestaurant(item));
    await AsyncStorage.setItem('@ActiveRestaurant', JSON.stringify(item));
    navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelect(item)}
      className="mb-2 flex-row items-center justify-between rounded-md border border-gray-200 bg-white p-3">
      <View className="flex-1 flex-row items-center gap-3">
        <Image source={{ uri: item.logo }} className="h-12 w-12 rounded-md" resizeMode="cover" />
        <View>
          <Text className="text-base font-medium text-gray-900">{item.restaurant_name}</Text>
          {!!item.postcode && <Text className="text-sm text-gray-500">{item.postcode}</Text>}
        </View>
      </View>
      <Text className="text-lg text-gray-400">{'›'}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#ed1a3b" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-backgroundLight p-4">
      {restaurants?.length ? (
        <FlatList
          data={restaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item) => String(item.restaurant_id)}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">No restaurants assigned.</Text>
        </View>
      )}
    </View>
  );
}
