// src/screens/tabs/settings/ticket-manager/TicketDetail.jsx

import { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import AppHeader from './../../../../components/AppHeader';

export default function TicketDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { ticket } = route.params;

  // Safely normalize attachments to an array of filenames
  const files = useMemo(() => {
    if (!ticket?.file) return [];
    try {
      // If it's already an array, return as-is; if it's a JSON string, parse it.
      const parsed = Array.isArray(ticket.file) ? ticket.file : JSON.parse(ticket.file);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      // Fallback: strip brackets/quotes if someone passed a raw JSON-like string
      return String(ticket.file)
        .replace(/^\[|\]$/g, '')
        .replace(/"/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }, [ticket?.file]);

  const BASE = 'http://smartrestaurantsolutions.com/upload_file/';

  const openFile = async (name) => {
    const url = `${BASE}${name}`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      Linking.openURL(url);
    } else {
      Alert.alert('Cannot open file', url);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title={`Ticket #${ticket?.id ?? ''}`}
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation, ticket?.id]);

  // local state for comment box (wire up to your API later)
  const [comment, setComment] = useState('');

  return (
    <View className="flex-1 bg-background p-4">
      {/* Ticket header / title */}
      <View className="mb-4 rounded border border-gray-300 bg-white p-4">
        <Text className="mb-2 text-xs text-gray-500">COMPLAIN TITLE</Text>
        <Text className="mb-2 text-base font-medium">{ticket?.title}</Text>

        {/* Attachments */}
        {files.length > 0 && (
          <View className="flex-row gap-2">
            <Text className="text-sm text-gray-600">Attachment(s):</Text>
            <View className="mt-1 flex-row flex-wrap gap-2">
              {files.map((fname, idx) => (
                <TouchableOpacity key={`${fname}_${idx}`} onPress={() => openFile(fname)}>
                  <Text className="text-xs text-red-500 underline">{fname}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Comment box & actions (hook these up to your API handlers) */}
      <View className="mb-4 rounded border border-gray-300 bg-white p-4">
        <TextInput
          placeholder="Write your comment"
          multiline
          numberOfLines={4}
          className="rounded border border-gray-300 p-2 text-black"
          placeholderTextColor="#888"
          value={comment}
          onChangeText={setComment}
          style={{ textAlignVertical: 'top' }}
        />

        <View className="mt-4 flex-row justify-between gap-2">
          <TouchableOpacity
            className="flex-1 items-center rounded bg-red-500 py-2"
            onPress={() => {
              /* call resolve API here */
            }}>
            <Text className="font-semibold text-white">RESOLVE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center rounded bg-primary py-2"
            onPress={() => {
              /* launch picker & upload */
            }}>
            <Text className="font-semibold text-white">ADD IMAGE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 items-center rounded ${comment.trim() ? 'bg-gray-700' : 'bg-gray-300'} py-2`}
            disabled={!comment.trim()}
            onPress={() => {
              /* post comment API here */
            }}>
            <Text className="font-semibold text-white">COMMENT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Placeholder comments list (replace with your fetched comments) */}
      <View className="flex-1 items-center justify-center opacity-50">
        <FontAwesome name="info-circle" size={80} color="#aaa" />
        <Text className="mt-2 text-base text-gray-400">NO COMMENT FOUND</Text>
      </View>
    </View>
  );
}
