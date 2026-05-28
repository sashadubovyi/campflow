# 🏕️ CampFlow

> **Asana for vacations** — turn the chaos of group-trip discussions into a clear, agreed-upon plan.

CampFlow is a collaborative trip-planning web app. Friends create a private room, chat in real time, vote on dates / destinations / packing lists / map locations, and an admin locks the agreed choices into a **Final Plan**. An AI assistant generates packing checklists and flags duplicate polls. When a trip is over, the room is automatically cleaned up — leaving only a tiny memory in each participant's profile.

This is a portfolio project built to demonstrate full-stack engineering: a modular NestJS backend, real-time WebSockets, a relational data model with transactions, scheduled background jobs, and a graceful LLM integration.

---

## ✨ Features

- **🔐 Authentication** — JWT access/refresh tokens with rotation, bcrypt password hashing, httpOnly refresh cookies, server-side session revocation.
- **👤 Profiles** — full name, email, optional phone, avatar (generated from initials when none is set), interface locale.
- **🚪 Private rooms** — invite-only access via short codes or invite links. Room creator becomes admin. Member / admin roles.
- **💬 Real-time chat** — Socket.IO with JWT handshake auth, presence, typing indicators, message history with cursor-based pagination.
- **🗳️ Polls (3 types)** with live results and an _"X of Y voted"_ progress bar:
  - **Single choice** — dates, destinations (one vote per user).
  - **Multiple choice** — packing checklists, with the ability to assign an item to a specific participant ("Bob brings the tent").
  - **Location** — pick points on an OpenStreetMap; each participant can propose a point, then the group votes.
- **✅ Final Plan** — the admin approves a poll; winning options snapshot into a permanent plan (including map coordinates). Polls can be reopened for re-voting.
- **🌍 Internationalization** — Ukrainian (default), English, Russian. The AI responds in the user's current interface language.
- **🤖 AI assistant (Google Gemini)** — generates packing checklists from a free-text trip description and detects semantically duplicate polls. Called only on key actions (not on every interaction) to stay within the free tier, with a graceful fallback when the AI is unavailable.
- **♻️ Room lifecycle** — automatic cleanup of abandoned rooms via a daily cron job, an in-chat warning before deletion, and a lightweight "event memory" preserved in each participant's profile after the room is gone.

---

## 🛠️ Tech Stack

### Backend

| Area                | Technology                                            |
| ------------------- | ----------------------------------------------------- |
| Runtime / Framework | Node.js 20, **NestJS 10** (TypeScript)                |
| Database            | **PostgreSQL 16**                                     |
| ORM                 | **Prisma 6** (type-safe queries, SQL migrations)      |
| Real-time           | **Socket.IO** (WebSocket gateway with JWT auth)       |
| Caching / pub-sub   | **Redis 7**                                           |
| Auth                | JWT (access + refresh), Passport, bcrypt              |
| Scheduling          | `@nestjs/schedule` (cron)                             |
| AI                  | **Google Gemini 2.5 Flash** (`@google/generative-ai`) |
| Validation          | class-validator / class-transformer                   |

### Frontend

| Area         | Technology                                |
| ------------ | ----------------------------------------- |
| Framework    | **React 18 + Vite** (TypeScript)          |
| Styling      | **Tailwind CSS**                          |
| Server state | TanStack Query _(planned)_                |
| Client state | Zustand _(planned)_                       |
| Routing      | React Router _(planned)_                  |
| Maps         | React-Leaflet + OpenStreetMap _(planned)_ |
| i18n         | react-i18next _(planned)_                 |

### Infrastructure

- **pnpm workspaces** monorepo
- **Docker Compose** — PostgreSQL + Redis
- **GitHub Codespaces** dev container

---

## 📂 Project Structure

```
campflow/
├── .devcontainer/            # GitHub Codespaces config
├── docker-compose.yml        # PostgreSQL + Redis
├── pnpm-workspace.yaml
├── tsconfig.base.json        # shared TS config
│
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/             # JWT auth, guards, strategies
│   │       ├── users/            # profiles
│   │       ├── rooms/            # private rooms, invites, roles
│   │       ├── chat/             # real-time chat (gateway + REST history)
│   │       ├── polls/            # single / multi / location polls + voting
│   │       ├── final-plan/       # poll approval & final plan snapshots
│   │       ├── room-lifecycle/   # cron cleanup, manual close, event memories
│   │       ├── ai/               # Gemini integration (checklist, duplicates, summaries)
│   │       └── prisma/           # PrismaService
│   │
│   └── frontend/             # React + Vite + Tailwind
│       └── src/
│
└── packages/                 # shared types (planned)
```

---

## 🗄️ Data Model (overview)

| Table              | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `users`            | accounts, profile, locale                                     |
| `refresh_tokens`   | hashed refresh tokens for rotation / revocation               |
| `rooms`            | private rooms, invite codes, status, lifecycle timestamps     |
| `room_members`     | user ↔ room membership + role (admin/member)                  |
| `messages`         | chat messages (text / system)                                 |
| `polls`            | polls (type: single_choice / multi_choice / location, status) |
| `poll_options`     | options — label, coordinates, assignee                        |
| `poll_votes`       | individual votes (unique per option/user)                     |
| `final_plan_items` | approved, snapshotted plan entries                            |
| `event_memories`   | tiny post-event reminder kept on each profile                 |
| `ai_interactions`  | log/cache of Gemini calls                                     |

Foreign keys use `ON DELETE CASCADE` so that deleting a room automatically removes its chat, polls, options, votes, and plan in a single operation.

---

## 🔄 Room Lifecycle Logic

