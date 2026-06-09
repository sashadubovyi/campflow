# Deployment

> **Architecture** — `apps/backend` (Railway / Render / fly.io) + `apps/frontend`
> (Vercel / Netlify). Постгрес у тому ж PaaS або керований (Supabase / Neon).

---

## 0. Pre-flight checklist

- [ ] Тести зелені — `pnpm --filter @campflow/backend test`
- [ ] TypeCheck обох пакетів — `pnpm --filter @campflow/backend exec tsc --noEmit && pnpm --filter @campflow/frontend exec tsc --noEmit`
- [ ] Lint без помилок (опц.) — `pnpm -r lint`
- [ ] `apps/backend/prisma/migrations/` містить усі останні міграції — git status чистий
- [ ] `apps/backend/.env.example` і `apps/frontend/.env.example` оновлені
- [ ] DEPLOY.md (цей файл) і README.md актуальні

---

## 1. Backend — Railway (рекомендовано)

### 1.1. Створити сервіси

1. **Postgres**: `New project → Database → PostgreSQL`. Скопіюй `DATABASE_URL`.
2. **Web service**: `New service → GitHub repo`. Root directory: `/`.

### 1.2. Build & Start

| Поле               | Значення                                                                  |
| ------------------ | ------------------------------------------------------------------------- |
| Install command    | `corepack enable && pnpm install --frozen-lockfile`                       |
| Build command      | `pnpm --filter @campflow/backend exec prisma generate && pnpm --filter @campflow/backend build` |
| Start command      | `pnpm --filter @campflow/backend start:prod`                              |
| Pre-deploy / Release | `pnpm --filter @campflow/backend exec prisma migrate deploy`            |
| Healthcheck path   | `/api/health`                                                             |

> Альтернатива: вже є `apps/backend/Procfile` з `web: node dist/main` і
> `release: pnpm prisma migrate deploy` — підтримується Heroku / Render /
> Dokku без додаткової конфігурації.

### 1.3. Volume для uploads (КРИТИЧНО)

Завантажені аватари / обкладинки лежать у `apps/backend/uploads/`. Без
persistent volume вони зникнуть при наступному рестарті/деплої.

- Railway: `Service → Settings → Volumes → New volume` → mount `/app/apps/backend/uploads`
- fly.io: `fly volumes create andu_uploads --size 1` + `[mounts]` у `fly.toml`
- Render: Disks → `/opt/render/project/src/apps/backend/uploads`

Альтернатива: винести медіа на Cloudinary / S3 (TODO у roadmap).

### 1.4. Environment variables (`apps/backend/.env.example` → Railway Variables)

| Variable                       | Required | Notes                                                  |
| ------------------------------ | -------- | ------------------------------------------------------ |
| `DATABASE_URL`                 | **yes**  | З Postgres-сервісу                                     |
| `PORT`                         | yes      | Railway виставляє автоматично; локально 3001           |
| `NODE_ENV`                     | yes      | `production`                                           |
| `FRONTEND_URL`                 | **yes**  | Origin Vercel-фронта без слеша; CORS allowlist         |
| `JWT_ACCESS_SECRET`            | **yes**  | `openssl rand -base64 64`                              |
| `JWT_ACCESS_TTL`               | yes      | `15m`                                                  |
| `JWT_REFRESH_TTL`              | yes      | `7d`                                                   |
| `GEMINI_API_KEY`               | optional | AI-фічі відключаються коли порожньо                    |
| `GOOGLE_OAUTH_CLIENT_ID`       | optional | Sign-In кнопка зникає коли порожньо                    |
| `APPLE_OAUTH_CLIENT_ID`        | optional | Apple Services ID                                      |
| `FACEBOOK_OAUTH_CLIENT_ID`     | optional | App ID                                                 |
| `FACEBOOK_OAUTH_CLIENT_SECRET` | optional | Тільки на сервері. Потрібен для debug_token валідації  |

---

## 2. Frontend — Vercel

### 2.1. Project config

| Поле              | Значення                                       |
| ----------------- | ---------------------------------------------- |
| Framework Preset  | Vite                                           |
| Root Directory    | `apps/frontend`                                |
| Build Command     | `pnpm --filter @campflow/frontend build`       |
| Output Directory  | `dist`                                         |
| Install Command   | `pnpm install --frozen-lockfile` (з кореня)    |

> `apps/frontend/vercel.json` має rewrites:
> `/api/*`, `/uploads/*`, `/socket.io/*` → бекенд, решта → `index.html`.
> Відредагуй `YOUR_BACKEND_DOMAIN` перед першим деплоєм.

### 2.2. Environment variables (`apps/frontend/.env.example`)

