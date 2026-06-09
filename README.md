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

## 🚢 Deployment

### Backend (Railway / Heroku-like PaaS)

The backend ships with a `Procfile` and a relative-path media layout, so it's
PaaS-friendly out of the box.

```
apps/backend/Procfile
  web:     node dist/main
  release: pnpm prisma migrate deploy
```

1. Create a Postgres service and copy its `DATABASE_URL` into the app env.
2. Set the env variables from [`apps/backend/.env.example`](apps/backend/.env.example):
   `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `FRONTEND_URL`
   (origin of the Vercel deployment), `GEMINI_API_KEY` (optional).
3. Build command: `pnpm install --frozen-lockfile && pnpm --filter @campflow/backend build`.
4. Start command: `pnpm --filter @campflow/backend start:prod`.
5. The `release` step runs `prisma migrate deploy` so the DB is on the latest
   schema before the new image takes traffic.
6. Persistent storage for `apps/backend/uploads/` — mount a volume; the relative
   `/uploads/...` URLs are served by Nest's `useStaticAssets`.

### OAuth (Google / Apple Sign-In)

Sign-In кнопки на сторінках Login та Register активуються лише коли
налаштовані `VITE_GOOGLE_CLIENT_ID` / `VITE_APPLE_CLIENT_ID` на фронті
**та** `GOOGLE_OAUTH_CLIENT_ID` / `APPLE_OAUTH_CLIENT_ID` на бекенді.
Без них кнопки просто не рендеряться — звичайний email-логін працює як раніше.

**Google** (console.cloud.google.com → APIs & Services → Credentials):
- Створити OAuth 2.0 Client ID типу **Web application**.
- Authorized JavaScript origins: `https://<frontend-domain>` (+ `http://localhost:5173` для dev).
- Той самий Client ID кладеш у backend `GOOGLE_OAUTH_CLIENT_ID` і frontend `VITE_GOOGLE_CLIENT_ID`.

**Apple** (developer.apple.com → Certificates, Identifiers & Profiles):
- Створити **Services ID** з увімкненим Sign In with Apple.
- Додати домен фронта і Return URL (наприклад `https://<frontend-domain>/login`).
- Service ID іде у `APPLE_OAUTH_CLIENT_ID` (backend) і `VITE_APPLE_CLIENT_ID` (frontend);
  `VITE_APPLE_REDIRECT_URI` — той самий Return URL.

Backend перевіряє id_token самостійно через JWKS обох провайдерів — додаткові
пакети не потрібні. OAuth-юзери створюються з `password_hash = NULL` і
прив'язуються через таблицю `oauth_identities`. Якщо email вже зайнятий
існуючим email-логіном — нова OAuth-айдентичність додається до того ж юзера
(тільки якщо email верифікований провайдером).

### Frontend (Vercel)

`apps/frontend/vercel.json` proxies `/api/*`, `/uploads/*` and `/socket.io/*`
to the backend, and rewrites every other path to `index.html` so the SPA
routes resolve client-side.

Before the first deploy, replace `YOUR_BACKEND_DOMAIN` in `vercel.json` with
the Railway URL (e.g. `andu-backend.up.railway.app`). Alternatively, set
`VITE_API_URL` and skip the proxy — `getMediaUrl` handles both cases.

```
# Vercel project settings
Build command:   pnpm --filter @campflow/frontend build
Output dir:      apps/frontend/dist
Install command: pnpm install --frozen-lockfile
Root directory:  apps/frontend
```

## 🗺️ Roadmap

- Email verification and OAuth (Google / Apple)
- Realtime media in chat (Cloudinary / S3)
- WebRTC voice / video
- Mobile app wrapper
- Full rebrand to `@andu/*` packages

## 📄 License

Private project — all rights reserved.

<div align="center">

**&u — and you.**

</div>
