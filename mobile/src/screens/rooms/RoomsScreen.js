import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import SearchBar from '../../components/common/SearchBar';
import FilterChip from '../../components/common/FilterChip';
import RoomCard from '../../components/cards/RoomCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import RoomSkeleton from '../../components/skeletons/RoomSkeleton';
import IconButton from '../../components/common/IconButton';
import roomApi from '../../api/roomApi';
import deviceApi from '../../api/deviceApi';
import alertApi from '../../api/alertApi';
import queryKeys from '../../utils/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { canManage } from '../../utils/permissions';
import { colors, radius, spacing } from '../../theme';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'offline', label: 'Offline' },
  { key: 'alerts', label: 'Alerts' },
];

export default function RoomsScreen({ navigation }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

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

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rooms.filter((room) => {
      const roomDevices = devicesByRoom[room.roomId] || [];
      const onlineCount = roomDevices.filter((d) => d.status === 'online').length;
      const alertCount = alertsByRoom[room.roomId] || 0;

      if (query) {
        const haystack = `${room.name} ${room.location || ''} ${room.code || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filter === 'online' && onlineCount === 0) return false;
      if (filter === 'offline' && onlineCount > 0) return false;
      if (filter === 'alerts' && alertCount === 0) return false;
      return true;
    });
  }, [rooms, devicesByRoom, alertsByRoom, search, filter]);

  const isLoading = roomsQuery.isLoading || devicesQuery.isLoading || alertsQuery.isLoading;
  const isError = roomsQuery.isError || devicesQuery.isError || alertsQuery.isError;
  const refreshing = roomsQuery.isRefetching || devicesQuery.isRefetching || alertsQuery.isRefetching;

  function refreshAll() {
    roomsQuery.refetch();
    devicesQuery.refetch();
    alertsQuery.refetch();
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader title="Rooms" subtitle="Monitor all storage environments" large />

      <View style={styles.filtersBlock}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search rooms..." />
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          style={styles.filterList}
          contentContainerStyle={{ paddingRight: spacing.lg }}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              active={filter === item.key}
              onPress={() => setFilter(item.key)}
              count={item.key === 'alerts' ? activeAlerts.length : undefined}
            />
          )}
        />
      </View>

      {isLoading ? (
        <RoomSkeleton />
      ) : isError ? (
        <ErrorState isNetworkError={roomsQuery.error?.isNetworkError} onRetry={refreshAll} />
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.roomId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={refreshAll}
          renderItem={({ item, index }) => {
            const roomDevices = devicesByRoom[item.roomId] || [];
            return (
              <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 8) * 50)}>
                <RoomCard
                  room={item}
                  deviceCount={roomDevices.length}
                  onlineCount={roomDevices.filter((d) => d.status === 'online').length}
                  offlineCount={roomDevices.filter((d) => d.status !== 'online').length}
                  activeAlertCount={alertsByRoom[item.roomId] || 0}
                  onPress={() => navigation.navigate('RoomDetails', { roomId: item.roomId })}
                />
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title={search || filter !== 'all' ? 'No Matching Rooms' : 'No Rooms Yet'}
              description={
                search || filter !== 'all'
                  ? 'Try a different search term or filter.'
                  : 'Create your first storage room to start monitoring your environment.'
              }
              actionLabel={!search && filter === 'all' && canManage(user?.role) ? 'Create Room' : undefined}
              onAction={() => navigation.navigate('CreateRoom')}
            />
          }
        />
      )}

      {canManage(user?.role) ? (
        <IconButton
          icon="add"
          size={26}
          color={colors.white}
          backgroundColor={colors.primary}
          onPress={() => navigation.navigate('CreateRoom')}
          style={styles.fab}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filtersBlock: { paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  filterList: { marginTop: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 120, flexGrow: 1 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 110,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
