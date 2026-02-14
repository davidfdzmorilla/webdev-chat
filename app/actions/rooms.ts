'use server';

import { db } from '@/lib/db';
import { rooms, roomMembers } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface Session {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function createRoom(formData: {
  name: string;
  type: 'public' | 'private';
  description?: string;
}) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as Session | null;

  if (!session) {
    throw new Error('Unauthorized');
  }

  const [room] = await db
    .insert(rooms)
    .values({
      name: formData.name,
      type: formData.type,
      description: formData.description || null,
      createdBy: session.user.id,
    })
    .returning();

  // Add creator as owner
  await db.insert(roomMembers).values({
    roomId: room.id,
    userId: session.user.id,
    role: 'owner',
  });

  revalidatePath('/chat');
  return { success: true, room };
}

export async function getRooms() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as Session | null;

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Get public rooms
  const publicRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.type, 'public'))
    .orderBy(desc(rooms.createdAt));

  // Get user's private rooms
  const userRoomMemberships = await db
    .select({
      room: rooms,
    })
    .from(roomMembers)
    .innerJoin(rooms, eq(roomMembers.roomId, rooms.id))
    .where(eq(roomMembers.userId, session.user.id));

  const privateRooms = userRoomMemberships.map((m) => m.room).filter((r) => r.type === 'private');

  return {
    publicRooms,
    privateRooms,
  };
}

export async function joinRoom(roomId: string) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as Session | null;

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Check if already a member
  const existing = await db
    .select()
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id)))
    .limit(1);

  if (existing.length > 0) {
    return { success: true, message: 'Already a member' };
  }

  await db.insert(roomMembers).values({
    roomId,
    userId: session.user.id,
    role: 'member',
  });

  revalidatePath('/chat');
  return { success: true };
}

export async function leaveRoom(roomId: string) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as Session | null;

  if (!session) {
    throw new Error('Unauthorized');
  }

  await db
    .delete(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id)));

  revalidatePath('/chat');
  return { success: true };
}

export async function getRoomMembers(roomId: string) {
  const members = await db
    .select({
      id: roomMembers.id,
      userId: roomMembers.userId,
      role: roomMembers.role,
      joinedAt: roomMembers.joinedAt,
    })
    .from(roomMembers)
    .where(eq(roomMembers.roomId, roomId));

  return members;
}
