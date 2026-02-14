'use server';

import { db } from '@/lib/db';
import { messages, roomMembers } from '@/lib/db/schema';
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

export async function sendMessage(formData: {
  roomId: string;
  content: string;
  type?: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as Session | null;

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Verify user is member of room
  const membership = await db
    .select()
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, formData.roomId), eq(roomMembers.userId, session.user.id)))
    .limit(1);

  if (membership.length === 0) {
    throw new Error('Not a member of this room');
  }

  const [message] = await db
    .insert(messages)
    .values({
      roomId: formData.roomId,
      userId: session.user.id,
      content: formData.content,
      type: formData.type || 'text',
      fileUrl: formData.fileUrl || null,
      fileName: formData.fileName || null,
      fileSize: formData.fileSize || null,
    })
    .returning();

  revalidatePath(`/chat/room/${formData.roomId}`);
  return { success: true, message };
}

export async function getMessages(roomId: string, limit = 50) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as Session | null;

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Verify user is member of room
  const membership = await db
    .select()
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id)))
    .limit(1);

  if (membership.length === 0) {
    throw new Error('Not a member of this room');
  }

  const roomMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return roomMessages.reverse();
}

export async function deleteMessage(messageId: string) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as Session | null;

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Verify user owns the message
  const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);

  if (!message || message.userId !== session.user.id) {
    throw new Error('Unauthorized to delete this message');
  }

  await db.delete(messages).where(eq(messages.id, messageId));

  revalidatePath(`/chat/room/${message.roomId}`);
  return { success: true };
}
