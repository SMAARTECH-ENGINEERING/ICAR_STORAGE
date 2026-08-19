import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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

const PAGE_SIZE = 40;

export default function SensorHistoryScreen({ route, navigation }) {
  const { roomId, deviceId: initialDeviceId } = route.params;
  const [range, setRange] = useState('24h');
  const [deviceFilter, setDeviceFilter] = useState(initialDeviceId || 'all');

  const roomQuery = useQuery({ queryKey: queryKeys.room(roomId), queryFn: () => roomApi.get(roomId) });
  const devicesQuery = useQuery({ queryKey: queryKeys.roomDevices(roomId), queryFn: () => roomApi.devices(roomId) });

  const selectedRange = RANGES.find((r) => r.key === range) || RANGES[0];
  const from = useMemo(() => new Date(Date.now() - selectedRange.hours * 3600 * 1000).toISOString(), [selectedRange]);

  // Keyset pagination: the backend has no offset/page param, but results are
  // sorted newest-first, so each next page just narrows `to` to just before
  // the oldest reading already loaded.
  const historyQuery = useInfiniteQuery({
    queryKey: queryKeys.roomHistory(roomId, { deviceId: deviceFilter, from }),
    queryFn: ({ pageParam }) =>
      roomApi.history(roomId, {
        from,
        to: pageParam,
        limit: PAGE_SIZE,
        ...(deviceFilter !== 'all' ? { deviceId: deviceFilter } : {}),
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      const oldest = lastPage[lastPage.length - 1];
      return new Date(new Date(oldest.timestamp).getTime() - 1).toISOString();
    },
  });

  const devices = devicesQuery.data || [];
  const readings = useMemo(() => historyQuery.data?.pages.flat() || [], [historyQuery.data]);

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader title="Sensor History" subtitle={roomQuery.data?.name} onBack={() => navigation.goBack()} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
      >
        {RANGES.map((item) => (
          <FilterChip key={item.key} label={item.label} active={range === item.key} onPress={() => setRange(item.key)} />
        ))}
      </ScrollView>

      {devices.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          <FilterChip label="All Devices" active={deviceFilter === 'all'} onPress={() => setDeviceFilter('all')} />
          {devices.map((item) => (
            <FilterChip
              key={item.deviceId}
              label={item.name}
              active={deviceFilter === item.deviceId}
              onPress={() => setDeviceFilter(item.deviceId)}
            />
          ))}
        </ScrollView>
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
          refreshing={historyQuery.isRefetching && !historyQuery.isFetchingNextPage}
          onRefresh={() => historyQuery.refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) historyQuery.fetchNextPage();
          }}
          renderItem={({ item }) => <HistoryRow reading={item} />}
          ListFooterComponent={
            historyQuery.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : null
          }
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
  filterRow: { flexGrow: 0, marginBottom: spacing.md },
  filterRowContent: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 60, flexGrow: 1 },
  footerLoader: { marginVertical: spacing.md },
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
