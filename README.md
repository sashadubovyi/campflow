<div align="center">

# &u

### Plans made easy.

**&u** (and you) is a collaborative event-planning platform. Create an event, invite your people, chat in real time, run polls to agree on dates, places and what to pack — and let AI turn the conversation into a clear final plan.

</div>

---

## ✨ Features

- **Events** — create a space for a trip or event, invite people by code or link, manage members and admins.
- **Real‑time chat** — instant messaging per event over WebSockets.
- **Polls** — three poll types to reach decisions together:
  - **Single choice** — pick one option (e.g. a date).
  - **Checklist** — multi‑select with optional per‑item owner (great for "who brings what").
  - **Location** — propose points, vote, admin approves.
- **AI assistant (Gemini)** — generate a checklist from a short description, with duplicate‑poll detection.
- **Final plan** — when the admin closes an event, AI summarises everything into a final plan and saves a memory of the event to each participant's profile.
- **Profiles & contacts** — rich profiles (bio, hobbies with gradient tags, socials), contacts, privacy controls and blocking.
- **Notifications** — event invites and important updates.
- **i18n** — Ukrainian, Russian and English out of the box.
- **Responsive, mobile‑first UI** — bottom tab navigation on mobile, sidebar + multi‑column layout on desktop.

## 🧱 Tech stack

**Monorepo** managed with `pnpm` workspaces.

| Layer    | Technologies                                                                                  |
| -------- | --------------------------------------------------------------------------------------------- |
| Backend  | NestJS, Prisma 6, PostgreSQL, Redis, Socket.IO, JWT (access + refresh)                        |
| Frontend | React, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router, react‑hook‑form, i18next |
| AI       | Google Gemini API                                                                             |
| Tooling  | TypeScript, ESLint, Prettier                                                                  |

## 📁 Repository structure

```
andu/
├─ apps/
│  ├─ backend/     # NestJS API (auth, rooms, chat, polls, room lifecycle, AI)
│  └─ frontend/    # React + Vite client
├─ docker-compose.yml   # Postgres + Redis for local development
└─ pnpm-workspace.yaml
```

## 🚀 Getting started

### Prerequisites

- Node.js (LTS) and `pnpm`
- Docker (for Postgres + Redis)
- A Google Gemini API key — https://aistudio.google.com/apikey

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure (Postgres + Redis)

```bash
docker compose up -d
```

### 3. Configure backend environment

Create `apps/backend/.env.local`:

```env
DATABASE_URL="postgresql://campflow:campflow@localhost:5432/campflow"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="change-me"
JWT_REFRESH_SECRET="change-me"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"
PORT="3001"
NODE_ENV="development"
GEMINI_API_KEY="your-gemini-key"
```

### 4. Apply database migrations

```bash
cd apps/backend
pnpm exec prisma generate
pnpm exec prisma migrate deploy
cd ../..
```

### 5. Run the apps

```bash
# Backend (terminal 1)
pnpm --filter @campflow/backend dev

# Frontend (terminal 2)
pnpm --filter @campflow/frontend dev
```

- API: http://localhost:3001/api
- Web: http://localhost:5173

> Health check: `curl http://localhost:3001/api/health`

## 🔑 Environment variables

| Variable                                   | Description                           |
| ------------------------------------------ | ------------------------------------- |
| `DATABASE_URL`                             | PostgreSQL connection string          |
| `REDIS_URL`                                | Redis connection string               |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secrets for signing tokens            |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL`       | Token lifetimes                       |
| `GEMINI_API_KEY`                           | Google Gemini API key for AI features |
| `PORT`                                     | Backend port (default `3001`)         |

## 🗺️ Roadmap

- Map view with event locations
- Email verification
- Profile statistics, "My past events" history and shareable profile QR
- Mobile app wrapper
- Full rebrand to `@andu/*` packages

## 📄 License

Private project — all rights reserved.

<div align="center">

**&u — and you.**

</div>
