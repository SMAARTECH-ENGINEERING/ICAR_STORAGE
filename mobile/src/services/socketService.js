import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/env';

// Single reusable Socket.IO connection for the whole app. The server only
// pushes events to `room:{roomId}` / `device:{deviceId}` channels (see
// server/src/sockets/index.js), so screens subscribe to the rooms/devices
// they care about via subscribeRoom/subscribeDevice.
//
// Event listeners are kept in an internal registry (relayed via socket.onAny)
// rather than attached directly to the socket instance, so screens can call
// `on(event, handler)` at any time — even before connect() has run — without
// missing events or needing to re-subscribe on reconnect.
let socket = null;
let status = 'disconnected'; // 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
const statusListeners = new Set();
const eventListeners = new Map();
const subscribedRooms = new Set();
const subscribedDevices = new Set();

function setStatus(next) {
  status = next;
  statusListeners.forEach((fn) => fn(status));
}

function resubscribeAll() {
  subscribedRooms.forEach((roomId) => socket.emit('subscribe:room', roomId));
  subscribedDevices.forEach((deviceId) => socket.emit('subscribe:device', deviceId));
}

export function connect(token) {
  if (socket) return socket;

  setStatus('connecting');
  socket = io(SOCKET_URL, {
    auth: token ? { token } : undefined,
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  socket.onAny((event, payload) => {
    eventListeners.get(event)?.forEach((fn) => fn(payload));
  });

  socket.on('connect', () => {
    setStatus('connected');
    resubscribeAll();
  });
  socket.on('disconnect', () => setStatus('reconnecting'));
  socket.on('reconnect_attempt', () => setStatus('reconnecting'));
  socket.on('connect_error', () => setStatus('reconnecting'));

  return socket;
}

export function disconnect() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  subscribedRooms.clear();
  subscribedDevices.clear();
  setStatus('disconnected');
}

export function getStatus() {
  return status;
}

export function onStatusChange(fn) {
  statusListeners.add(fn);
  fn(status);
  return () => statusListeners.delete(fn);
}

export function subscribeRoom(roomId) {
  if (!roomId || subscribedRooms.has(roomId)) return;
  subscribedRooms.add(roomId);
  socket?.emit('subscribe:room', roomId);
}

export function unsubscribeRoom(roomId) {
  if (!roomId || !subscribedRooms.has(roomId)) return;
  subscribedRooms.delete(roomId);
  socket?.emit('unsubscribe:room', roomId);
}

export function subscribeDevice(deviceId) {
  if (!deviceId || subscribedDevices.has(deviceId)) return;
  subscribedDevices.add(deviceId);
  socket?.emit('subscribe:device', deviceId);
}

export function unsubscribeDevice(deviceId) {
  if (!deviceId || !subscribedDevices.has(deviceId)) return;
  subscribedDevices.delete(deviceId);
  socket?.emit('unsubscribe:device', deviceId);
}

// Generic event listener registration; returns an unsubscribe function.
export function on(event, handler) {
  if (!eventListeners.has(event)) eventListeners.set(event, new Set());
  eventListeners.get(event).add(handler);
  return () => eventListeners.get(event)?.delete(handler);
}

export const socketService = {
  connect,
  disconnect,
  getStatus,
  onStatusChange,
  subscribeRoom,
  unsubscribeRoom,
  subscribeDevice,
  unsubscribeDevice,
  on,
};

export default socketService;
