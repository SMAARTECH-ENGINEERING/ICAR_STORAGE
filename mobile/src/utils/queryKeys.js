export const queryKeys = {
  rooms: ['rooms'],
  room: (roomId) => ['room', roomId],
  roomDevices: (roomId) => ['roomDevices', roomId],
  roomCurrent: (roomId) => ['roomCurrent', roomId],
  roomHistory: (roomId, params) => ['roomHistory', roomId, params],
  devices: (params) => ['devices', params],
  device: (deviceId) => ['device', deviceId],
  relays: (deviceId) => ['relays', deviceId],
  automationRule: (deviceId, relayId) => ['automationRule', deviceId, relayId],
  relayCommands: (deviceId, relayId) => ['relayCommands', deviceId, relayId],
  alerts: (params) => ['alerts', params || {}],
};

export default queryKeys;
