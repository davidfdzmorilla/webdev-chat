import { Server as SocketIOServer } from 'socket.io';
import { publishMessage, subscribeToChannel } from '../redis';
let io = null;
export function initSocketServer(httpServer) {
  if (io) {
    return io;
  }
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
      credentials: true,
    },
  });
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // User presence
    socket.on('user_online', (userId) => {
      socket.data.userId = userId;
      io.emit('user_status_changed', { userId, status: 'online' });
    });
    // Join room
    socket.on('join_room', async (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      // Subscribe to Redis channel for this room
      const subscriber = await subscribeToChannel(`room:${roomId}`, (message) => {
        const data = JSON.parse(message);
        io === null || io === void 0 ? void 0 : io.to(roomId).emit('new_message', data);
      });
      socket.data.subscriber = subscriber;
    });
    // Send message
    socket.on('send_message', async (data) => {
      // Publish to Redis so all instances receive it
      await publishMessage(`room:${data.roomId}`, JSON.stringify(data.message));
    });
    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: data.userId,
        userName: data.userName,
      });
    });
    socket.on('stop_typing', (data) => {
      socket.to(data.roomId).emit('user_stop_typing', {
        userId: data.userId,
      });
    });
    // Leave room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });
    // Disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      if (socket.data.subscriber) {
        await socket.data.subscriber.quit();
      }
      if (socket.data.userId) {
        io.emit('user_status_changed', {
          userId: socket.data.userId,
          status: 'offline',
        });
      }
    });
  });
  return io;
}
export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
