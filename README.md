# 🏕️ CampFlow

> **A social platform for organizing group trips and events.**
> Real-time chat, polls, maps, and a final shared plan — built on a serious full-stack architecture.

CampFlow started as "Asana for vacations" and grew into a full social platform for planning shared adventures with friends. A group creates a private room, talks in real time, votes on dates / destinations / packing lists / map locations, and an admin locks the agreed choices into a **Final Plan**. After the event, the room is automatically cleaned up — leaving a small memory in each participant's profile.

This is a portfolio project built to demonstrate full-stack engineering at a mid-level depth: a modular NestJS backend, real-time WebSockets, a relational data model with transactions and cron jobs, an LLM integration with graceful fallback, and a polished React frontend with maps, presence, and field-level privacy.

---

## ✨ Features

### Working today
- **🔐 Authentication** — JWT access/refresh with rotation, bcrypt, httpOnly refresh cookies, server-side session revocation.
- **👤 User profiles** — unique `@username` generated from email at registration. Public profile pages (`/u/:username`) with **field-level privacy** (every contact field is `public` / `contacts only` / `hidden` independently).
- **🚪 Private rooms** — invite by short code or shareable link with auto-join, admin/member roles, soft delete.
- **💬 Real-time chat** — Socket.IO with JWT handshake, message history (cursor pagination), typing indicators, presence.
- **🟢 Online presence** — avatars show online state via a colored ring and brightness; offline members show "last seen X ago".
- **🗳️ Polls (3 types)** with optimistic UI, live `X of Y voted` progress, and real-time updates:
  - **Single choice** — dates, destinations (one vote per user).
  - **Multiple choice** — packing checklists, with the ability to assign an item to a participant.
  - **Location** — pick points on an interactive **OpenStreetMap** (Leaflet); each participant proposes points, the group votes.
- **🗺️ Maps** — click-to-add points with **Nominatim reverse-geocoding**, vote-count markers, winner highlighted.
- **✅ Final Plan** — admin approves winning options; results snapshot into a permanent plan with coordinates intact.
- **🤖 AI assistant (Google Gemini 2.5 Flash)** — generates packing checklists from a free-text trip description, detects semantic duplicates among polls, summarizes events on room close. Called **only at high-value moments** to respect the free tier, with a graceful fallback when AI is unavailable.
- **♻️ Room lifecycle** — daily cron cleanup (event date + 2 days, or 15 days of inactivity), in-chat warning two days before deletion, automatic memory snapshot to participants' profiles.

### Coming next
- **📒 Contacts ("friends without consent")** — personal address book; one-sided, no approval needed.
- **📩 Room invites by username** with a dedicated notifications center.
- **🛡️ Field-level privacy editor + user blocking** — control who sees what, who can invite you, who is blocked.
- **🌍 Internationalization** — Ukrainian, English, Russian (UI + AI responses).
- **🚀 Deployment** — Vercel + Railway with a live demo.

---

## 🛠️ Tech Stack

### Backend
| Area | Technology |
|------|-----------|
| Runtime / Framework | Node.js 20, **NestJS 10** (TypeScript) |
| Database | **PostgreSQL 16** with `citext` extension |
| ORM | **Prisma 6** (type-safe queries, SQL migrations) |
| Real-time | **Socket.IO** (WebSocket gateway with JWT auth) |
| Cache | **Redis 7** |
| Auth | JWT (access + refresh), Passport, bcrypt |
| Scheduling | `@nestjs/schedule` (cron) |
| AI | **Google Gemini 2.5 Flash** (`@google/generative-ai`) |
| Validation | class-validator / class-transformer |

### Frontend
| Area | Technology |
|------|-----------|
| Framework | **React 18 + Vite** (TypeScript, strict mode) |
| Styling | **Tailwind CSS** with a custom `forest` + `ember` theme |
| Server state | **TanStack Query** (with WS-driven cache invalidation) |
| Client state | **Zustand** (auth/session) |
| Routing | React Router v6 (protected routes) |
| Forms | react-hook-form + `useFieldArray` for dynamic option lists |
| Maps | **React-Leaflet** + OpenStreetMap tiles |
| Geocoding | Nominatim (OSM) for reverse-geocoding |
| Real-time | socket.io-client (presence, chat, polls) |

