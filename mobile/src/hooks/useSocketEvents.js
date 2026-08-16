import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';

// Subscribes to a single room channel for the lifetime of the component.
export function useRoomSubscription(roomId) {
  useEffect(() => {
    if (!roomId) return undefined;
    socketService.subscribeRoom(roomId);
    return () => socketService.unsubscribeRoom(roomId);
  }, [roomId]);
}

// Subscribes to many room channels at once (e.g. dashboard/rooms list),
// re-diffing the join set whenever the id list changes.
export function useRoomsSubscription(roomIds) {
  const key = (roomIds || []).join(',');
  useEffect(() => {
    const ids = key ? key.split(',') : [];
    ids.forEach((id) => socketService.subscribeRoom(id));
    return () => ids.forEach((id) => socketService.unsubscribeRoom(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function useDeviceSubscription(deviceId) {
  useEffect(() => {
    if (!deviceId) return undefined;
    socketService.subscribeDevice(deviceId);
    return () => socketService.unsubscribeDevice(deviceId);
  }, [deviceId]);
}

// Registers a handler for a socket event without re-subscribing on every
// render; always calls the latest version of `handler`.
export function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const off = socketService.on(event, (payload) => handlerRef.current?.(payload));
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
