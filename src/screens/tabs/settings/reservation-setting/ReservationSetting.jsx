// src/screens/tabs/reservations/ReservationSetting.jsx
import React, { useCallback, useLayoutEffect, useEffect, useState } from 'react';
import { View, Text, Switch, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AppHeader from './../../../../components/AppHeader';
import {
  getReservationSettings,
  setAcceptReservation,
  setAutoReservation,
} from './../../../../utils/apiService';

export default function ReservationSetting() {
  const navigation = useNavigation();

  // Prefer selected restaurant (multi-branch) → fallback to login payload
  const { userInfo, activeRestaurant } = useSelector((s) => s.user);
  const restId = activeRestaurant?.restaurant_id || userInfo?.rest_id || null;

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState({ reservation: false, auto: false });

  const [isReservationEnabled, setIsReservationEnabled] = useState(false);
  const [isAutoConfirmEnabled, setIsAutoConfirmEnabled] = useState(false);

  // tiny pretty logger
  const log = useCallback((label, obj) => {
    try {
      console.log(`[ReservationSetting] ${label}:`, JSON.stringify(obj ?? {}, null, 2));
    } catch {
      console.log(`[ReservationSetting] ${label}:`, obj);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!restId) return;
    setInitialLoading(true);
    try {
      const params = { rest_id: restId };
      log('getReservationSettings params', params);
      const res = await getReservationSettings(params);
      log('getReservationSettings response', res);

      if (res?.status === 'Success') {
        const accept = String(res?.list?.accept_reservation) === '1';
        const auto = String(res?.list?.is_auto_reservation) === '1';
        setIsReservationEnabled(accept);
        setIsAutoConfirmEnabled(auto);
      } else {
        Alert.alert('Failed', res?.msg || 'Could not load reservation settings.');
      }
    } catch (e) {
      log('getReservationSettings error', { message: e?.message, stack: e?.stack });
      Alert.alert('Error', 'Failed to load reservation settings.');
    } finally {
      setInitialLoading(false);
    }
  }, [restId, log]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <AppHeader
          title="Reservation Setting"
          showBack
          showFilter={false}
          showReload
          onReloadPress={fetchSettings}
          bgColor="bg-white"
          textColor="text-text"
        />
      ),
    });
  }, [navigation, fetchSettings]);

  const onToggleReservation = useCallback(
    async (next) => {
      if (!restId) return;
      const prev = isReservationEnabled;
      setIsReservationEnabled(next);
      setSaving((s) => ({ ...s, reservation: true }));
      try {
        const params = { rest_id: restId, accept: next ? '1' : '0' };
        log('setAcceptReservation params', params);
        const res = await setAcceptReservation(params);
        log('setAcceptReservation response', res);

        if (res?.status !== 'Success') {
          setIsReservationEnabled(prev);
          Alert.alert('Failed', res?.msg || 'Could not update reservation.');
        }
      } catch (e) {
        log('setAcceptReservation error', { message: e?.message, stack: e?.stack });
        setIsReservationEnabled(prev);
        Alert.alert('Error', 'Unable to update reservation.');
      } finally {
        setSaving((s) => ({ ...s, reservation: false }));
      }
    },
    [isReservationEnabled, restId, log]
  );

  const onToggleAutoConfirm = useCallback(
    async (next) => {
      if (!restId) return;
      const prev = isAutoConfirmEnabled;
      setIsAutoConfirmEnabled(next);
      setSaving((s) => ({ ...s, auto: true }));
      try {
        const params = { rest_id: restId, auto: next ? '1' : '0' };
        log('setAutoReservation params', params);
        const res = await setAutoReservation(params);
        log('setAutoReservation response', res);

        if (res?.status !== 'Success') {
          setIsAutoConfirmEnabled(prev);
          Alert.alert('Failed', res?.msg || 'Could not update auto-confirm.');
        }
      } catch (e) {
        log('setAutoReservation error', { message: e?.message, stack: e?.stack });
        setIsAutoConfirmEnabled(prev);
        Alert.alert('Error', 'Unable to update auto-confirm.');
      } finally {
        setSaving((s) => ({ ...s, auto: false }));
      }
    },
    [isAutoConfirmEnabled, restId, log]
  );

  const disableAll = initialLoading || saving.reservation || saving.auto;

  const Row = ({ label, right, bordered = false }) => (
    <View style={[styles.row, bordered && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.rightBox}>{right}</View>
    </View>
  );

  // If no restaurant selected (edge)
  if (!restId) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#374151' }}>
          No restaurant selected. Please choose a restaurant first.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Row
          label="RESERVATION"
          bordered
          right={
            initialLoading || saving.reservation ? (
              <ActivityIndicator />
            ) : (
              <Switch
                trackColor={{ false: '#ccc', true: '#f43f5e' }}
                thumbColor="#fff"
                ios_backgroundColor="#ccc"
                value={isReservationEnabled}
                onValueChange={onToggleReservation}
                disabled={disableAll}
              />
            )
          }
        />

        <Row
          label="AUTO CONFIRM RESERVATION"
          right={
            initialLoading || saving.auto ? (
              <ActivityIndicator />
            ) : (
              <Switch
                trackColor={{ false: '#ccc', true: '#f43f5e' }}
                thumbColor="#fff"
                ios_backgroundColor="#ccc"
                value={isAutoConfirmEnabled}
                onValueChange={onToggleAutoConfirm}
                disabled={disableAll}
              />
            )
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB', padding: 16 },
  card: {
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  row: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', flexShrink: 1, paddingRight: 12 },
  rightBox: { width: 64, height: 32, alignItems: 'center', justifyContent: 'center' },
});
