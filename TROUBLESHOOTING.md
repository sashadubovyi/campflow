# Troubleshooting 502 / OAuth / Cookies на проді

> Швидкий dictionary з рішеннями реальних проблем після першого деплою
> на Railway (backend) + Vercel (frontend).

---

## 502 від Vercel або Railway

502 Bad Gateway = upstream (backend) не відповідає або падає. Перевіряти
послідовно:

### 1. Backend взагалі стартує?

Railway → Service → **View logs** → шукай `🚀 &u backend listening on :PORT`.
Якщо немає — стартап-помилка.

**Найчастіше:**
- `prisma migrate deploy` падає (відсутній `DATABASE_URL`, лагає міграція).
- Brak required ENV (наприклад `JWT_ACCESS_SECRET` — викидає виключення
  у `JwtModule.registerAsync`).
- Біндинг на неправильний port.

### 2. Перевір health-endpoint напряму

```bash
curl https://campflowbackend-production.up.railway.app/api/health
```

Має повернути JSON виду:
```json
{
  "status": "ok",
  "service": "andu-backend",
  "checks": { "database": "ok" },
  "configured": {
    "google": true,
    "facebook": true,
    "apple": false,
    "cors": true
  },
  "timestamp": "..."
}
```

- `database: error` → проблема з `DATABASE_URL` (Railway internal vs public URL).
- `configured.cors: false` → не виставлено `FRONTEND_URL`.
- `configured.google: false` → `GOOGLE_OAUTH_CLIENT_ID` не задано в Railway.

### 3. Якщо `/api/health` повертає 502 — backend взагалі лежить.

Подивитись Railway runtime logs:
```
TypeError: Cannot read properties of undefined (reading 'X')
```
або
```
Error: P1001: Can't reach database server
```

#### Часті причини у нас зараз:

| Симптом                                              | Причина / Фікс                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Error: P3009 Migrate found failed migrations`       | Часткова міграція з минулої спроби. Railway shell → `pnpm exec prisma migrate resolve --rolled-back <name>` |
| `password_hash NOT NULL violation`                   | Стара міграція без `add_oauth_identities` → колонка ще NOT NULL. Запусти `prisma migrate deploy` вручну |
| `enum value "facebook" does not exist`               | `add_facebook_provider` міграція не прокатилась                                            |
| App слухає `:3001` а Railway чекає на свій PORT     | Видали `PORT=3001` з Railway Variables → нехай використовується динамічний `$PORT`        |
| Build OK, але app crashes одразу                     | `prisma` був у `devDependencies` а Railway робить `--prod`. Тепер у `dependencies` ✅      |

### 4. Cookie / Auth refresh не працює (logged out при F5)

**Симптом:** після логіну все ОК, але після F5 знову на /login.

**Причина:** Vercel (`https://and-u.vercel.app`) і Railway
(`https://campflowbackend-production.up.railway.app`) — це **cross-site**.
Refresh-cookie з `SameSite=Lax` не передається у XHR-запитах на інший
домен.

**Фікс** уже в коді: `sameSite='none'` + `secure=true` у проді (NODE_ENV=production).
Перевір що `NODE_ENV=production` дійсно встановлено у Railway Variables.

### 5. CORS блокує

Якщо в Network видно `CORS error: 'https://andu-xyz.vercel.app' not allowed`:

- Бекенд тепер підтримує **кома-розділений** `FRONTEND_URL`.
- Для prod + preview-домени Vercel:
  ```
  FRONTEND_URL=https://and-u.vercel.app,https://*.vercel.app
  ```
  > Wildcard поки **не підтримується** — додавай конкретні preview-URL вручну,
  > або використовуй тільки prod-домен.

Перевір startup-лог `CORS allowlist: ...` — там видно фактичний список.

---

## OAuth-кнопки не показуються

| Кнопка    | Залежить від                                                  |
| --------- | ------------------------------------------------------------- |
| Google    | `VITE_GOOGLE_CLIENT_ID` (frontend) + `GOOGLE_OAUTH_CLIENT_ID` (backend) |
| Apple     | `VITE_APPLE_CLIENT_ID` + `VITE_APPLE_REDIRECT_URI` + `APPLE_OAUTH_CLIENT_ID` |
| Facebook  | `VITE_FACEBOOK_APP_ID` + `FACEBOOK_OAUTH_CLIENT_ID` + `FACEBOOK_OAUTH_CLIENT_SECRET` |

Після зміни Vercel env → **Redeploy** (фронт билдиться з env у build-time).

---

## Vercel rewrites → 502

Якщо у `vercel.json` ще лежить `YOUR_BACKEND_DOMAIN` placeholder — rewrites
рутять у нікуди. Заміни на реальний Railway-домен:

```json
{ "source": "/api/:path*", "destination": "https://campflowbackend-production.up.railway.app/api/:path*" },
{ "source": "/uploads/:path*", "destination": "https://campflowbackend-production.up.railway.app/uploads/:path*" },
{ "source": "/socket.io/:path*", "destination": "https://campflowbackend-production.up.railway.app/socket.io/:path*" }
```

Альтернатива — задати `VITE_API_URL=https://campflowbackend-production.up.railway.app`
і не використовувати rewrites; код фронта і так розрулить через
`getMediaUrl()`/`api.client`.

---

## Які ENV не потрібні зараз

- `REDIS_URL` — у коді **не використовується**. Можна видалити з Railway
  Variables (це залишок з .env.example, який я підчищу окремим
  комітом).
- `JWT_REFRESH_SECRET` — не використовується; refresh-токени не JWT, а
  random bytes у БД. Прибрав з .env.example раніше.

---

## Швидкий чекліст «нічого не працює»

1. `curl /api/health` повертає JSON? Якщо ні — backend лежить.
2. `NODE_ENV=production` у Railway? (інакше cookie не secure → cross-site
   не пройде)
3. `FRONTEND_URL` без хвостового слеша і збігається з origin Vercel?
4. У DevTools → Application → Cookies → `refresh_token` присутній і
   `SameSite=None; Secure`?
5. У Network на POST `/api/auth/refresh` запит має `Cookie: refresh_token=...`?
6. Vercel build pass? У вкладці Deployments → Functions/Edge має `200`.
