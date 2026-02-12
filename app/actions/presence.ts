'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { setUserOnline, setUserOffline, getOnlineUsers } from '@/lib/redis';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface Session {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function updatePresence(status: 'online' | 'offline') {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as Session | null;

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (status === 'online') {
    await setUserOnline(session.user.id);
  } else {
    await setUserOffline(session.user.id);
  }

  // Update database status
  await db
    .update(users)
    .set({
      status,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

export async function getOnlineUsersList() {
  const onlineUserIds = await getOnlineUsers();
  return onlineUserIds;
}
