import { useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import FilterChip from '../../components/common/FilterChip';
import AlertCard from '../../components/alerts/AlertCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import AlertSkeleton from '../../components/skeletons/AlertSkeleton';
import ConnectionStatus from '../../components/common/ConnectionStatus';
import alertApi from '../../api/alertApi';
import roomApi from '../../api/roomApi';
import deviceApi from '../../api/deviceApi';
import queryKeys from '../../utils/queryKeys';
import { spacing } from '../../theme';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
];

export default function AlertsScreen() {
  const [filter, setFilter] = useState('all');

  const alertsQuery = useQuery({ queryKey: queryKeys.alerts({}), queryFn: () => alertApi.list({ limit: 200 }) });
  const roomsQuery = useQuery({ queryKey: queryKeys.rooms, queryFn: () => roomApi.list() });
  const devicesQuery = useQuery({ queryKey: queryKeys.devices({}), queryFn: () => deviceApi.list() });

  const alerts = alertsQuery.data || [];
  const roomsById = useMemo(() => Object.fromEntries((roomsQuery.data || []).map((r) => [r.roomId, r])), [roomsQuery.data]);
  const devicesById = useMemo(
    () => Object.fromEntries((devicesQuery.data || []).map((d) => [d.deviceId, d])),
    [devicesQuery.data]
  );

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter((a) => a.status === filter);
  }, [alerts, filter]);

  const isLoading = alertsQuery.isLoading;
  const isError = alertsQuery.isError;
  const refreshing = alertsQuery.isRefetching;

  function refreshAll() {
    alertsQuery.refetch();
    roomsQuery.refetch();
    devicesQuery.refetch();
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader
        title="Alerts"
        subtitle={`${activeCount} active alert${activeCount === 1 ? '' : 's'}`}
        large
        right={<ConnectionStatus />}
      />

      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        renderItem={({ item }) => (
          <FilterChip label={item.label} active={filter === item.key} onPress={() => setFilter(item.key)} />
        )}
      />

      {isLoading ? (
        <AlertSkeleton />
      ) : isError ? (
        <ErrorState isNetworkError={alertsQuery.error?.isNetworkError} onRetry={refreshAll} />
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={refreshAll}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 8) * 40)}>
              <AlertCard alert={item} roomName={roomsById[item.roomId]?.name} deviceName={devicesById[item.deviceId]?.name} />
            </Animated.View>
          )}
          ListEmptyComponent={
            filter === 'active' || filter === 'all' ? (
              <EmptyState icon="checkmark-done-circle-outline" title="All Clear 🎉" description="No active alerts right now." />
            ) : (
              <EmptyState icon="time-outline" title="No Resolved Alerts" description="Resolved alerts will show up here." />
            )
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterList: { flexGrow: 0, marginTop: spacing.md, marginBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 120, flexGrow: 1 },
});
