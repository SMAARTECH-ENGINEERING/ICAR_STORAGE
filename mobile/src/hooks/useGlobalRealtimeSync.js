import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketEvent, useRoomsSubscription } from './useSocketEvents';
import roomApi from '../api/roomApi';
import queryKeys from '../utils/queryKeys';

// Mounted once at the app root while authenticated. Joins every known room's
// socket channel (the server only pushes events to `room:{roomId}` /
// `device:{deviceId}` — there's no global broadcast) so alerts/status update
// live no matter which screen is focused, and handles low-frequency global
// invalidations. High-frequency events (telemetry) are handled locally by
// the screens that display them via setQueryData merges, not global
// invalidation, to avoid refetch storms.
export default function useGlobalRealtimeSync() {
  const queryClient = useQueryClient();

  const { data: rooms } = useQuery({
    queryKey: queryKeys.rooms,
    queryFn: () => roomApi.list(),
    staleTime: 30000,
  });
  useRoomsSubscription((rooms || []).map((r) => r.roomId));

  useSocketEvent('alert:created', () => {
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  });
  useSocketEvent('alert:resolved', () => {
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  });

  useSocketEvent('device:online', (payload) => {
    queryClient.invalidateQueries({ queryKey: ['devices'] });
    if (payload?.deviceId) queryClient.invalidateQueries({ queryKey: queryKeys.device(payload.deviceId) });
    if (payload?.roomId) queryClient.invalidateQueries({ queryKey: queryKeys.roomCurrent(payload.roomId) });
  });
  useSocketEvent('device:offline', (payload) => {
    queryClient.invalidateQueries({ queryKey: ['devices'] });
    if (payload?.deviceId) queryClient.invalidateQueries({ queryKey: queryKeys.device(payload.deviceId) });
    if (payload?.roomId) queryClient.invalidateQueries({ queryKey: queryKeys.roomCurrent(payload.roomId) });
  });
}
