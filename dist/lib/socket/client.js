'use client';
import { io } from 'socket.io-client';
let socket = null;
export function getSocket() {
  if (!socket) {
    socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    socket.on('connect', () => {
      console.log(
        'WebSocket connected:',
        socket === null || socket === void 0 ? void 0 : socket.id
      );
    });
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }
  return socket;
}
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
