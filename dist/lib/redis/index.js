import { createClient } from 'redis';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({
  url: redisUrl,
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
let isConnected = false;
export async function getRedisClient() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
  }
  return redisClient;
}
// Presence tracking
export async function setUserOnline(userId) {
  const client = await getRedisClient();
  const timestamp = Date.now();
  await client.zAdd('online_users', { score: timestamp, value: userId });
}
export async function setUserOffline(userId) {
  const client = await getRedisClient();
  await client.zRem('online_users', userId);
}
export async function getOnlineUsers() {
  const client = await getRedisClient();
  const now = Date.now();
  const cutoff = now - 60000; // 1 minute ago
  return await client.zRangeByScore('online_users', cutoff, now);
}
// Pub/Sub for WebSocket messages
export async function publishMessage(channel, message) {
  const client = await getRedisClient();
  await client.publish(channel, message);
}
export async function subscribeToChannel(channel, callback) {
  const subscriber = redisClient.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(channel, callback);
  return subscriber;
}
