'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket/client';

interface PresenceIndicatorProps {
  userId: string;
}

export default function PresenceIndicator({ userId }: PresenceIndicatorProps) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    socket.on('user_status_changed', (data: { userId: string; status: string }) => {
      if (data.userId === userId) {
        setIsOnline(data.status === 'online');
      }
    });

    return () => {
      socket.off('user_status_changed');
    };
  }, [userId]);

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}
