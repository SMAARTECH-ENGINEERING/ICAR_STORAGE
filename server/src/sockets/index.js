const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');

let io = null;

function roomChannel(roomId) {
  return `room:${roomId}`;
}

function deviceChannel(deviceId) {
  return `device:${deviceId}`;
}

function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow anonymous read-only connections; namespaces/rooms still gate data by join requests.
      return next();
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      socket.user = { userId: payload.sub, role: payload.role };
    } catch (err) {
      logger.warn('Socket auth token invalid: %s', err.message);
    }
    return next();
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected: %s', socket.id);

    socket.on('subscribe:room', (roomId) => {
      if (typeof roomId === 'string' && roomId.trim()) {
        socket.join(roomChannel(roomId));
      }
    });

    socket.on('unsubscribe:room', (roomId) => {
      if (typeof roomId === 'string' && roomId.trim()) {
        socket.leave(roomChannel(roomId));
      }
    });

    socket.on('subscribe:device', (deviceId) => {
      if (typeof deviceId === 'string' && deviceId.trim()) {
        socket.join(deviceChannel(deviceId));
      }
    });

    socket.on('unsubscribe:device', (deviceId) => {
      if (typeof deviceId === 'string' && deviceId.trim()) {
        socket.leave(deviceChannel(deviceId));
      }
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected: %s', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call init(httpServer) first.');
  }
  return io;
}

function emitToRoom(roomId, event, payload) {
  if (!io) return;
  io.to(roomChannel(roomId)).emit(event, payload);
}

function emitToDevice(deviceId, event, payload) {
  if (!io) return;
  io.to(deviceChannel(deviceId)).emit(event, payload);
}

function emitToRoomAndDevice(roomId, deviceId, event, payload) {
  emitToRoom(roomId, event, payload);
  emitToDevice(deviceId, event, payload);
}

module.exports = {
  init,
  getIO,
  emitToRoom,
  emitToDevice,
  emitToRoomAndDevice,
};
