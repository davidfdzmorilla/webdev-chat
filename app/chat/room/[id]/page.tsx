'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { getMessages, sendMessage } from '@/app/actions/messages';
import { leaveRoom } from '@/app/actions/rooms';

interface Message {
  id: string;
  userId: string;
  content: string;
  type: string;
  createdAt: Date;
  fileUrl: string | null;
  fileName: string | null;
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      loadMessages();
      // Poll for new messages every 3 seconds (will be replaced with WebSocket)
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [session, params.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const msgs = await getMessages(params.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await sendMessage({
        roomId: params.id,
        content: newMessage,
      });
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (confirm('Are you sure you want to leave this room?')) {
      try {
        await leaveRoom(params.id);
        router.push('/chat');
      } catch (error) {
        alert('Failed to leave room');
      }
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/chat')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Room Chat</h1>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Leave Room
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.userId === session.user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg ${
                  msg.userId === session.user.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900'
                }`}
              >
                <p className="text-sm break-words">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
