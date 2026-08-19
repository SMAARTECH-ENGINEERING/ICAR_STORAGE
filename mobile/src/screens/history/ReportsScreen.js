import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import FilterChip from '../../components/common/FilterChip';
import DatePickerField from '../../components/common/DatePickerField';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import RoomSkeleton from '../../components/skeletons/RoomSkeleton';
import roomApi from '../../api/roomApi';
import queryKeys from '../../utils/queryKeys';
import { fieldLabel, fieldUnit, formatValue, isZoneField, summarizeSensors, toTitleCase } from '../../utils/sensorUtils';
import { formatDateTime } from '../../utils/timeUtils';
import { colors, radius, spacing, typography } from '../../theme';

const PRESETS = [
  { key: 'today', label: 'Today', days: 0 },
  { key: '7d', label: '7 Days', days: 7 },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '90d', label: '90 Days', days: 90 },
];

const PAGE_SIZE = 40;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function ReportsScreen({ navigation }) {
  const roomsQuery = useQuery({ queryKey: queryKeys.rooms, queryFn: () => roomApi.list() });
  const rooms = roomsQuery.data || [];

  const [roomId, setRoomId] = useState(null);
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [preset, setPreset] = useState('7d');
  const [fromDate, setFromDate] = useState(startOfDay(new Date(Date.now() - 7 * 24 * 3600 * 1000)));
  const [toDate, setToDate] = useState(endOfDay(new Date()));

  useEffect(() => {
    if (!roomId && rooms.length > 0) setRoomId(rooms[0].roomId);
  }, [rooms, roomId]);

  useEffect(() => {
    setDeviceFilter('all');
  }, [roomId]);

  const devicesQuery = useQuery({
    queryKey: queryKeys.roomDevices(roomId),
    queryFn: () => roomApi.devices(roomId),
    enabled: !!roomId,
  });
  const devices = devicesQuery.data || [];

  function applyPreset(key) {
    setPreset(key);
    const p = PRESETS.find((item) => item.key === key);
    setFromDate(startOfDay(new Date(Date.now() - p.days * 24 * 3600 * 1000)));
    setToDate(endOfDay(new Date()));
  }

  function handleFromChange(date) {
    setPreset(null);
    setFromDate(startOfDay(date));
  }

  function handleToChange(date) {
    setPreset(null);
    setToDate(endOfDay(date));
  }

  const fromIso = fromDate.toISOString();
  const toIso = toDate.toISOString();

  // Keyset pagination: the backend has no offset/page param, but results are
  // sorted newest-first, so each next page just narrows the upper bound to
  // just before the oldest reading already loaded (never past the report's
  // own `from` boundary).
  const historyQuery = useInfiniteQuery({
    queryKey: queryKeys.roomHistory(roomId, { deviceId: deviceFilter, from: fromIso, to: toIso }),
    queryFn: ({ pageParam }) =>
      roomApi.history(roomId, {
        from: fromIso,
        to: pageParam || toIso,
        limit: PAGE_SIZE,
        ...(deviceFilter !== 'all' ? { deviceId: deviceFilter } : {}),
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      const oldest = lastPage[lastPage.length - 1];
      return new Date(new Date(oldest.timestamp).getTime() - 1).toISOString();
    },
    enabled: !!roomId,
  });

  const readings = useMemo(() => historyQuery.data?.pages.flat() || [], [historyQuery.data]);

  const summary = useMemo(() => {
    if (readings.length === 0) return null;
    const perReading = readings.map((r) => summarizeSensors(r.sensors || {}));
    const avg = (key) => {
      const values = perReading.map((s) => s[key]).filter((v) => typeof v === 'number');
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    };
    const max = (key) => {
      const values = perReading.map((s) => s[key]).filter((v) => typeof v === 'number');
      return values.length ? Math.max(...values) : null;
    };
    return {
      count: readings.length,
      avgTemp: avg('temperature_c'),
      avgHumidity: avg('humidity_percent'),
      maxCo2: max('co2_ppm'),
    };
  }, [readings]);

  const isLoading = roomsQuery.isLoading || (roomId && historyQuery.isLoading);
  const isError = roomsQuery.isError || historyQuery.isError;

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader title="Reports" subtitle="Sensor data by date range" onBack={() => navigation.goBack()} />

      {roomsQuery.isLoading ? (
        <RoomSkeleton count={3} />
      ) : rooms.length === 0 ? (
        <EmptyState icon="business-outline" title="No Rooms Yet" description="Create a room to start generating reports." />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipList}
            contentContainerStyle={styles.chipListContent}
          >
            {rooms.map((item) => (
              <FilterChip key={item.roomId} label={item.name} active={roomId === item.roomId} onPress={() => setRoomId(item.roomId)} />
            ))}
          </ScrollView>

          {devices.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipList}
              contentContainerStyle={styles.chipListContent}
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipList}
            contentContainerStyle={styles.chipListContent}
          >
            {PRESETS.map((item) => (
              <FilterChip key={item.key} label={item.label} active={preset === item.key} onPress={() => applyPreset(item.key)} />
            ))}
          </ScrollView>

          <View style={styles.dateRow}>
            <DatePickerField label="From" value={fromDate} maximumDate={toDate} onChange={handleFromChange} />
            <DatePickerField label="To" value={toDate} minimumDate={fromDate} maximumDate={new Date()} onChange={handleToChange} />
          </View>

          {isLoading ? (
            <RoomSkeleton count={5} />
          ) : isError ? (
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
              ListHeaderComponent={
                summary ? (
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <SummaryStat label="Loaded" value={summary.count} />
                      <SummaryStat label="Avg Temp" value={summary.avgTemp !== null ? `${summary.avgTemp.toFixed(1)}°C` : '--'} />
                      <SummaryStat label="Avg Humidity" value={summary.avgHumidity !== null ? `${summary.avgHumidity.toFixed(0)}%` : '--'} />
                      <SummaryStat label="Peak CO2" value={summary.maxCo2 !== null ? `${summary.maxCo2.toFixed(0)} ppm` : '--'} />
                    </View>
                  </View>
                ) : null
              }
              renderItem={({ item }) => <HistoryRow reading={item} />}
              ListFooterComponent={
                historyQuery.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : null
              }
              ListEmptyComponent={
                <EmptyState icon="bar-chart-outline" title="No Data" description="No sensor readings found for this date range." />
              }
            />
          )}
        </>
      )}
    </ScreenContainer>
  );
}

function SummaryStat({ label, value }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[typography.h3, styles.summaryValue]}>{value}</Text>
      <Text style={[typography.caption, styles.summaryLabel]}>{label}</Text>
    </View>
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
  chipList: { flexGrow: 0, marginTop: spacing.md },
  chipListContent: { paddingHorizontal: spacing.lg },
  dateRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 60, flexGrow: 1 },
  footerLoader: { marginVertical: spacing.md },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryRow: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  summaryStat: { alignItems: 'center', flex: 1 },
  summaryValue: { color: colors.primaryDark },
  summaryLabel: { color: colors.secondary, marginTop: 2, textAlign: 'center' },
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
