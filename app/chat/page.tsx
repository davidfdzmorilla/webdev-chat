'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth/client';
import { createRoom, getRooms, joinRoom } from '../actions/rooms';

interface Room {
  id: string;
  name: string;
  type: string;
  description: string | null;
  createdAt: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [privateRooms, setPrivateRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      loadRooms();
    }
  }, [session]);

  const loadRooms = async () => {
    try {
      const { publicRooms: pub, privateRooms: priv } = await getRooms();
      setPublicRooms(pub);
      setPrivateRooms(priv);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createRoom({
        name: newRoomName,
        type: newRoomType,
        description: newRoomDescription,
      });

      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomDescription('');
      loadRooms();
    } catch (error) {
      alert('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      loadRooms();
    } catch (error) {
      alert('Failed to join room');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (isPending) {
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">WebDev Chat</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Hello, {session.user.name}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Create Room Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            + Create Room
          </button>
        </div>

        {/* Rooms Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Public Rooms */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Public Rooms</h2>
            <div className="space-y-3">
              {publicRooms.map((room) => (
                <div key={room.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  {room.description && (
                    <p className="text-gray-600 text-sm mt-1">{room.description}</p>
                  )}
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Join Room
                  </button>
                </div>
              ))}
              {publicRooms.length === 0 && (
                <p className="text-gray-500 text-center py-8">No public rooms yet</p>
              )}
            </div>
          </div>

          {/* Private Rooms */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Private Rooms</h2>
            <div className="space-y-3">
              {privateRooms.map((room) => (
                <div key={room.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  {room.description && (
                    <p className="text-gray-600 text-sm mt-1">{room.description}</p>
                  )}
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    Open Room
                  </button>
                </div>
              ))}
              {privateRooms.length === 0 && (
                <p className="text-gray-500 text-center py-8">No private rooms yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="General"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value as 'public' | 'private')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="What is this room about?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
