# WebDev Chat

A production-ready real-time chat platform built with Next.js 15, Socket.io, PostgreSQL, and Redis.

## Features

- ✅ Real-time messaging with Socket.io
- ✅ Public and private chat rooms
- ✅ User authentication with Better-Auth
- ✅ Online/offline presence indicators
- ✅ WebSocket events with Redis pub/sub for horizontal scaling
- ✅ Message history and persistence
- ✅ Responsive UI with Tailwind CSS 4
- ✅ Docker containerized deployment
- ✅ TypeScript strict mode
- ✅ Production-ready with SSL

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Backend**: Next.js Server Actions, Socket.io 4.8, Node.js 22
- **Database**: PostgreSQL 17 with Drizzle ORM
- **Cache/PubSub**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Auth**: Better-Auth (email/password)
- **Deployment**: Docker, Docker Compose, Nginx, Let's Encrypt

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Start development server
pnpm dev
```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

```bash
# Build and start with Docker
make deploy

# Or manually
docker compose up -d
```

## Project Structure

```
webdev-chat/
├── app/
│   ├── actions/          # Server actions
│   │   ├── messages.ts
│   │   ├── presence.ts
│   │   └── rooms.ts
│   ├── api/
│   │   └── auth/         # Better-Auth routes
│   ├── auth/             # Auth pages
│   │   ├── login/
│   │   └── signup/
│   └── chat/             # Chat pages
│       ├── page.tsx      # Room list
│       └── room/[id]/    # Chat room
├── components/           # React components
│   └── PresenceIndicator.tsx
├── lib/
│   ├── auth/             # Auth configuration
│   ├── db/               # Database schema & client
│   ├── redis/            # Redis client
│   ├── s3/               # MinIO/S3 client
│   └── socket/           # Socket.io client & server
├── nginx/                # Nginx configuration
├── drizzle/              # Database migrations
├── docker-compose.yml
├── Dockerfile
├── Makefile
└── server.ts             # Custom Socket.io server
```

## Database Schema

### Core Tables

- **users**: User accounts (Better-Auth)
- **sessions**: Active sessions
- **rooms**: Chat rooms (public/private)
- **room_members**: Room membership
- **messages**: Chat messages with timestamps
- **message_reactions**: Message reactions
- **direct_messages**: 1-on-1 messages

## API Endpoints

### Authentication

- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session

### WebSocket Events

**Client → Server**

- `join_room` - Join a chat room
- `leave_room` - Leave a room
- `send_message` - Send a message
- `typing` - Typing indicator
- `stop_typing` - Stop typing
- `user_online` - User goes online

**Server → Client**

- `new_message` - New message received
- `user_typing` - User is typing
- `user_stop_typing` - User stopped typing
- `user_status_changed` - User online/offline status

## Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker & Docker Compose (for local PostgreSQL, Redis, MinIO)

### Environment Variables

```env
DATABASE_URL=postgresql://chat_user:chat_password@localhost:5432/chat_db
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=chat-files
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development
```

### Commands

```bash
# Development
pnpm dev              # Start dev server with tsx watch
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio

# Docker
make build            # Build Docker images
make start            # Start containers
make stop             # Stop containers
make restart          # Restart containers
make logs             # View logs
make deploy           # Full deployment
make clean            # Remove all containers and volumes
```

## Architecture

### Real-Time Messaging

1. Client sends message via server action → saves to PostgreSQL
2. Server action returns message with ID
3. Client emits `send_message` via WebSocket
4. Server publishes to Redis channel `room:{roomId}`
5. All server instances subscribed to Redis receive message
6. Each instance emits `new_message` to clients in that room
7. Clients receive and display message instantly

### Presence System

- Redis sorted set tracks online users with timestamp
- 60-second TTL for presence (updates on activity)
- WebSocket events broadcast status changes
- Database stores last seen timestamp

## Deployment

Deployed at: **https://chat.davidfdzmorilla.dev**

- **Host**: Hetzner CX32 VPS (Ubuntu 24.04 ARM64)
- **Reverse Proxy**: Nginx with Let's Encrypt SSL
- **CDN**: Cloudflare (proxied, SSL/TLS Full)
- **Container**: Docker multi-stage build
- **Database**: PostgreSQL 17 in Docker
- **Cache**: Redis 7 in Docker
- **Storage**: MinIO in Docker

## Quality Gates

✅ All passing:

- TypeScript strict mode: Zero errors
- ESLint: Zero warnings
- Prettier: Formatted
- Git hooks: Husky + lint-staged + commitlint
- Conventional Commits enforced
- Docker build: Success

## License

MIT

## Author

David Fernández ([@davidfdzmorilla](https://github.com/davidfdzmorilla))

## Links

- **Live App**: https://chat.davidfdzmorilla.dev
- **GitHub**: https://github.com/davidfdzmorilla/webdev-chat
- **Portfolio**: https://webdev.davidfdzmorilla.dev
