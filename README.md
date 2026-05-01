# ChatterBox

A real-time chat application with 1-on-1 and group conversations, message status tracking, typing indicators, and online/offline presence.

## Stack

- **Backend:** Node.js, Express, Socket.IO, Prisma ORM, PostgreSQL
- **Frontend:** React, Vite, Tailwind CSS, Zustand, Socket.IO Client
- **Auth:** JWT (access + refresh tokens), OAuth (Google, GitHub)

## Features

- 1-on-1 and group conversations
- Real-time messaging via WebSockets
- Message status: sent (single check), delivered (double check), read (blue double check)
- Typing indicators ("user is typing...")
- Online/offline presence with "last seen" timestamps
- User search and group creation
- Cursor-based message pagination
- Responsive layout (sidebar collapses on mobile)

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Podman/Docker to run it)

### 1. Start PostgreSQL

Using Podman:

```bash
podman run -d --name chatterbox-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=chatterbox \
  -p 5432:5432 \
  docker.io/library/postgres:16-alpine
```

Or Docker:

```bash
docker run -d --name chatterbox-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=chatterbox \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — update DATABASE_URL if your PostgreSQL port differs
```

### 3. Install dependencies

```bash
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### 4. Set up database

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts   # Creates demo users
cd ..
```

### 5. Start servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

### Demo accounts (password: `password123`)

| User    | Email               |
|---------|---------------------|
| alice   | alice@example.com   |
| bob     | bob@example.com     |
| charlie | charlie@example.com |
| diana   | diana@example.com   |

## Docker Compose

```bash
cp .env.example .env
docker compose up
```

This starts PostgreSQL, backend, and frontend. Open http://localhost:5173.

## Project Structure

```
chatterbox/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── prisma/schema.prisma    # Database schema
│   ├── prisma/seed.ts          # Demo data
│   └── src/
│       ├── config/             # Env, Passport, DB
│       ├── middleware/         # Auth, validation, errors
│       ├── routes/             # REST endpoints
│       ├── services/           # Business logic
│       ├── socket/             # Socket.IO handlers
│       └── utils/              # Logger, error classes
├── frontend/
│   └── src/
│       ├── api/                # Axios client
│       ├── socket/             # Socket.IO client
│       ├── store/              # Zustand stores
│       ├── hooks/              # useSocket, useChat, usePushNotifications
│       ├── pages/              # Login, Chat, OAuthCallback
│       └── components/         # UI components
├── docker-compose.scaled.yml   # Multi-instance backend behind nginx
└── nginx.conf                  # Sticky-session reverse proxy for scaled mode
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Register with email/password
- `POST /api/auth/login` — Login, returns JWT tokens
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/google` — Google OAuth redirect
- `GET /api/auth/github` — GitHub OAuth redirect

### Users
- `GET /api/users/me` — Current user profile
- `GET /api/users/search?q=` — Search users by username/email
- `PATCH /api/users/me` — Update profile

### Conversations
- `POST /api/conversations` — Create 1-on-1 or group
- `GET /api/conversations` — List conversations with last message
- `GET /api/conversations/:id` — Conversation details
- `POST /api/conversations/:id/participants` — Add member (group admin)
- `DELETE /api/conversations/:id/participants/:userId` — Remove member

### Messages
- `GET /api/conversations/:id/messages?cursor=&limit=` — Paginated messages
- `POST /api/conversations/:id/messages` — Send message

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client -> Server | Send a message |
| `message:new` | Server -> Client | New message received |
| `message:delivered` | Client -> Server | Acknowledge delivery |
| `message:read` | Client -> Server | Mark messages as read |
| `message:status` | Server -> Client | Status update (delivered/read) |
| `typing:start` | Client -> Server | User started typing |
| `typing:stop` | Client -> Server | User stopped typing |
| `typing:start` | Server -> Client | Broadcast typing to room |
| `typing:stop` | Server -> Client | Broadcast stop typing |
| `user:online` | Server -> Client | User came online |
| `user:offline` | Server -> Client | User went offline |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for access tokens (min 10 chars) | — |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 10 chars) | — |
| `JWT_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | `7d` |
| `PORT` | Backend port | `3001` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | — (optional) |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | — (optional) |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | — (optional) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | — (optional) |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback URL | — (optional) |
| `REDIS_URL` | Redis connection string (enables horizontal scale, queues, presence) | — (optional) |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key | — (optional) |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key | — (optional) |
| `VAPID_SUBJECT` | Web Push subject (`mailto:you@example.com`) | — (optional) |
| `VITE_API_URL` | Frontend → backend API URL | inferred from window.location |
| `VITE_SOCKET_URL` | Frontend → backend Socket.IO URL | inferred from window.location |