### Infrastructure
- **pnpm workspaces** monorepo
- **Docker Compose** — PostgreSQL + Redis
- **GitHub Codespaces**-ready dev container

---

## 📂 Project Structure

```
campflow/
├── docker-compose.yml             # PostgreSQL + Redis
├── pnpm-workspace.yaml
├── apps/
│   ├── backend/                   # NestJS API
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/              # JWT auth, guards, strategies
│   │       ├── users/             # profiles, public profile, field-level privacy
│   │       ├── rooms/             # private rooms, invites, roles
│   │       ├── chat/              # WebSocket gateway + REST history
│   │       ├── polls/             # single / multi / location polls + voting
│   │       ├── final-plan/        # poll approval, plan snapshots
│   │       ├── room-lifecycle/    # cron cleanup, manual close, event memories
│   │       ├── ai/                # Gemini integration (checklist, duplicates, summaries)
│   │       ├── presence/          # in-memory online status
│   │       └── prisma/            # PrismaService
│   │
│   └── frontend/                  # React + Vite + Tailwind
│       └── src/
│           ├── app/               # router, ProtectedRoute
│           ├── pages/             # rooms, profile, auth pages
│           ├── shared/
│           │   ├── api/           # axios client, REST + WS hooks
│           │   ├── socket/        # singleton socket.io-client
│           │   ├── store/         # Zustand auth store
│           │   ├── lib/           # helpers (relative time)
│           │   └── ui/            # Avatar, map components
│           ├── App.tsx
│           └── main.tsx
```

---

## 🗄️ Data Model (highlights)

| Table | Purpose |
|-------|---------|
| `users` | account, public profile (bio, city, birthDate, gender, hobbies), all contact fields, **field-level visibility settings**, invite-policy, `lastSeenAt` |
| `refresh_tokens` | hashed refresh tokens with rotation / revocation |
| `rooms` | private rooms, invite codes, status, lifecycle timestamps |
| `room_members` | user ↔ room with `admin` / `member` role |
| `messages` | chat messages (`text` / `system`) |
| `polls` | polls with type (`single_choice` / `multi_choice` / `location`), status, assignment toggle |
| `poll_options` | label, coordinates (`Decimal(9,6)`), address, optional assignee |
| `poll_votes` | individual votes (unique per option × user) |
| `final_plan_items` | snapshotted approved plan entries (preserves data even if poll is reopened) |
| `event_memories` | per-user memory after the room is gone |
| `ai_interactions` | log/cache of every Gemini call |

All foreign keys use `ON DELETE CASCADE` from the room — deleting a room atomically removes its chat, polls, options, votes, and plan.

---

## 🔄 Room Lifecycle

A room is automatically deleted by the **earliest** of these conditions:

| Condition | Deleted when |
|-----------|--------------|
| Has an event date | `eventDate + 2 days` |
| No event date | `lastActivityAt + 15 days` |

