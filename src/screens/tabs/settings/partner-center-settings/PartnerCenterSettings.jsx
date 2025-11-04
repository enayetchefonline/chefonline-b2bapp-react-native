// src/screens/tabs/settings/PartnerCenterSettings.jsx
import React, { useCallback, useLayoutEffect, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from './../../../../components/AppHeader';
import {
  Ionicons,
  FontAwesome,
  MaterialCommunityIcons,
  Entypo,
  FontAwesome5,
} from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { getOnlineShiftStatus, setOnlineShiftStatus } from './../../../../utils/apiService';

export default function PartnerCenterSettings() {
  const navigation = useNavigation();

  // Prefer active restaurant (multi-branch) → fallback to login payload
  const { userInfo, activeRestaurant } = useSelector((state) => state.user);
  const userId = userInfo?.user_id;
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;

  // shiftStatus: true = Closed, false = Open (matching your old screen)
  const [shiftStatus, setShiftStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  // -------- debug helper --------
  const log = useCallback((label, obj) => {
    try {
      // keep logs compact but readable
      console.log(`[PartnerCenterSettings] ${label}:`, JSON.stringify(obj ?? {}, null, 2));
    } catch {
      console.log(`[PartnerCenterSettings] ${label}:`, obj);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Partner Center Settings"
          showBack
          showFilter={false}
          showReload={false}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation]);

  // Guard: need a restaurant selected
  useEffect(() => {
    if (!restId) {
      log('No restId – redirecting to RestaurantList', {});
      navigation.reset({ index: 0, routes: [{ name: 'RestaurantList' }] });
    }
  }, [restId, navigation, log]);

  // --- Load current status (funId=145) ---
  const fetchShiftStatus = useCallback(async () => {
    if (!restId) return;
    setLoading(true);
    try {
      const params = { rest_id: restId };
      log('getOnlineShiftStatus params', params);
      const res = await getOnlineShiftStatus(params);
      log('getOnlineShiftStatus response', res);

      // API returns { status: 1|0 }, where 1 => Closed
      const closed = String(res?.status) === '1';
      setShiftStatus(closed);
    } catch (e) {
      log('getOnlineShiftStatus error', { message: e?.message, stack: e?.stack });
      console.warn('Failed to load status', e?.message);
    } finally {
      setLoading(false);
    }
  }, [restId, log]);

  useEffect(() => {
    fetchShiftStatus();
  }, [fetchShiftStatus]);

  // --- Apply toggle (funId=144) ---
  const applyShiftStatus = useCallback(
    async (nextClosed) => {
      if (!restId || !userId) return;
      setLoading(true);
      try {
        const payload = {
          rest_id: restId,
          user_id: userId,
          status: nextClosed ? '1' : '0', // '1' => Closed, '0' => Open
        };
        log('setOnlineShiftStatus params', payload);
        const res = await setOnlineShiftStatus(payload);
        log('setOnlineShiftStatus response', res);

        setShiftStatus(nextClosed);
      } catch (e) {
        log('setOnlineShiftStatus error', { message: e?.message, stack: e?.stack });
        Alert.alert('Error', 'Unable to update Online Order status.');
      } finally {
        setLoading(false);
      }
    },
    [restId, userId, log]
  );

  // --- Confirm UI wrappers ---
  const confirmToggle = useCallback(
    (nextClosed) => {
      const title = `Online Order ${nextClosed ? 'Closing' : 'Opening'}`;
      const verb = nextClosed ? 'close' : 'open';
      log('confirmToggle click', { currentClosed: shiftStatus, nextClosed });
      Alert.alert(title, `Please confirm if you want to ${verb} the online order for today.`, [
        { text: 'CONFIRM', onPress: () => applyShiftStatus(nextClosed) },
        { text: 'CANCEL', style: 'cancel' },
      ]);
    },
    [applyShiftStatus, shiftStatus, log]
  );

  // --- Separate functions for row & switch ---
  const handleOnlineRowPress = useCallback(() => {
    const next = !shiftStatus;
    log('rowPress toggle requested', { fromClosed: shiftStatus, toClosed: next });
    confirmToggle(next);
  }, [shiftStatus, confirmToggle, log]);

  const handleOnlineSwitchChange = useCallback(
    (val) => {
      log('switchChange requested', { toClosed: val });
      confirmToggle(val);
    },
    [confirmToggle, log]
  );

  const renderOnlineOrderRight = useCallback(() => {
    return (
      <View className="flex-row items-center gap-1">
        <Text className={`text-xs ${shiftStatus ? 'text-red-600' : 'text-green-700'}`}>
          {shiftStatus ? 'Closed' : 'Open'}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Switch value={shiftStatus} onValueChange={handleOnlineSwitchChange} />
        )}
      </View>
    );
  }, [shiftStatus, loading, handleOnlineSwitchChange]);

  // --- Sections ---
  const sectionGroups = useMemo(
    () => [
      [
        {
          icon: <Ionicons name="power-outline" size={18} color="#000" />,
          label: 'Online Order',
          right: renderOnlineOrderRight(),
          onPress: handleOnlineRowPress, // toggle with confirmation when tapping row
        },
        {
          icon: <Ionicons name="time-outline" size={18} color="#000" />,
          label: 'Opening Hours',
          link: 'OpeningHour',
        },
        {
          icon: <MaterialCommunityIcons name="truck-delivery-outline" size={18} color="#000" />,
          label: 'Delivery and Collection',
          link: 'DeliveryAndCollection',
        },
      ],
      [
        {
          icon: <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#000" />,
          label: 'Reservation Setting',
          link: 'ReservationSetting',
        },
        {
          icon: <MaterialCommunityIcons name="clock-time-four-outline" size={18} color="#000" />,
          label: 'Reservation Hours',
          link: 'ReservationHours',
        },
      ],
      [
        {
          icon: <FontAwesome5 name="building" size={18} color="#000" />,
          label: 'Add Branch',
          right: <Ionicons name="add" size={18} color="#000" />,
          link: 'AddBranch',
        },
        {
          icon: <Ionicons name="notifications-outline" size={18} color="#000" />,
          label: 'Notification Code',
          right: <Ionicons name="notifications" size={18} color="#aaa" />,
          link: 'NotificationCode',
        },
      ],
      [
        {
          icon: (
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={18} color="#000" />
          ),
          label: 'Ticket Manager',
          link: 'TicketManager',
        },
        {
          icon: <FontAwesome name="file-text-o" size={18} color="#000" />,
          label: 'Invoice Manager',
          link: 'InvoiceManager',
        },
        {
          icon: <Entypo name="star-outlined" size={18} color="#000" />,
          label: 'Review Manager',
          link: 'ReviewManager',
        },
      ],
      [
        {
          icon: <Ionicons name="key-outline" size={18} color="#000" />,
          label: 'Change Password',
          link: 'ChangePassword',
        },
        {
          icon: <MaterialCommunityIcons name="pin-outline" size={18} color="#000" />,
          label: 'Change Pincode',
          link: 'ChangePincode',
        },
      ],
    ],
    [renderOnlineOrderRight, handleOnlineRowPress]
  );

  return (
    <ScrollView
      className="flex-1 bg-backgroundLight px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 120 }}>
      <View className="flex-col gap-4">
        {sectionGroups.map((group, groupIdx) => (
          <View
            key={groupIdx}
            className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
            {group.map((item, idx) => (
              <View key={idx}>
                <TouchableOpacity
                  className="h-14 flex-row items-center justify-between px-4"
                  onPress={() => {
                    if (item.onPress) return item.onPress();
                    if (item.link) {
                      log('navigate', { to: item.link });
                      return navigation.navigate(item.link);
                    }
                  }}>
                  <View className="flex-row items-center gap-3">
                    {item.icon}
                    <Text className="text-sm text-gray-800">{item.label}</Text>
                  </View>
                  {item.right ?? <Ionicons name="chevron-forward" size={18} color="#aaa" />}
                </TouchableOpacity>
                {idx !== group.length - 1 && <View className="h-[1px] bg-gray-200" />}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
