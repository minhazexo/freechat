# Free Deployment Plan: Netlify + Render + Aiven MySQL + Pusher

This project has two deployable parts:

- `frontend/`: React + Vite static app
- `backend/`: Laravel API

Recommended free stack:

- Frontend: Netlify
- Backend API: Render free Web Service
- Database: Aiven free MySQL
- Realtime WebSockets: Pusher Channels free Sandbox

## Why This Stack

Netlify is best for the built React app. Render can run the Laravel API as a PHP web service, but its free Postgres database expires after 30 days, so keep MySQL on Aiven instead. Pusher replaces the local `php artisan websockets:serve` process, which is not suitable for most free hosting platforms.

## 1. Create Free Pusher Channels App

1. Go to https://pusher.com/channels
2. Sign up, then open the Pusher dashboard.
3. Create a Channels app.
4. Choose a cluster close to your users, for example `ap2` for South Asia.
5. Copy these values:
   - App ID
   - Key
   - Secret
   - Cluster

Backend Render env:

```env
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=ap2
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
```

Frontend Netlify env:

```env
VITE_PUSHER_APP_KEY=your_app_key
VITE_PUSHER_APP_CLUSTER=ap2
VITE_PUSHER_HOST=
VITE_PUSHER_PORT=
VITE_PUSHER_SCHEME=https
```

Important: keep `VITE_PUSHER_HOST` empty for Pusher Cloud mode. Your `frontend/src/services/websocket.ts` already detects this.

## 2. Create Free Aiven MySQL

1. Go to https://aiven.io/free-tier
2. Create an Aiven account.
3. Create a free MySQL service.
4. Copy host, port, database, username, and password.

Render backend env:

```env
DB_CONNECTION=mysql
DB_HOST=your-aiven-host
DB_PORT=your-aiven-port
DB_DATABASE=your-aiven-database
DB_USERNAME=your-aiven-user
DB_PASSWORD=your-aiven-password
```

If Aiven requires SSL, add MySQL SSL config before production launch.

## 3. Deploy Backend API To Render

Create a new Render Web Service from your GitHub repo.

This repo now includes `render.yaml` and `backend/Dockerfile`, so the recommended setup is a Render Blueprint:

1. Push this repo to GitHub.
2. In Render, choose **New > Blueprint**.
3. Select this repo.
4. Render will use `render.yaml` and build the Laravel API with Docker.
5. Fill all `sync: false` environment variables in Render.

Manual settings if you do not use the Blueprint:

- Root directory: `backend`
- Runtime: Docker
- Dockerfile path:

```text
./backend/Dockerfile
```

- Docker context:

```text
./backend
```

Render env:

```env
APP_NAME=Chitchat
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-render-service.onrender.com
APP_FRONTEND_URL=https://your-netlify-site.netlify.app
CORS_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app

APP_KEY=base64:generate_this_locally
JWT_SECRET=generate_this_locally

DB_CONNECTION=mysql
DB_HOST=your-aiven-host
DB_PORT=your-aiven-port
DB_DATABASE=your-aiven-database
DB_USERNAME=your-aiven-user
DB_PASSWORD=your-aiven-password
MYSQL_ATTR_SSL_CA=

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local

BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your_pusher_app_id
PUSHER_APP_KEY=your_pusher_key
PUSHER_APP_SECRET=your_pusher_secret
PUSHER_APP_CLUSTER=your_pusher_cluster
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https

MODERATION_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
CHAT_RATE_LIMIT_PER_MINUTE=30
ENABLE_VIDEO_CHAT=true
ENABLE_SCREEN_SHARE=true
ENABLE_ANONYMOUS_LOGIN=true
ENABLE_REGISTRATION=true
```

Generate secrets locally:

```bash
cd backend
php artisan key:generate --show
php artisan jwt:secret --show
```

After first Render deploy, run migrations from Render Shell if available:

```bash
php artisan migrate --force
php artisan db:seed --force
```

The included Docker start command also runs `php artisan migrate --force` before serving the app, so schema updates run automatically on deploy. Run `php artisan db:seed --force` only if you want the demo admin/test users.

## 4. Deploy Frontend To Netlify

Create a new Netlify site from your GitHub repo.

This repo now includes `netlify.toml`, so Netlify can auto-detect:

- Base directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `frontend/dist`

Manual settings if needed:

```text
Base directory: frontend
Build command: npm ci && npm run build
Publish directory: frontend/dist
```

- Publish directory:

```text
frontend/dist
```

Netlify env:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
VITE_APP_NAME=Chitchat
VITE_APP_URL=https://your-netlify-site.netlify.app
VITE_PUSHER_APP_KEY=your_pusher_key
VITE_PUSHER_APP_CLUSTER=your_pusher_cluster
VITE_PUSHER_HOST=
VITE_PUSHER_PORT=
VITE_PUSHER_SCHEME=https
```

SPA routing support is already included in both `netlify.toml` and `frontend/public/_redirects`:

```text
/* /index.html 200
```

## 5. Expected Free-Tier Limits

This setup is good for demos, testing, and early users.

Known limitations:

- Render free web services spin down after idle time, so first API request can be slow.
- Render free services have ephemeral local storage, so do not rely on uploaded files staying forever.
- Aiven free MySQL is small, typically 1 GB.
- Pusher free Sandbox is suitable for small realtime apps, not heavy public traffic.
- Netlify free sites have hard usage limits.

## 6. Launch Checklist

Before going public:

1. Confirm `/api/ws-test` works on Render.
2. Confirm login/register works from Netlify.
3. Confirm `POST /api/broadcasting/auth` returns 200.
4. Confirm two users can match and exchange messages.
5. Check Pusher dashboard for active connections and events.
6. Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\api-smoke.ps1 -BaseUrl "https://your-render-service.onrender.com/api"
```
