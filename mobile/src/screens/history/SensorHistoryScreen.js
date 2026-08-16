import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import FilterChip from '../../components/common/FilterChip';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import RoomSkeleton from '../../components/skeletons/RoomSkeleton';
import roomApi from '../../api/roomApi';
import queryKeys from '../../utils/queryKeys';
import { fieldLabel, fieldUnit, formatValue, isZoneField, toTitleCase } from '../../utils/sensorUtils';
import { formatDateTime } from '../../utils/timeUtils';
import { colors, radius, spacing, typography } from '../../theme';

const RANGES = [
  { key: '24h', label: '24 Hours', hours: 24 },
  { key: '7d', label: '7 Days', hours: 24 * 7 },
  { key: '30d', label: '30 Days', hours: 24 * 30 },
];

export default function SensorHistoryScreen({ route, navigation }) {
  const { roomId, deviceId: initialDeviceId } = route.params;
  const [range, setRange] = useState('24h');
  const [deviceFilter, setDeviceFilter] = useState(initialDeviceId || 'all');

  const roomQuery = useQuery({ queryKey: queryKeys.room(roomId), queryFn: () => roomApi.get(roomId) });
  const devicesQuery = useQuery({ queryKey: queryKeys.roomDevices(roomId), queryFn: () => roomApi.devices(roomId) });

  const selectedRange = RANGES.find((r) => r.key === range) || RANGES[0];
  const from = useMemo(() => new Date(Date.now() - selectedRange.hours * 3600 * 1000).toISOString(), [selectedRange]);

  const historyQuery = useQuery({
    queryKey: queryKeys.roomHistory(roomId, { deviceId: deviceFilter, from }),
    queryFn: () =>
      roomApi.history(roomId, {
        from,
        limit: 200,
        ...(deviceFilter !== 'all' ? { deviceId: deviceFilter } : {}),
      }),
  });

  const devices = devicesQuery.data || [];
  const readings = historyQuery.data || [];

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader title="Sensor History" subtitle={roomQuery.data?.name} onBack={() => navigation.goBack()} />

      <FlatList
        data={RANGES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        renderItem={({ item }) => <FilterChip label={item.label} active={range === item.key} onPress={() => setRange(item.key)} />}
      />

      {devices.length > 1 ? (
        <FlatList
          data={[{ deviceId: 'all', name: 'All Devices' }, ...devices]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.deviceId}
          style={styles.filterList}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => (
            <FilterChip label={item.name} active={deviceFilter === item.deviceId} onPress={() => setDeviceFilter(item.deviceId)} />
          )}
        />
      ) : null}

      {historyQuery.isLoading ? (
        <RoomSkeleton count={6} />
      ) : historyQuery.isError ? (
        <ErrorState isNetworkError={historyQuery.error?.isNetworkError} onRetry={() => historyQuery.refetch()} />
      ) : (
        <FlatList
          data={readings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={historyQuery.isRefetching}
          onRefresh={() => historyQuery.refetch()}
          renderItem={({ item }) => <HistoryRow reading={item} />}
          ListEmptyComponent={
            <EmptyState icon="time-outline" title="No History" description="No sensor readings found for this time range." />
          }
        />
      )}
    </ScreenContainer>
  );
}

function HistoryRow({ reading }) {
  const zones = Object.entries(reading.sensors || {});
  return (
    <View style={styles.row}>
      <Text style={[typography.bodySm, styles.rowTime]}>{formatDateTime(reading.timestamp)}</Text>
      {zones.map(([zoneName, zoneData]) => {
        const fields = Object.entries(zoneData || {}).filter(([key]) => isZoneField(key));
        return (
          <View key={zoneName} style={styles.zoneLine}>
            <Text style={styles.zoneName}>{toTitleCase(zoneName)}</Text>
            <Text style={styles.zoneValues} numberOfLines={1}>
              {fields.map(([key, value]) => `${fieldLabel(key)} ${formatValue(value, key)}${fieldUnit(key)}`).join('  ·  ')}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filterList: { flexGrow: 0, marginBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 60, flexGrow: 1 },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTime: { color: colors.text, fontWeight: '700', marginBottom: spacing.xs },
  zoneLine: { marginTop: 4 },
  zoneName: { ...typography.caption, color: colors.primaryDark },
  zoneValues: { ...typography.bodySm, color: colors.secondary, marginTop: 2 },
});