| Variable                    | Required | Notes                                                              |
| --------------------------- | -------- | ------------------------------------------------------------------ |
| `VITE_API_URL`              | optional | Залиш пустим якщо юзаєш `vercel.json` rewrites; інакше origin API  |
| `VITE_GOOGLE_CLIENT_ID`     | optional | Той самий що `GOOGLE_OAUTH_CLIENT_ID` на бекенді                   |
| `VITE_APPLE_CLIENT_ID`      | optional | Apple Services ID                                                  |
| `VITE_APPLE_REDIRECT_URI`   | optional | Має точно збігатись з Return URL у Apple Services ID               |
| `VITE_FACEBOOK_APP_ID`      | optional | App ID (не secret!)                                                |

---

## 3. OAuth setup checklist

### Google (Sign In with Google)

1. **console.cloud.google.com** → Project → APIs & Services → Credentials.
2. **Create credentials → OAuth client ID → Web application**.
3. Authorized JavaScript origins:
   - `https://<frontend-domain>` (Vercel)
   - `http://localhost:5173` (dev)
4. Authorized redirect URIs — **порожньо** (Google One Tap використовує
   тільки origins).
5. Client ID → у `GOOGLE_OAUTH_CLIENT_ID` (backend) і `VITE_GOOGLE_CLIENT_ID` (frontend).

### Apple (Sign In with Apple)

1. **developer.apple.com** → Certificates, Identifiers & Profiles.
2. **Identifiers → +** → Services IDs.
3. Description (видимий юзеру), Identifier (≈ `app.andu.signin`) → continue.
4. ✅ Sign In with Apple → Configure → Web Domain `<frontend-domain>` + Return URLs `https://<frontend-domain>/login`.
5. Service ID → у `APPLE_OAUTH_CLIENT_ID` (backend) і `VITE_APPLE_CLIENT_ID` (frontend);
   Return URL → `VITE_APPLE_REDIRECT_URI`.

### Facebook (Login)

1. **developers.facebook.com** → My Apps → Create app → Use case `Authentication`.
2. Settings → Basic: App ID, App Secret.
3. Facebook Login → Settings:
   - Valid OAuth Redirect URIs: `https://<frontend-domain>/` (поки використовуємо `FB.login` SDK — exact match не обов'язковий, але рекомендований).
   - Client OAuth Login: ✅
   - Web OAuth Login: ✅
4. **App Review → Permissions → email** (для prod вимагає review якщо
   юзерів > 100; dev mode працює зі своїм акаунтом).
5. App ID → `FACEBOOK_OAUTH_CLIENT_ID` (backend) і `VITE_FACEBOOK_APP_ID` (frontend);
   App Secret → **тільки** `FACEBOOK_OAUTH_CLIENT_SECRET` (backend).

---

## 4. Post-deploy smoke test

```
# Health
curl https://<backend>/api/health
# → {"status":"ok","service":"andu-backend",...}

# Auth (email)
curl -X POST https://<backend>/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"qa@andu.app","password":"test1234","fullName":"QA Bot"}'

# Frontend SPA fallback
curl -sI https://<frontend>/some-deep-route | grep -E "200|content-type"
```

Браузерний smoke:

- [ ] /register → реєстрація email/пароль
- [ ] /login → вхід
- [ ] Google кнопка → OAuth → новий юзер створено / прив'язано
- [ ] Apple кнопка (на HTTPS)
- [ ] Facebook кнопка
- [ ] /rooms — створення кімнати, чат у реальному часі (Socket.IO)
- [ ] Upload аватара → файл з'являється у `/uploads/avatars/<name>` через
      проксі/rewrite
- [ ] DM — `/dm/<username>` → відправити повідомлення
- [ ] Reply на повідомлення в кімнаті — long-press на mobile + 3 dots
- [ ] Push новий коміт → release-фаза знову прогнала `prisma migrate deploy`

---

## 5. Що готувати наперед

**Доступи / акаунти:**
- GitHub (репо `sashadubovyi/campflow`)
- Railway (платіжна картка для Postgres ≈ $5/міс)
- Vercel (безкоштовний tier)
- Google Cloud (безкоштовно)
- Apple Developer ($99/рік для Sign In with Apple)
- Facebook Developers (безкоштовно)
- Google AI Studio (Gemini key, безкоштовний tier)

**Перед першим деплоєм:**
- [ ] Згенерувати `JWT_ACCESS_SECRET` (`openssl rand -base64 64`)
- [ ] Створити Postgres → скопіювати `DATABASE_URL`
- [ ] Виконати checklist для трьох OAuth-провайдерів (вище)
- [ ] У `apps/frontend/vercel.json` замінити `YOUR_BACKEND_DOMAIN` на реальний Railway-домен
- [ ] У Vercel і Railway проставити всі ENV з таблиць §1.4 і §2.2

**Перед публічним релізом:**
- [ ] Зареєструвати домен (наприклад `andu.app`)
- [ ] Direct DNS на Vercel; додати кастомний домен у Railway для бекенда
- [ ] Оновити CORS (`FRONTEND_URL`), OAuth origins/redirects на кінцевий домен
- [ ] Налаштувати email-провайдера (для майбутнього email-verification — не входить у v1)
