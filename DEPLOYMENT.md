# WebDev Chat - Deployment Guide

## Prerequisites

- Ubuntu 24.04 LTS (or similar)
- Docker & Docker Compose installed
- Nginx installed
- Domain configured: `chat.davidfdzmorilla.dev`
- Ports available: 3006 (app), 5432 (postgres), 6379 (redis), 9000-9001 (minio)

## Environment Setup

1. **Clone the repository**

```bash
git clone https://github.com/davidfdzmorilla/webdev-chat.git
cd webdev-chat
```

2. **Configure environment variables**

```bash
cp .env.example .env.production
```

Edit `.env.production` and set:

```env
DATABASE_URL=postgresql://chat_user:SECURE_PASSWORD@postgres:5432/chat_db
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=SECURE_ACCESS_KEY
MINIO_SECRET_KEY=SECURE_SECRET_KEY
MINIO_BUCKET=chat-files
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=https://chat.davidfdzmorilla.dev
NODE_ENV=production
```

## Deployment Steps

### 1. Build and Start Services

```bash
make deploy
```

Or manually:

```bash
docker compose build
docker compose up -d
docker compose exec app pnpm db:push
```

### 2. Configure Nginx

```bash
sudo cp nginx/chat.conf /etc/nginx/sites-available/chat.davidfdzmorilla.dev
sudo ln -s /etc/nginx/sites-available/chat.davidfdzmorilla.dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Configure SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d chat.davidfdzmorilla.dev
```

### 4. Configure Cloudflare DNS

Create an A record:

- **Type**: A
- **Name**: chat
- **Content**: YOUR_SERVER_IP
- **Proxy**: Enabled (orange cloud)
- **TTL**: Auto

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type":"A",
    "name":"chat",
    "content":"'${SERVER_IP}'",
    "ttl":1,
    "proxied":true
  }'
```

## Verify Deployment

```bash
# Check containers
docker ps | grep chat

# Check logs
docker compose logs -f app

# Test HTTP
curl -I http://localhost:3006

# Test HTTPS
curl -I https://chat.davidfdzmorilla.dev
```

## Maintenance

### View Logs

```bash
make logs
# or
docker compose logs -f app
```

### Restart Services

```bash
make restart
```

### Database Migrations

```bash
docker compose exec app pnpm db:push
```

### Backup Database

```bash
docker compose exec postgres pg_dump -U chat_user chat_db > backup-$(date +%Y%m%d).sql
```

### Update Application

```bash
git pull
make restart
```

## Monitoring

- **App**: http://localhost:3006 (internal)
- **Public**: https://chat.davidfdzmorilla.dev
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001

## Troubleshooting

### Container won't start

```bash
docker compose logs app
docker compose ps
```

### Database connection issues

```bash
docker compose exec postgres psql -U chat_user -d chat_db
```

### WebSocket not connecting

Check Nginx logs:

```bash
sudo tail -f /var/log/nginx/chat.davidfdzmorilla.dev.error.log
```

### Clear all data and restart

```bash
make clean
make deploy
```

## Security Notes

1. Change all default passwords in `.env.production`
2. Use strong `BETTER_AUTH_SECRET`
3. Keep MinIO credentials secure
4. Regular security updates: `sudo apt update && sudo apt upgrade`
5. Monitor logs for suspicious activity
6. Enable firewall: `sudo ufw enable`

## Architecture

```
Internet
   ↓
Cloudflare CDN
   ↓
Nginx (SSL termination)
   ↓
Docker Network
   ├── Next.js App (port 3006)
   ├── PostgreSQL (port 5432)
   ├── Redis (port 6379)
   └── MinIO (ports 9000-9001)
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Next.js Server Actions, Socket.io
- **Database**: PostgreSQL 17 + Drizzle ORM
- **Cache/PubSub**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Auth**: Better-Auth
- **Deployment**: Docker, Nginx, Cloudflare, Let's Encrypt