**Activity** = a new message, a vote, creating a poll, or a member joining (mere page views don't count).

A daily cron job (03:00) posts an in-chat warning **2 days before** deletion and removes expired rooms. Before deletion (or on manual close by an admin), an AI summary is generated, the chat is cleared, and a small memory (event name, date, participants) is saved to each member's profile.

This keeps the database lean at scale: abandoned rooms self-clean while active ones live as long as they're used.

---

## 🔐 Field-Level Privacy

Every contact field on a user profile (`email`, `phone`, `telegram`, `whatsapp`, `instagram`, `facebook`) has its **own visibility setting**:

- **Public** — visible to everyone.
- **Contacts only** — visible only to users who added this person to their contacts (Block 9, in progress).
- **Hidden** — not shown at all, not even the field label.

The backend enforces this per-field on every public profile request. The UI honors it transparently — hidden fields simply don't render.

> This is one of the design choices that makes CampFlow feel like a real product rather than a toy demo: each user owns their data without all-or-nothing decisions.

---

## 🤖 AI Design (cost-aware)

Gemini is **not** called on every action. It runs only at high-value moments to respect the free tier:

1. **On demand** — the user requests a packing checklist from a trip description.
2. **On poll creation** — optional duplicate-poll detection.
3. **On room close** — a warm event summary.

Every AI method has a **graceful fallback**: missing API key or quota errors return a sensible default instead of crashing. The AI always responds in the user's current interface language (`uk` / `en` / `ru`).

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
docker compose up -d
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
Prisma also needs `apps/backend/.env` containing just `DATABASE_URL`.

### 4. Run migrations
```bash
cd apps/backend
pnpm exec prisma migrate dev
cd ../..
```

### 5. Start the apps
```bash
# Terminal 1 — backend  (http://localhost:3001/api)
pnpm --filter @campflow/backend dev

# Terminal 2 — frontend (http://localhost:5173)
pnpm --filter @campflow/frontend dev
```

Health check: `GET http://localhost:3001/api/health`.

---

## 📡 API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register, returns access token + sets refresh cookie |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/me` | Current user (from JWT) |

### Users & Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Full profile of current user |
| PATCH | `/api/users/me` | Update name / phone / locale |
| GET | `/api/users/lookup?username=...` | Find a user by username |
| GET | `/api/users/:username` | Public profile (with field-level privacy applied) |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | My rooms |
| POST | `/api/rooms` | Create room (creator = admin) |
| POST | `/api/rooms/join` | Join by invite code |
| GET | `/api/rooms/:id` | Room details + members (with `isOnline`, `lastSeenAt`) |
| PATCH | `/api/rooms/:id` | Update (admin) |
| POST | `/api/rooms/:id/regenerate-invite` | New invite code (admin) |
| POST | `/api/rooms/:id/close` | Close room with AI summary (admin) |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/:roomId/messages` | History (cursor pagination) |
| *WS* | `/ws` | `room:join`, `message:send` → `message:new`, `typing:*`, `presence:online/offline` |

### Polls
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/polls` | Create single-choice poll |
| POST | `/api/polls/multi` | Create multi-choice poll |
| POST | `/api/polls/location` | Create location poll |
| GET | `/api/polls/room/:roomId` | All polls in a room |
| POST | `/api/polls/:id/vote` | Vote (single / location) |
| POST | `/api/polls/:id/toggle-vote` | Toggle vote (multi) |
| POST | `/api/polls/:id/location-option` | Add a map point |
| POST | `/api/polls/options/:optionId/assign` | Assign item to user |
| POST | `/api/polls/:id/close` / `/reopen` | Close / reopen (admin) |
| POST | `/api/polls/:id/approve` | Approve → Final Plan (admin) |

### Final Plan & AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/:roomId/final-plan` | Approved plan (grouped) |
| POST | `/api/ai/checklist` | Generate packing checklist |
| POST | `/api/ai/check-duplicate` | Detect duplicate poll |

---

## 🗺️ Roadmap

- [x] Auth, profiles, rooms, chat, polls (3 types), final plan, room lifecycle, AI
- [x] Frontend: auth UI, rooms list, three-panel room layout
- [x] Frontend: real-time chat with typing indicators
- [x] Frontend: polls UI with optimistic voting and real-time updates
- [x] Frontend: interactive maps (Leaflet + Nominatim)
- [x] Frontend: online presence (avatar ring + brightness + last-seen)
- [x] Frontend: public profile pages with field-level privacy
- [ ] Frontend: contacts (personal address book, no approval needed)
- [ ] Frontend: room invites by username + notifications center
- [ ] Frontend: privacy editor + user blocking
- [ ] Frontend: i18n (Ukrainian / English / Russian)
- [ ] Frontend: AI assistant UI + Final Plan tab
- [ ] Deployment (Vercel + Railway/Render) with a live demo

---

## 📄 License

MIT