// app/screens/TicketManager.jsx
import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal as RNModal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import AppHeader from './../../../../components/AppHeader';
import * as ImagePicker from 'expo-image-picker';

import { getTicketList, filterTicketList, createTicket } from './../../../../utils/apiService';

const SORT_OPTIONS = ['ALL', 'PENDING', 'RESOLVED'];

export default function TicketManager() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const user = useSelector((s) => s.user);
  const user_id = user?.userInfo?.user_id;
  const pincode = user?.pin; // stored in Redux earlier

  const [tickets, setTickets] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [sortValue, setSortValue] = useState(''); // '', 'ALL', 'PENDING', 'RESOLVED'
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]); // base64 strings

  const isFiltered = sortValue === 'PENDING' || sortValue === 'RESOLVED';
  const complain_status = sortValue === 'PENDING' ? 1 : 2;

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Tickets"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  // Single fetch function used for first load and pagination
  const fetchTickets = useCallback(
    async (nextOffset = 0, append = false) => {
      if (!user_id) return;
      setLoading(true);
      try {
        const data = isFiltered
          ? await filterTicketList({ user_id, complain_status, limit: nextOffset })
          : await getTicketList({ user_id, pincode, limit: nextOffset });

        const incoming = data?.complains || [];
        setTickets((prev) => (append ? [...prev, ...incoming] : incoming));
        setHasMore(incoming.length >= 10);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [user_id, pincode, isFiltered, complain_status]
  );

  // Reset + load first page when screen focuses or sort changes
  useEffect(() => {
    setTickets([]);
    setOffset(0);
    setHasMore(true);
    fetchTickets(0, false);
  }, [isFocused, sortValue, fetchTickets]);

  const onEndReached = () => {
    if (!loading && hasMore) fetchTickets(offset + 10, true);
  };

  const openCreate = () => {
    setInput('');
    setFiles([]);
    setModalVisible(true);
  };

  const addImage = async () => {
    // Ask permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access photos is required.');
      return;
    }

    // Open picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true, // we need base64 like your API expects
      allowsMultipleSelection: false, // set true if your SDK supports it and your API can handle multiple
      quality: 0.8,
    });

    // Handle cancel
    if (result.canceled) return;

    // Get the first asset
    const asset = result.assets?.[0];
    if (!asset?.base64) return;

    // Old code expects urlencoded base64
    setFiles((prev) => [...prev, encodeURIComponent(asset.base64)]);
  };

  const submitTicket = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      await createTicket({ user_id, pincode, message: input, files });
      setModalVisible(false);
      // refresh from first page
      setTickets([]);
      setOffset(0);
      setHasMore(true);
      fetchTickets(0, false);
    } finally {
      setLoading(false);
    }
  };

  const renderTicket = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('TicketDetail', {
          ticket: item, // <-- full object
          ticket_id: item?.id ?? item?.ticket_id, // <-- also provide raw id
          pincode,
        })
      }>
      <View className="m-2 rounded border border-gray-200 bg-white p-4 shadow">
        <Text className="font-semibold">Ticket No: #{item.id}</Text>
        <Text className="font-semibold">
          Ticket Title: <Text className="font-normal">{item.title}</Text>
        </Text>
        <Text className="text-sm">Created Date: {item.created_at}</Text>
        <Text className="text-sm">Last update: {item.updated_at}</Text>
        <Text className="text-sm">
          Status:{' '}
          {item.complain_status === '1' ? (
            <Text className="font-bold text-red-500">PENDING</Text>
          ) : item.complain_status === '2' ? (
            <Text className="font-bold text-green-600">RESOLVED</Text>
          ) : (
            <Text className="font-bold text-red-500">CLOSED</Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background px-3 pb-[100px]">
      {/* Top actions */}
      <View className="mb-2 mt-3 flex-row gap-2">
        <TouchableOpacity
          className="flex-1 items-center justify-center rounded bg-primary py-2"
          onPress={openCreate}>
          <Text className="font-semibold text-white">+ CREATE TICKET</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 items-center justify-center rounded bg-primary py-2"
          onPress={() => setSortVisible(true)}>
          <Text className="font-semibold text-white">
            <MaterialIcons name="sort" size={16} /> {sortValue || 'SORT TICKET'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List / empty */}
      {tickets.length ? (
        <FlatList
          data={tickets}
          renderItem={renderTicket}
          keyExtractor={(item, idx) => `${item.id}_${idx}`}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loading ? <ActivityIndicator style={{ paddingVertical: 12 }} /> : null
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          {loading ? (
            <ActivityIndicator />
          ) : (
            <>
              <FontAwesome name="info-circle" size={80} color="#ccc" />
              <Text className="mt-2 text-center text-lg text-gray-400">NO TICKET FOUND</Text>
            </>
          )}
        </View>
      )}

      {/* Create Ticket Modal */}
      <RNModal transparent visible={modalVisible} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/30">
          <View className="w-[90%] rounded-xl bg-white p-5">
            <Text className="mb-2 text-lg font-bold">Create Ticket</Text>
            <TextInput
              style={{
                height: 130,
                borderColor: '#ccc',
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                textAlignVertical: 'top',
                color: '#000',
              }}
              multiline
              placeholder="Enter From here..."
              value={input}
              onChangeText={setInput}
            />
            {files.length > 0 && (
              <Text className="mt-2 text-xs text-gray-600">Attachments Added: {files.length}</Text>
            )}
            <View className="mt-4 flex-row justify-between">
              <TouchableOpacity
                className="rounded bg-primary px-4 py-2"
                onPress={() => setModalVisible(false)}>
                <Text className="font-semibold text-white">CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity className="rounded bg-primary px-4 py-2" onPress={addImage}>
                <Text className="font-semibold text-white">ADD IMAGE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`rounded px-4 py-2 ${input.trim() ? 'bg-primary' : 'bg-gray-300'}`}
                onPress={submitTicket}
                disabled={!input.trim()}>
                <Text className="font-semibold text-white">SUBMIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>

      {/* Sort Bottom Sheet */}
      <Modal
        isVisible={sortVisible}
        onBackdropPress={() => setSortVisible(false)}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        animationIn="slideInUp"
        animationOut="slideOutDown">
        <View className="rounded-t-2xl bg-white p-5">
          <Text className="mb-4 text-base font-semibold text-gray-500">Sort Ticket List</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              className="py-3"
              onPress={() => {
                setSortValue(option === 'ALL' ? '' : option);
                setSortVisible(false);
              }}>
              <Text className="text-base font-medium text-black">{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}
