<div align="center">

# &u — and you.

**Спільне планування подій. В реальному часі.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma&logoColor=white)](https://www.prisma.io/)

</div>

---

**&u** — мобільна платформа для спільного планування поїздок, вечірок та будь-яких подій. Створи простір, запроси людей, домовтеся через голосування, спілкуйтесь у чаті — і AI перетворить усе на чіткий фінальний план.

## Що вміє

| Функція | Опис |
|---------|------|
| **Кімнати** | Приватний простір для кожної події — запрошення за кодом або посиланням |
| **Чат** | Миттєвий обмін повідомленнями через WebSocket; важливі повідомлення закріплюються |
| **Голосування** | Три типи: одиничний вибір, чек-лист із відповідальними, карта точок |
| **AI-асистент** | Gemini генерує чек-лист за коротким описом та підказує дублі |
| **Фінальний план** | AI-резюме події при закритті кімнати; зберігається в профілі кожного учасника |
| **Профілі** | Детальні профілі: фото, біо, хобі, соцмережі, контрольована приватність |
| **Контакти** | Взаємне додавання, блокування, пошук за username / email / телефоном |
| **Онбординг** | 9-кроковий квіз при реєстрації з перевіркою username та завантаженням аватара |
| **OAuth** | Вхід через Google, Apple, Facebook |
| **i18n** | Українська, Англійська, Російська |

## Стек

**Монорепо** на `pnpm` воркспейсах.

| Шар | Технології |
|-----|-----------|
| Backend | NestJS · Prisma 6 · PostgreSQL · Redis · Socket.IO · JWT (access + refresh) |
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS · TanStack Query · React Router v6 · Framer Motion · react-hook-form · i18next |
| AI | Google Gemini API |
| Auth | JWT + HttpOnly cookie refresh · Google OAuth 2.0 · Apple Sign-In · Facebook Login |
| Деплой | Railway (backend) · Vercel (frontend) |

## Структура репозиторію

```
campflow/
├── apps/
│   ├── backend/               # NestJS API
│   │   ├── src/
│   │   │   ├── auth/          # JWT, OAuth стратегії, refresh-токени
│   │   │   ├── users/         # Профілі, аватари, пошук
│   │   │   ├── rooms/         # CRUD кімнат, учасники, ролі
│   │   │   ├── chat/          # WebSocket чат, повідомлення
│   │   │   ├── polls/         # Голосування + фінальний план
│   │   │   ├── notifications/ # Сповіщення, запрошення
│   │   │   ├── contacts/      # Контакти, блокування
│   │   │   ├── presence/      # Онлайн-статус через Redis
│   │   │   └── ai/            # Gemini інтеграція
│   │   └── prisma/            # Схема БД та міграції
│   └── frontend/              # React + Vite клієнт
│       └── src/
│           ├── app/           # Router, AppShell, ProtectedRoute
│           ├── pages/         # Сторінки (кімнати, профіль, чат…)
│           └── shared/        # UI-компоненти, API-хуки, стор
├── docker-compose.yml         # Postgres + Redis для локальної розробки
└── pnpm-workspace.yaml
```

## Початок роботи

### Вимоги

- Node.js 20+ та `pnpm 9+`
- Docker (для Postgres + Redis)
- Google Gemini API ключ — [aistudio.google.com](https://aistudio.google.com/apikey)

### 1. Встановлення залежностей

```bash
pnpm install
```

### 2. Запуск інфраструктури

```bash
docker compose up -d
```

### 3. Налаштування backend

Створи `apps/backend/.env.local`:

```env
DATABASE_URL="postgresql://campflow:campflow@localhost:5432/campflow"
REDIS_URL="redis://localhost:6379"

JWT_ACCESS_SECRET="замінити-на-складний-рядок"
JWT_REFRESH_SECRET="інший-складний-рядок"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"

PORT="3001"
NODE_ENV="development"

FRONTEND_URL="http://localhost:5173"
GEMINI_API_KEY="твій-ключ"

# OAuth (необов'язково — без них OAuth-кнопки просто не відображаються)
GOOGLE_OAUTH_CLIENT_ID=""
APPLE_OAUTH_CLIENT_ID=""
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
```

### 4. Налаштування frontend

Створи `apps/frontend/.env.local`:

```env
VITE_API_URL="http://localhost:3001/api"

# OAuth (необов'язково)
VITE_GOOGLE_CLIENT_ID=""
VITE_APPLE_CLIENT_ID=""
VITE_APPLE_REDIRECT_URI="http://localhost:5173/login"
VITE_FACEBOOK_APP_ID=""
```

### 5. Застосування міграцій БД

```bash
cd apps/backend
pnpm exec prisma migrate deploy
pnpm exec prisma generate
cd ../..
```

### 6. Запуск

```bash
# Backend (термінал 1)
pnpm --filter @campflow/backend dev

# Frontend (термінал 2)
pnpm --filter @campflow/frontend dev
```

- API: http://localhost:3001/api
- Web: http://localhost:5173
- Health: `curl http://localhost:3001/api/health`

## Змінні середовища (повний список)

### Backend

| Змінна | Опис | Обов'язкова |
|--------|------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | Так |
| `REDIS_URL` | Redis connection string | Так |
| `JWT_ACCESS_SECRET` | Секрет підпису access-токена | Так |
| `JWT_REFRESH_SECRET` | Секрет підпису refresh-токена | Так |
| `JWT_ACCESS_TTL` | Час дії access-токена (напр. `15m`) | Так |
| `JWT_REFRESH_TTL` | Час дії refresh-токена (напр. `7d`) | Так |
| `FRONTEND_URL` | Origin фронтенду для CORS | Так |
| `PORT` | Порт backend-сервера (за замовч. `3001`) | Ні |
| `GEMINI_API_KEY` | Google Gemini для AI-функцій | Ні |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth Client ID | Ні |
| `APPLE_OAUTH_CLIENT_ID` | Apple Services ID | Ні |
| `FACEBOOK_APP_ID` | Facebook App ID | Ні |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | Ні |

### Frontend

| Змінна | Опис |
|--------|------|
| `VITE_API_URL` | URL бекенду (якщо без Vercel-проксі) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_APPLE_CLIENT_ID` | Apple Services ID |
| `VITE_APPLE_REDIRECT_URI` | Redirect URI для Apple Sign-In |
| `VITE_FACEBOOK_APP_ID` | Facebook App ID |

## Деплой

### Backend → Railway

1. Створи Postgres та Redis сервіси, скопіюй `DATABASE_URL` і `REDIS_URL`.
2. Встанови всі обов'язкові env-змінні з таблиці вище.
3. Build command:
   ```
   pnpm install --frozen-lockfile && pnpm --filter @campflow/backend build
   ```
4. Start command:
   ```
   pnpm --filter @campflow/backend start:prod
   ```
5. Release command (автоматично застосовує міграції перед стартом):
   ```
   pnpm --filter @campflow/backend exec prisma migrate deploy
   ```

> **Зображення** зберігаються як base64 прямо в PostgreSQL — окреме сховище файлів не потрібне.

### Frontend → Vercel

1. Підключи репозиторій до Vercel.
2. В налаштуваннях проекту:
   ```
   Build command:   pnpm --filter @campflow/frontend build
   Output dir:      apps/frontend/dist
   Install command: pnpm install --frozen-lockfile
   Root directory:  apps/frontend
   ```
3. Заміни `YOUR_BACKEND_DOMAIN` у `apps/frontend/vercel.json` на Railway URL бекенду.
4. Додай `VITE_*` змінні середовища для OAuth.

### OAuth налаштування

**Google:**
- [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application)
- Authorized JavaScript origins: `https://your-domain.com`
- Той самий Client ID → `GOOGLE_OAUTH_CLIENT_ID` (backend) та `VITE_GOOGLE_CLIENT_ID` (frontend)

**Apple:**
- [developer.apple.com](https://developer.apple.com) → Certificates → Sign In with Apple → Services ID
- Додай домен та Return URL (`https://your-domain.com/login`)
- `APPLE_OAUTH_CLIENT_ID` (backend) та `VITE_APPLE_CLIENT_ID` / `VITE_APPLE_REDIRECT_URI` (frontend)

**Facebook:**
- [developers.facebook.com](https://developers.facebook.com) → My Apps → Facebook Login
- `FACEBOOK_APP_ID` + `FACEBOOK_APP_SECRET` (backend) та `VITE_FACEBOOK_APP_ID` (frontend)

## Розробка

```bash
# Перевірка типів
pnpm --filter @campflow/frontend exec tsc --noEmit
pnpm --filter @campflow/backend exec tsc --noEmit

# Linting
pnpm --filter @campflow/backend lint

# Prisma studio (перегляд БД)
cd apps/backend && pnpm exec prisma studio

# Нова міграція
cd apps/backend && pnpm exec prisma migrate dev --name назва_міграції
```

## Роадмап

- [ ] Email-верифікація при реєстрації
- [ ] Медіа-вкладення в чаті (фото/відео через S3/Cloudinary)
- [ ] WebRTC голосові/відео кімнати
- [ ] Push-сповіщення (PWA / FCM)
- [ ] Нативний мобільний застосунок (React Native)
- [ ] Публічні профілі з QR-кодом для шерингу

## Ліцензія

Приватний проект — всі права захищено.

---

<div align="center">

**&u — and you.**

</div>
