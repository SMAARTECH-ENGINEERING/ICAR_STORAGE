import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getSocketBaseUrl, getToken } from "./config";

// Event names match the server's Socket.IO contract exactly
// (server/src/services/*.js -> socketService.emitToRoomAndDevice calls).
const ROOM_EVENTS = [
  "device:telemetry",
  "device:online",
  "device:offline",
  "relay:stateChanged",
  "relay:command",
  "alert:created",
  "alert:resolved",
];

// Subscribes to room:{roomId} and forwards named events to the latest
// version of `handlers` without re-connecting the socket on every render.
export function useRoomSocket(roomId, handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!roomId) return undefined;

    const socket = io(getSocketBaseUrl(), {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
    });

    socket.emit("subscribe:room", roomId);

    const listeners = ROOM_EVENTS.map((event) => {
      const listener = (payload) => {
        const handler =
          handlersRef.current?.[event] || handlersRef.current?.onAny;
        if (handler) handler(payload, event);
      };
      socket.on(event, listener);
      return [event, listener];
    });

    return () => {
      listeners.forEach(([event, listener]) => socket.off(event, listener));
      socket.emit("unsubscribe:room", roomId);
      socket.disconnect();
    };
  }, [roomId]);
}
