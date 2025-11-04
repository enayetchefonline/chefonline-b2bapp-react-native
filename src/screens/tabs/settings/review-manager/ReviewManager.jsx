// app/screens/ReviewManager.jsx
import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppHeader from './../../../../components/AppHeader';
import { getReviews, updateReviewStatus, postReviewReply } from './../../../../utils/apiService';
import { useSelector } from 'react-redux';

const Stars = ({ rating = 0 }) => {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <FontAwesome
          key={i}
          name="star"
          size={18}
          color={i <= r ? '#f43f5e' : '#ccc'}
          style={{ marginRight: 4 }}
        />
      ))}
    </View>
  );
};

const RatingRow = ({ title, rating }) => (
  <View className="mb-3">
    <Text className="mb-1 text-xs font-semibold text-gray-600">{title.toUpperCase()}</Text>
    <Stars rating={rating} />
  </View>
);

export default function ReviewManager() {
  const navigation = useNavigation();

  // Prefer active restaurant → fallback to original login restaurant
  const activeRestId = useSelector((s) => s.user?.activeRestaurant?.restaurant_id);
  const fallbackRestId = useSelector((s) => s.user?.userInfo?.rest_id);
  const restId = activeRestId || fallbackRestId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState([]);

  // reply/publish state
  const [replyModal, setReplyModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeReview, setActiveReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false); // disables buttons during API

  const fetchReviews = useCallback(async () => {
    if (!restId) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log('[ReviewManager] getReviews params:', { rest_id: restId });
      const res = await getReviews({ rest_id: restId });
      if (res?.status === 'Success') {
        setList(Array.isArray(res.data) ? res.data : []);
      } else {
        setList([]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [restId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  }, [fetchReviews]);

  // Reply flow
  const openReply = (item) => {
    setActiveReview(item);
    setReplyText('');
    setReplyModal(true);
  };

  const submitReply = async () => {
    if (!activeReview?.id || !replyText.trim()) return;
    try {
      setActionLoading(true);
      const payload = {
        review_id: activeReview.id,
        reply_msg: replyText.trim(),
        reply_by: 1,
      };
      console.log('[ReviewManager] postReviewReply params:', payload);
      const res = await postReviewReply(payload);
      Alert.alert(res?.status || 'Info', res?.msg || 'Reply submitted');
      setReplyModal(false);
      setReplyText('');
      setActiveReview(null);
      await fetchReviews();
    } catch {
      Alert.alert('Error', 'Failed to submit reply');
    } finally {
      setActionLoading(false);
    }
  };

  // Publish/Unpublish flow
  const openToggle = (item) => {
    setActiveReview(item);
    setConfirmModal(true);
  };

  const confirmToggle = async () => {
    if (!activeReview?.id) return;
    const nextStatus = String(activeReview.status) === '1' ? '0' : '1';
    try {
      setActionLoading(true);
      const payload = { review_id: activeReview.id, status: nextStatus };
      console.log('[ReviewManager] updateReviewStatus params:', payload);
      const res = await updateReviewStatus(payload);
      Alert.alert(res?.status || 'Info', res?.msg || 'Updated');
      setConfirmModal(false);
      setActiveReview(null);
      await fetchReviews();
    } catch {
      Alert.alert('Error', 'Failed to update review status');
    } finally {
      setActionLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View className="mb-4 rounded border border-gray-200 bg-white p-4 shadow">
      {/* Header: Name + Email */}
      <View className="mb-3">
        {!!item.name && (
          <Text className="text-sm text-gray-800">
            <Text className="font-semibold">👤 </Text>
            {item.name}
          </Text>
        )}
        {!!item.email && (
          <Text className="text-sm text-gray-600">
            <Text className="font-semibold">✉️ </Text>
            {item.email}
          </Text>
        )}
      </View>

      {/* Ratings */}
      <RatingRow title="Quality of Food" rating={item.quality_of_food} />
      <RatingRow title="Quality of Service" rating={item.quality_of_service} />
      <RatingRow title="Value of Money" rating={item.value_of_money} />

      {/* Comment */}
      {!!item.review_comment && (
        <View className="mt-2">
          <Text className="text-sm text-gray-700">
            <Text className="font-semibold">CUSTOMER COMMENT: </Text>“{item.review_comment}”
          </Text>
        </View>
      )}

      {/* Replies */}
      {Array.isArray(item.reply) && item.reply.length > 0 && (
        <View className="mt-3">
          {item.reply.map((r) => (
            <Text key={String(r.id)} className="mb-1 text-sm text-gray-700">
              {String(r.reply_by) === '1' ? '↩ You: ' : '👤 Customer: '} {r.reply_msg}
            </Text>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="mt-4 flex-row gap-2">
        <TouchableOpacity
          disabled={actionLoading}
          onPress={() => openToggle(item)}
          className={`flex-1 items-center justify-center rounded py-2 ${
            actionLoading ? 'bg-gray-300' : 'bg-red-500'
          }`}>
          <Text className="font-semibold text-white">
            {String(item.status) === '1' ? 'UNPUBLISH' : 'PUBLISH'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={actionLoading}
          onPress={() => openReply(item)}
          className={`flex-1 items-center justify-center rounded py-2 ${
            actionLoading ? 'bg-gray-300' : 'bg-red-500'
          }`}>
          <Text className="font-semibold text-white">REPLY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Review Manager"
          showBack
          showFilter={false}
          showReload
          onReloadPress={fetchReviews}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation, fetchReviews]);

  if (!restId) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 p-4">
        <Text className="text-gray-500">No restaurant selected. Please pick one first.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 p-4">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(it, i) => String(it?.id ?? i)}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="mt-16 items-center">
              <Text className="text-gray-500">No reviews found.</Text>
            </View>
          }
        />
      )}

      {/* Reply Modal */}
      <Modal transparent visible={replyModal} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="w-full rounded-xl bg-white p-5">
            <Text className="mb-3 text-center text-base font-bold text-gray-800">REPLY HERE</Text>
            <TextInput
              className="h-28 rounded border border-gray-300 p-3 text-black"
              placeholder="Enter your reply here..."
              placeholderTextColor="#999"
              multiline
              value={replyText}
              onChangeText={setReplyText}
              style={{ textAlignVertical: 'top' }}
            />
            <View className="mt-4 flex-row gap-2">
              <TouchableOpacity
                disabled={actionLoading}
                className="flex-1 items-center justify-center rounded bg-gray-300 py-2"
                onPress={() => {
                  setReplyModal(false);
                  setReplyText('');
                  setActiveReview(null);
                }}>
                <Text className="font-semibold text-white">CLOSE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!replyText.trim() || actionLoading}
                onPress={submitReply}
                className={`flex-1 items-center justify-center rounded py-2 ${
                  replyText.trim() && !actionLoading ? 'bg-red-500' : 'bg-gray-300'
                }`}>
                <Text className="font-semibold text-white">
                  {actionLoading ? 'SAVING…' : 'SUBMIT'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Publish/Unpublish Confirm */}
      <Modal transparent visible={confirmModal} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="w-full rounded-xl bg-white p-6">
            <Text className="mb-4 text-center text-base font-bold text-gray-800">
              {String(activeReview?.status) === '1' ? 'Unpublish Review?' : 'Publish Review?'}
            </Text>
            <Text className="mb-6 text-center text-sm text-gray-600">
              {String(activeReview?.status) === '1'
                ? 'Are you sure you want to unpublish this review?'
                : 'Do you want to publish this review?'}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                disabled={actionLoading}
                className="flex-1 items-center justify-center rounded bg-gray-300 py-2"
                onPress={() => {
                  setConfirmModal(false);
                  setActiveReview(null);
                }}>
                <Text className="font-semibold text-white">CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={actionLoading}
                className={`flex-1 items-center justify-center rounded py-2 ${
                  actionLoading ? 'bg-gray-300' : 'bg-red-500'
                }`}
                onPress={confirmToggle}>
                <Text className="font-semibold text-white">
                  {actionLoading ? 'UPDATING…' : 'YES'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
