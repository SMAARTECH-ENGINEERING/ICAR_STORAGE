import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenContainer from '../../components/common/ScreenContainer';
import ConnectionStatus from '../../components/common/ConnectionStatus';
import StatCard from '../../components/cards/StatCard';
import RoomCard from '../../components/cards/RoomCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import roomApi from '../../api/roomApi';
import deviceApi from '../../api/deviceApi';
import alertApi from '../../api/alertApi';
import queryKeys from '../../utils/queryKeys';
import { useSocketEvent } from '../../hooks/useSocketEvents';
import { useAuth } from '../../context/AuthContext';
import { greeting } from '../../utils/timeUtils';
import { summarizeSensors } from '../../utils/sensorUtils';
import { colors, spacing, typography } from '../../theme';

const RECENT_ROOMS_LIMIT = 5;

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const roomsQuery = useQuery({ queryKey: queryKeys.rooms, queryFn: () => roomApi.list() });
  const devicesQuery = useQuery({ queryKey: queryKeys.devices({}), queryFn: () => deviceApi.list() });
  const alertsQuery = useQuery({
    queryKey: queryKeys.alerts({ status: 'active' }),
    queryFn: () => alertApi.list({ status: 'active' }),
  });

  const rooms = roomsQuery.data || [];
  const devices = devicesQuery.data || [];
  const activeAlerts = alertsQuery.data || [];

  const devicesByRoom = useMemo(() => {
    const map = {};
    devices.forEach((d) => {
      if (!map[d.roomId]) map[d.roomId] = [];
      map[d.roomId].push(d);
    });
    return map;
  }, [devices]);

  const alertsByRoom = useMemo(() => {
    const map = {};
    activeAlerts.forEach((a) => {
      map[a.roomId] = (map[a.roomId] || 0) + 1;
    });
    return map;
  }, [activeAlerts]);

  const recentRooms = useMemo(() => {
    return [...rooms]
      .sort((a, b) => (alertsByRoom[b.roomId] || 0) - (alertsByRoom[a.roomId] || 0))
      .slice(0, RECENT_ROOMS_LIMIT);
  }, [rooms, alertsByRoom]);

  const recentRoomIds = recentRooms.map((r) => r.roomId);

  const currentQueries = useQueries({
    queries: recentRoomIds.map((roomId) => ({
      queryKey: queryKeys.roomCurrent(roomId),
      queryFn: () => roomApi.current(roomId),
      enabled: !!roomId,
      staleTime: 15000,
    })),
  });

  useSocketEvent('device:telemetry', (payload) => {
    if (!payload?.roomId || !recentRoomIds.includes(payload.roomId)) return;
    queryClient.setQueryData(queryKeys.roomCurrent(payload.roomId), (old) => {
      if (!old) return old;
      const sensorData = (old.sensorData || []).map((state) =>
        state.deviceId === payload.deviceId ? { ...state, sensors: payload.sensors } : state
      );
      return { ...old, sensorData };
    });
  });

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;

  const isLoading = roomsQuery.isLoading || devicesQuery.isLoading || alertsQuery.isLoading;
  const isError = roomsQuery.isError || devicesQuery.isError || alertsQuery.isError;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      roomsQuery.refetch(),
      devicesQuery.refetch(),
      alertsQuery.refetch(),
      ...currentQueries.map((q) => q.refetch?.()),
    ]);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomsQuery, devicesQuery, alertsQuery]);

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <View style={{ marginTop: -insets.top }}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <View>
            <Text style={[typography.h1, styles.greeting]}>{greeting()} 👋</Text>
            <Text style={[typography.display, styles.name]}>{user?.name || 'there'}</Text>
            <Text style={[typography.bodySm, styles.appName]}>Smaatech Agri</Text>
          </View>
          <ConnectionStatus />
        </LinearGradient>
      </View>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState
          isNetworkError={roomsQuery.error?.isNetworkError}
          onRetry={() => {
            roomsQuery.refetch();
            devicesQuery.refetch();
            alertsQuery.refetch();
          }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.statsGrid}>
            <StatCard icon="business" value={rooms.length} label="Rooms" tone="primary" />
            <StatCard icon="checkmark-circle" value={onlineCount} label="Online" tone="success" />
            <StatCard icon="warning" value={activeAlerts.length} label="Alerts" tone="danger" />
            <StatCard icon="cloud-offline" value={offlineCount} label="Offline" tone="warning" />
          </Animated.View>

          <View style={styles.sectionHeader}>
            <Text style={[typography.h2, styles.sectionTitle]}>Storage Rooms</Text>
            {rooms.length > RECENT_ROOMS_LIMIT ? (
              <Text style={styles.sectionLink} onPress={() => navigation.navigate('Rooms')}>
                View all
              </Text>
            ) : null}
          </View>

          {recentRooms.length === 0 ? (
            <EmptyState
              icon="business-outline"
              title="No Rooms Yet"
              description="Create your first storage room to start monitoring your environment."
            />
          ) : (
            recentRooms.map((room, index) => {
              const roomDevices = devicesByRoom[room.roomId] || [];
              const current = currentQueries[index]?.data;
              const sensors = current ? summarizeSensors(mergeSensorStates(current.sensorData)) : undefined;
              return (
                <Animated.View key={room.roomId} entering={FadeInDown.duration(350).delay(index * 60)}>
                  <RoomCard
                    room={room}
                    deviceCount={roomDevices.length}
                    onlineCount={roomDevices.filter((d) => d.status === 'online').length}
                    offlineCount={roomDevices.filter((d) => d.status !== 'online').length}
                    activeAlertCount={alertsByRoom[room.roomId] || 0}
                    sensors={sensors}
                    onPress={() => navigation.navigate('RoomDetails', { roomId: room.roomId })}
                  />
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

function mergeSensorStates(sensorData = []) {
  const merged = {};
  sensorData.forEach((state) => {
    Object.entries(state.sensors || {}).forEach(([zone, data]) => {
      merged[`${state.deviceId}:${zone}`] = data;
    });
  });
  return merged;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' },
  name: { color: colors.white, marginTop: 2 },
  appName: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 2 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text },
  sectionLink: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
