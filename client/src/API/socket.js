import { io } from "socket.io-client";

let socket;

// In Docker: the client is served by Nginx on port 3000.
// Nginx proxies /socket.io/ → server:5000, so we connect to window.location.origin (same host/port).
// In Vite dev: window.location.origin is localhost:5173, but Vite does NOT proxy WebSockets
// on /socket.io automatically, so we connect directly to localhost:5000.
const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? window.location.origin   // Docker: same-origin → Nginx → server:5000
  : "http://backend-service:5000"); // Dev: direct to backend

export const connectSocket = () => {
  if (!socket || socket.disconnected) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      path: "/socket.io/",
    });
    socket.on("connect", () =>
      console.log("[Socket] Connected:", socket.id, "→", SOCKET_URL)
    );
    socket.on("connect_error", (err) =>
      console.error("[Socket] Connection error:", err.message)
    );
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
