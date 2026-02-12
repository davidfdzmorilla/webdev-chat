import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { publishMessage, subscribeToChannel } from '../redis';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
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

    // Join room
    socket.on('join_room', async (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);

      // Subscribe to Redis channel for this room
      const subscriber = await subscribeToChannel(`room:${roomId}`, (message) => {
        const data = JSON.parse(message);
        io?.to(roomId).emit('new_message', data);
      });

      socket.data.subscriber = subscriber;
    });

    // Send message
    socket.on(
      'send_message',
      async (data: { roomId: string; message: Record<string, unknown> }) => {
        // Publish to Redis so all instances receive it
        await publishMessage(`room:${data.roomId}`, JSON.stringify(data.message));
      }
    );

    // Typing indicator
    socket.on('typing', (data: { roomId: string; userId: string; userName: string }) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: data.userId,
        userName: data.userName,
      });
    });

    socket.on('stop_typing', (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit('user_stop_typing', {
        userId: data.userId,
      });
    });

    // Leave room
    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      if (socket.data.subscriber) {
        await socket.data.subscriber.quit();
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