A room is deleted by the **earliest** of these conditions:

| Situation         | Deleted when               |
| ----------------- | -------------------------- |
| Has an event date | `eventDate + 2 days`       |
| No event date     | `lastActivityAt + 15 days` |

- **Activity** = a new message, a vote, creating a poll, or a member joining (a plain page view does _not_ count).
- A daily cron job (03:00) runs in batches: it posts an in-chat warning **2 days before** deletion, then deletes expired rooms.
- Before deletion (or on manual close by an admin), an AI summary is generated, chat is cleared, and a small `event_memory` (event name, date, participants) is saved to each member's profile.

This keeps the database lean at scale: abandoned rooms self-clean, while active ones live as long as they're used.

---

## 🤖 AI Design (cost-aware)

Gemini is **not** called on every action. It runs only at high-value moments to respect the free tier:

1. **On demand** — user requests a packing checklist from a trip description.
2. **On poll creation** — optional duplicate-poll check.
3. **On room close** — a warm event summary.

Every AI method has a **graceful fallback**: if the key is missing or quota is exceeded, the app returns a sensible default instead of crashing. The AI always responds in the user's interface language (uk / en / ru).

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker (for PostgreSQL + Redis)

### 1. Clone & install

```bash
git clone https://github.com/sashadubovyi/campflow.git
cd campflow
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d        # PostgreSQL + Redis
```

### 3. Configure environment

Create `apps/backend/.env.local`:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://campflow:campflow@localhost:5432/campflow?schema=public
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace_with_long_random_string
JWT_REFRESH_SECRET=replace_with_another_long_random_string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
GEMINI_API_KEY=your_gemini_api_key   # optional — app works without it
```

Prisma also needs `apps/backend/.env` with just the `DATABASE_URL` line.

### 4. Run migrations

```bash
cd apps/backend
pnpm exec prisma migrate dev
cd ../..
```

### 5. Start the apps

```bash
# Terminal 1 — backend (http://localhost:3001/api)
pnpm --filter @campflow/backend dev

# Terminal 2 — frontend (http://localhost:5173)
pnpm --filter @campflow/frontend dev
```

Health check: `GET http://localhost:3001/api/health`

---

## 📡 API Overview

### Auth

| Method | Endpoint             | Description                                          |
| ------ | -------------------- | ---------------------------------------------------- |
| POST   | `/api/auth/register` | Register, returns access token + sets refresh cookie |
| POST   | `/api/auth/login`    | Login                                                |
| POST   | `/api/auth/refresh`  | Rotate tokens                                        |
| POST   | `/api/auth/logout`   | Revoke refresh token                                 |
| GET    | `/api/auth/me`       | Current user (from JWT)                              |

### Users

| Method | Endpoint        | Description                  |
| ------ | --------------- | ---------------------------- |
| GET    | `/api/users/me` | Full profile                 |
| PATCH  | `/api/users/me` | Update name / phone / locale |

### Rooms

| Method | Endpoint                           | Description                   |
| ------ | ---------------------------------- | ----------------------------- |
| GET    | `/api/rooms`                       | My rooms                      |
| POST   | `/api/rooms`                       | Create room (creator = admin) |
| POST   | `/api/rooms/join`                  | Join by invite code           |
| GET    | `/api/rooms/:id`                   | Room details + members        |
| PATCH  | `/api/rooms/:id`                   | Update (admin)                |
| POST   | `/api/rooms/:id/regenerate-invite` | New invite code (admin)       |
| POST   | `/api/rooms/:id/close`             | Close room (admin)            |

### Chat

| Method | Endpoint                      | Description                                                    |
| ------ | ----------------------------- | -------------------------------------------------------------- |
| GET    | `/api/rooms/:roomId/messages` | History (cursor pagination)                                    |
| _WS_   | `/ws`                         | `room:join`, `message:send`, `typing:start/stop`, `presence:*` |

### Polls

| Method | Endpoint                              | Description                  |
| ------ | ------------------------------------- | ---------------------------- |
| POST   | `/api/polls`                          | Create single-choice poll    |
| POST   | `/api/polls/multi`                    | Create multi-choice poll     |
| POST   | `/api/polls/location`                 | Create location poll         |
| GET    | `/api/polls/room/:roomId`             | All polls in a room          |
| POST   | `/api/polls/:id/vote`                 | Vote (single / location)     |
| POST   | `/api/polls/:id/toggle-vote`          | Toggle vote (multi)          |
| POST   | `/api/polls/:id/location-option`      | Add a map point              |
| POST   | `/api/polls/options/:optionId/assign` | Assign item to user          |
| POST   | `/api/polls/:id/close` / `/reopen`    | Close / reopen (admin)       |
| POST   | `/api/polls/:id/approve`              | Approve → Final Plan (admin) |

### Final Plan & AI

| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/api/rooms/:roomId/final-plan` | Approved plan (grouped)    |
| POST   | `/api/ai/checklist`             | Generate packing checklist |
| POST   | `/api/ai/check-duplicate`       | Detect duplicate poll      |

---

## 🗺️ Roadmap

- [x] Backend: auth, profiles, rooms, chat, polls, final plan, lifecycle, AI
- [ ] Frontend: auth UI (login / register)
- [ ] Frontend: three-panel room layout (20vw / 60vw / 20vw)
- [ ] Frontend: real-time chat
- [ ] Frontend: polls UI + OpenStreetMap (React-Leaflet)
- [ ] Frontend: i18n (3 languages)
- [ ] Frontend: AI assistant buttons
- [ ] Deployment (Vercel + Railway/Render)

---

## 📄 License

MIT
