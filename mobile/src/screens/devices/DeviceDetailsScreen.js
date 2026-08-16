import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import IconButton from '../../components/common/IconButton';
import SensorCard from '../../components/sensors/SensorCard';
import SensorZoneCard from '../../components/sensors/SensorZoneCard';
import RelayCard from '../../components/relays/RelayCard';
import RelayControlSheet from '../../components/relays/RelayControlSheet';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusBadge from '../../components/common/StatusBadge';
import ErrorState from '../../components/common/ErrorState';
import SensorSkeleton from '../../components/skeletons/SensorSkeleton';
import RelaySkeleton from '../../components/skeletons/RelaySkeleton';
import deviceApi from '../../api/deviceApi';
import relayApi from '../../api/relayApi';
import roomApi from '../../api/roomApi';
import queryKeys from '../../utils/queryKeys';
import { useDeviceSubscription, useSocketEvent } from '../../hooks/useSocketEvents';
import { useAuth } from '../../context/AuthContext';
import { canControlRelays, canManage, canDelete } from '../../utils/permissions';
import { summarizeSensors } from '../../utils/sensorUtils';
import { timeAgo } from '../../utils/timeUtils';
import { colors, radius, spacing, typography } from '../../theme';

export default function DeviceDetailsScreen({ route, navigation }) {
  const { deviceId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeRelay, setActiveRelay] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useDeviceSubscription(deviceId);

  const deviceQuery = useQuery({ queryKey: queryKeys.device(deviceId), queryFn: () => deviceApi.get(deviceId) });
  const device = deviceQuery.data;

  const roomCurrentQuery = useQuery({
    queryKey: queryKeys.roomCurrent(device?.roomId),
    queryFn: () => roomApi.current(device.roomId),
    enabled: !!device?.roomId,
  });

  const relaysQuery = useQuery({ queryKey: queryKeys.relays(deviceId), queryFn: () => relayApi.list(deviceId) });
  const automationQuery = useQuery({
    queryKey: ['automationRules', deviceId],
    queryFn: () => relayApi.listAutomationRules(deviceId),
  });

  const relays = relaysQuery.data || [];
  const automationRules = automationQuery.data || [];

  const activityQueries = useQueries({
    queries: relays.map((relay) => ({
      queryKey: queryKeys.relayCommands(deviceId, relay.relayId),
      queryFn: () => relayApi.commandHistory(deviceId, relay.relayId, { limit: 5 }),
      enabled: relays.length > 0,
    })),
  });

  const recentActivity = useMemo(() => {
    const all = activityQueries.flatMap((q, i) =>
      (q.data || []).map((cmd) => ({ ...cmd, relayName: relays[i]?.name || relays[i]?.relayId }))
    );
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityQueries.map((q) => q.dataUpdatedAt).join(','), relays]);

  useSocketEvent('device:telemetry', (payload) => {
    if (payload?.deviceId !== deviceId || !device?.roomId) return;
    queryClient.setQueryData(queryKeys.roomCurrent(device.roomId), (old) => {
      if (!old) return old;
      const sensorData = (old.sensorData || []).map((s) => (s.deviceId === deviceId ? { ...s, sensors: payload.sensors } : s));
      return { ...old, sensorData };
    });
  });

  useSocketEvent('relay:stateChanged', (payload) => {
    if (payload?.deviceId !== deviceId) return;
    queryClient.setQueryData(queryKeys.relays(deviceId), (old) =>
      (old || []).map((r) => (r.relayId === payload.relayId ? { ...r, state: payload.state, mode: payload.mode || r.mode } : r))
    );
  });

  const sensors = useMemo(() => {
    const state = roomCurrentQuery.data?.sensorData?.find((s) => s.deviceId === deviceId);
    return state?.sensors || {};
  }, [roomCurrentQuery.data, deviceId]);

  const overview = useMemo(() => summarizeSensors(sensors), [sensors]);
  const isOnline = device?.status === 'online';

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([deviceQuery.refetch(), relaysQuery.refetch(), automationQuery.refetch(), roomCurrentQuery.refetch()]);
    setRefreshing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deviceApi.remove(deviceId);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setConfirmDelete(false);
      navigation.goBack();
    } catch {
      setDeleting(false);
    }
  }

  const isLoading = deviceQuery.isLoading || relaysQuery.isLoading;

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader
        title={device?.name || 'Device'}
        subtitle={device ? `${isOnline ? 'Online' : 'Offline'}${device.lastSeen ? ` • Last seen ${timeAgo(device.lastSeen)}` : ''}` : undefined}
        statusDot={isOnline ? colors.success : colors.secondary}
        onBack={() => navigation.goBack()}
        right={
          canManage(user?.role) && device ? (
            <>
              <IconButton icon="create-outline" color={colors.white} onPress={() => navigation.navigate('EditDevice', { deviceId })} />
              {canDelete(user?.role) ? (
                <IconButton icon="trash-outline" color={colors.danger} onPress={() => setConfirmDelete(true)} />
              ) : null}
            </>
          ) : undefined
        }
      />

      {isLoading ? (
        <>
          <SensorSkeleton />
          <RelaySkeleton />
        </>
      ) : deviceQuery.isError ? (
        <ErrorState isNetworkError={deviceQuery.error?.isNetworkError} onRetry={() => deviceQuery.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <Text style={[typography.h2, styles.sectionTitle]}>Live Sensors</Text>
          <View style={styles.overviewGrid}>
            <SensorCard label="Temperature" value={overview.temperature_c} unit="°C" icon="thermometer-outline" />
            <SensorCard label="Humidity" value={overview.humidity_percent} unit="%" decimals={0} icon="water-outline" />
            <SensorCard label="CO2" value={overview.co2_ppm} unit=" ppm" decimals={0} icon="cloud-outline" />
          </View>

          <Text style={[typography.h2, styles.sectionTitle]}>Sensor Zones</Text>
          {Object.keys(sensors).length === 0 ? (
            <Text style={[typography.body, styles.noData]}>No sensor data received yet.</Text>
          ) : (
            Object.entries(sensors).map(([zoneName, zoneData]) => (
              <SensorZoneCard key={zoneName} zoneName={zoneName} zoneData={zoneData} />
            ))
          )}

          <Text style={[typography.h2, styles.sectionTitle]}>Relays</Text>
          {relays.length === 0 ? (
            <Text style={[typography.body, styles.noData]}>No relays configured for this device.</Text>
          ) : (
            <View style={styles.relayGrid}>
              {relays.map((relay) => (
                <View key={relay.relayId} style={styles.relayCol}>
                  <RelayCard relay={relay} onPress={() => canControlRelays(user?.role) && setActiveRelay(relay)} />
                </View>
              ))}
            </View>
          )}

          <Text style={[typography.h2, styles.sectionTitle]}>Automation</Text>
          {relays.length === 0 ? (
            <Text style={[typography.body, styles.noData]}>Add relays to configure automation.</Text>
          ) : (
            relays.map((relay) => {
              const rule = automationRules.find((r) => r.relayId === relay.relayId);
              return (
                <View key={relay.relayId} style={styles.automationRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, styles.automationRelayName]}>{relay.name || relay.relayId}</Text>
                    {rule ? (
                      <Text style={[typography.bodySm, styles.automationSummary]}>
                        ON at {rule.thresholdOn}° • OFF at {rule.thresholdOff}° • {rule.zones?.join(', ') || 'no zones'}
                      </Text>
                    ) : (
                      <Text style={[typography.bodySm, styles.automationSummary]}>Not configured</Text>
                    )}
                  </View>
                  <StatusBadge label={rule?.enabled ? 'Enabled' : 'Disabled'} tone={rule?.enabled ? 'success' : 'neutral'} />
                  {canManage(user?.role) ? (
                    <IconButton
                      icon="chevron-forward"
                      onPress={() => navigation.navigate('Automation', { deviceId, relayId: relay.relayId })}
                    />
                  ) : null}
                </View>
              );
            })
          )}

          <Text style={[typography.h2, styles.sectionTitle]}>Activity</Text>
          {recentActivity.length === 0 ? (
            <Text style={[typography.body, styles.noData]}>No recent relay activity.</Text>
          ) : (
            recentActivity.map((cmd) => (
              <View key={cmd.commandId} style={styles.activityRow}>
                <Ionicons
                  name={cmd.status === 'CONFIRMED' ? 'checkmark-circle' : cmd.status === 'FAILED' || cmd.status === 'TIMEOUT' ? 'close-circle' : 'time-outline'}
                  size={16}
                  color={cmd.status === 'CONFIRMED' ? colors.success : cmd.status === 'FAILED' || cmd.status === 'TIMEOUT' ? colors.danger : colors.warning}
                />
                <Text style={[typography.bodySm, styles.activityText]} numberOfLines={1}>
                  {cmd.relayName} → {cmd.requestedState} ({cmd.source})
                </Text>
                <Text style={[typography.caption, styles.activityTime]}>{timeAgo(cmd.createdAt)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <RelayControlSheet
        visible={!!activeRelay}
        relay={activeRelay}
        deviceId={deviceId}
        onClose={() => setActiveRelay(null)}
      />

      <ConfirmModal
        visible={confirmDelete}
        title="Delete Device?"
        message={`This will permanently delete "${device?.name}". This action cannot be undone.`}
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
  sectionTitle: { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  overviewGrid: { flexDirection: 'row', gap: spacing.sm },
  noData: { color: colors.secondary },
  relayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  relayCol: { width: '47.5%' },
  automationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  automationRelayName: { color: colors.text },
  automationSummary: { color: colors.secondary, marginTop: 2 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  activityText: { color: colors.text, flex: 1, textTransform: 'capitalize' },
  activityTime: { color: colors.secondary },
});
