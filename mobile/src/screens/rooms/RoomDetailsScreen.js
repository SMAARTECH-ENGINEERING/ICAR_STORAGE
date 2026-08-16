import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import IconButton from '../../components/common/IconButton';
import SensorCard from '../../components/sensors/SensorCard';
import SensorZoneCard from '../../components/sensors/SensorZoneCard';
import DeviceCard from '../../components/cards/DeviceCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmModal from '../../components/common/ConfirmModal';
import SensorSkeleton from '../../components/skeletons/SensorSkeleton';
import DeviceSkeleton from '../../components/skeletons/DeviceSkeleton';
import roomApi from '../../api/roomApi';
import queryKeys from '../../utils/queryKeys';
import { useRoomSubscription, useSocketEvent } from '../../hooks/useSocketEvents';
import { useAuth } from '../../context/AuthContext';
import { canManage, canDelete } from '../../utils/permissions';
import { summarizeSensors } from '../../utils/sensorUtils';
import { colors, spacing, typography } from '../../theme';

export default function RoomDetailsScreen({ route, navigation }) {
  const { roomId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useRoomSubscription(roomId);

  const currentQuery = useQuery({
    queryKey: queryKeys.roomCurrent(roomId),
    queryFn: () => roomApi.current(roomId),
  });

  useSocketEvent('device:telemetry', (payload) => {
    if (payload?.roomId !== roomId) return;
    queryClient.setQueryData(queryKeys.roomCurrent(roomId), (old) => {
      if (!old) return old;
      const sensorData = (old.sensorData || []).map((state) =>
        state.deviceId === payload.deviceId ? { ...state, sensors: payload.sensors } : state
      );
      return { ...old, sensorData };
    });
  });

  useSocketEvent('device:online', (payload) => {
    if (payload?.roomId !== roomId) return;
    queryClient.setQueryData(queryKeys.roomCurrent(roomId), (old) => {
      if (!old) return old;
      return { ...old, devices: old.devices.map((d) => (d.deviceId === payload.deviceId ? { ...d, status: 'online' } : d)) };
    });
  });
  useSocketEvent('device:offline', (payload) => {
    if (payload?.roomId !== roomId) return;
    queryClient.setQueryData(queryKeys.roomCurrent(roomId), (old) => {
      if (!old) return old;
      return { ...old, devices: old.devices.map((d) => (d.deviceId === payload.deviceId ? { ...d, status: 'offline' } : d)) };
    });
  });

  useSocketEvent('alert:created', (payload) => {
    if (payload?.roomId !== roomId) return;
    queryClient.setQueryData(queryKeys.roomCurrent(roomId), (old) => {
      if (!old) return old;
      const exists = old.alerts?.some((a) => a._id === payload._id);
      return exists ? old : { ...old, alerts: [payload, ...(old.alerts || [])] };
    });
  });
  useSocketEvent('alert:resolved', (payload) => {
    if (payload?.roomId !== roomId) return;
    queryClient.setQueryData(queryKeys.roomCurrent(roomId), (old) => {
      if (!old) return old;
      return { ...old, alerts: (old.alerts || []).filter((a) => a._id !== payload._id) };
    });
  });

  const data = currentQuery.data;
  const room = data?.room;
  const devices = data?.devices || [];
  const sensorData = data?.sensorData || [];
  const alerts = data?.alerts || [];

  const onlineCount = devices.filter((d) => d.status === 'online').length;

  const zoneEntries = useMemo(() => {
    const entries = [];
    sensorData.forEach((state) => {
      const device = devices.find((d) => d.deviceId === state.deviceId);
      Object.entries(state.sensors || {}).forEach(([zoneName, zoneData]) => {
        entries.push({
          key: `${state.deviceId}:${zoneName}`,
          deviceId: state.deviceId,
          deviceName: device?.name,
          zoneName,
          zoneData,
        });
      });
    });
    return entries;
  }, [sensorData, devices]);

  const overview = useMemo(() => {
    const merged = {};
    zoneEntries.forEach((entry) => {
      merged[entry.key] = entry.zoneData;
    });
    return summarizeSensors(merged);
  }, [zoneEntries]);

  const alertParams = new Set(alerts.map((a) => a.parameter));
  const statusFor = (type, key) => {
    const hasAlert = alerts.some((a) => a.type === type);
    return hasAlert ? 'warning' : overview[key] === null || overview[key] === undefined ? 'unknown' : 'normal';
  };

  async function handleDelete() {
    setDeleting(true);
    try {
      await roomApi.remove(roomId);
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      setConfirmDelete(false);
      navigation.goBack();
    } catch (err) {
      setDeleting(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await currentQuery.refetch();
    setRefreshing(false);
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader
        title={room?.name || 'Room'}
        subtitle={room?.location}
        statusDot={onlineCount > 0 ? colors.success : colors.secondary}
        onBack={() => navigation.goBack()}
        right={
          canManage(user?.role) && room ? (
            <>
              <IconButton icon="create-outline" color={colors.white} onPress={() => navigation.navigate('EditRoom', { roomId })} />
              {canDelete(user?.role) ? (
                <IconButton icon="trash-outline" color={colors.danger} onPress={() => setConfirmDelete(true)} />
              ) : null}
            </>
          ) : undefined
        }
      />

      {currentQuery.isLoading ? (
        <>
          <SensorSkeleton />
          <DeviceSkeleton />
        </>
      ) : currentQuery.isError ? (
        <ErrorState isNetworkError={currentQuery.error?.isNetworkError} onRetry={() => currentQuery.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <Text style={[typography.overline, styles.deviceCountLabel]}>
            ● {onlineCount} of {devices.length} Devices Online
          </Text>

          <Text style={[typography.h2, styles.sectionTitle]}>Environment Overview</Text>
          <View style={styles.overviewGrid}>
            <SensorCard
              label="Temperature"
              value={overview.temperature_c}
              unit="°C"
              icon="thermometer-outline"
              status={statusFor('HIGH_TEMPERATURE', 'temperature_c')}
            />
            <SensorCard
              label="Humidity"
              value={overview.humidity_percent}
              unit="%"
              decimals={0}
              icon="water-outline"
              status={statusFor('HIGH_HUMIDITY', 'humidity_percent')}
            />
            <SensorCard
              label="CO2"
              value={overview.co2_ppm}
              unit=" ppm"
              decimals={0}
              icon="cloud-outline"
              status={statusFor('HIGH_CO2', 'co2_ppm')}
            />
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={[typography.h2, styles.sectionTitle]}>Sensor Zones</Text>
            <Text
              style={styles.historyLink}
              onPress={() => navigation.navigate('SensorHistory', { roomId })}
            >
              View History
            </Text>
          </View>
          {zoneEntries.length === 0 ? (
            <Text style={[typography.body, styles.noData]}>No sensor data received yet.</Text>
          ) : (
            zoneEntries.map((entry) => (
              <SensorZoneCard
                key={entry.key}
                zoneName={entry.deviceName ? `${entry.deviceName} • ${entry.zoneName}` : entry.zoneName}
                zoneData={entry.zoneData}
                hasAlert={alertParams.has(entry.zoneName)}
              />
            ))
          )}

          <Text style={[typography.h2, styles.sectionTitle]}>Devices</Text>
          {devices.length === 0 ? (
            <EmptyState icon="hardware-chip-outline" title="No Devices" description="This room doesn't have any devices yet." />
          ) : (
            devices.map((device, index) => (
              <Animated.View key={device.deviceId} entering={FadeInDown.duration(300).delay(index * 50)}>
                <DeviceCard device={device} onPress={() => navigation.navigate('DeviceDetails', { deviceId: device.deviceId })} />
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}

      <ConfirmModal
        visible={confirmDelete}
        title="Delete Room?"
        message={`This will permanently delete "${room?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  deviceCountLabel: { color: colors.success, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyLink: { color: colors.primary, fontWeight: '700', fontSize: 13, marginTop: spacing.lg },
  overviewGrid: { flexDirection: 'row', gap: spacing.sm },
  noData: { color: colors.secondary, marginBottom: spacing.md },
});
